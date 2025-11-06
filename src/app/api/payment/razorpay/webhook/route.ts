import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { encryptPaymentData } from '@/lib/encryption';
import QRCode from 'qrcode';

/**
 * Webhook endpoint for Razorpay payment callbacks
 * This ensures payments are captured even if frontend verification fails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Razorpay webhook received:', JSON.stringify(body, null, 2));

    // Razorpay webhook payload structure
    const { event: webhookEvent, payload } = body;

    // Only process payment.captured events
    if (webhookEvent !== 'payment.captured') {
      console.log('⚠️ Ignoring webhook event:', webhookEvent);
      return NextResponse.json({ received: true });
    }

    const payment = payload.payment.entity;
    const order = payload.order.entity;

    console.log('💳 Processing payment webhook:', {
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount / 100, // Razorpay amounts are in paise
      status: payment.status,
    });

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayTxnId: payment.id },
          { gatewayOrderId: order.id }
        ]
      },
      include: {
        ticket: true
      }
    });

    if (existingPayment) {
      console.log('✅ Payment already processed:', existingPayment.id);
      return NextResponse.json({ received: true, message: 'Payment already processed' });
    }

    // Try to find order data from notes or metadata
    // Note: This is a fallback - ideally orderData should be stored when order is created
    const orderNotes = order.notes || {};
    const eventId = orderNotes.eventId;
    
    if (!eventId) {
      console.log('⚠️ No eventId found in order notes, cannot process webhook');
      return NextResponse.json({ received: true, message: 'No eventId found' });
    }

    // Find event
    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!eventRecord) {
      console.log('❌ Event not found:', eventId);
      return NextResponse.json({ received: true, message: 'Event not found' });
    }

    // Extract user details from payment notes or customer
    const customerEmail = payment.email || orderNotes.guestEmail;
    const customerName = payment.notes?.name || orderNotes.guestName || 'Guest';
    const customerPhone = payment.contact || orderNotes.guestPhone || '';

    if (!customerEmail) {
      console.log('⚠️ No customer email found, cannot create user');
      return NextResponse.json({ received: true, message: 'No customer email found' });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email: customerEmail }
    });

    if (!user) {
      console.log('👤 Creating user from webhook:', customerEmail);
      user = await prisma.user.create({
        data: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          role: 'USER',
          password: null,
        }
      });
    }

    // Calculate quantity from amount
    const amountInRupees = payment.amount / 100;
    const quantity = Math.round(amountInRupees / eventRecord.price);

    // Create ticket and payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          userId: user!.id,
          eventId: eventRecord.id,
          quantity: quantity || 1,
          totalPrice: amountInRupees,
          status: 'CONFIRMED',
        },
      });

      // Generate QR code
      const qrData = JSON.stringify({
        ticketId: ticket.id,
        userId: ticket.userId,
        eventId: ticket.eventId,
        quantity: ticket.quantity,
      });
      const qrCode = await QRCode.toDataURL(qrData);

      // Update ticket with QR code
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { qrCode },
      });

      // Create payment record
      const encryptedGatewayResponse = encryptPaymentData({
        signature: payment.id,
        orderId: order.id,
        paymentId: payment.id,
      });

      const paymentRecord = await tx.payment.create({
        data: {
          userId: user!.id,
          ticketId: ticket.id,
          amount: amountInRupees,
          currency: 'INR',
          status: 'COMPLETED',
          paymentMethod: payment.method || 'RAZORPAY',
          gateway: 'RAZORPAY',
          gatewayOrderId: order.id,
          gatewayTxnId: payment.id,
          gatewayResponse: encryptedGatewayResponse,
        },
      });

      // Update event sold tickets
      await tx.event.update({
        where: { id: eventRecord.id },
        data: {
          soldTickets: {
            increment: quantity || 1
          }
        },
      });

      return { ticket, payment: paymentRecord };
    });

    console.log('✅ Webhook processed successfully:', {
      ticketId: result.ticket.id,
      paymentId: result.payment.id,
    });

    return NextResponse.json({ received: true, success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Always return 200 to Razorpay to prevent retries
    return NextResponse.json(
      { received: true, error: (error as Error).message },
      { status: 200 }
    );
  }
}

