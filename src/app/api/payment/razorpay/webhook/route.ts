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
    let eventId = orderNotes.eventId;
    
    // If eventId not in notes, try to find it from existing orders in database
    // by matching order ID
    if (!eventId) {
      console.log('⚠️ No eventId in order notes, checking database for existing order...');
      
      // Try to find a payment with this order ID to get event context
      const existingOrderPayment = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: order.id,
        },
        include: {
          ticket: {
            select: {
              eventId: true,
            },
          },
        },
      });
      
      if (existingOrderPayment?.ticket?.eventId) {
        eventId = existingOrderPayment.ticket.eventId;
        console.log('✅ Found eventId from existing payment:', eventId);
      } else {
        // Last resort: try to find event by matching amount and recent date
        // This is not ideal but better than failing completely
        const amountInRupees = payment.amount / 100;
        const recentEvents = await prisma.event.findMany({
          where: {
            isActive: true,
            status: 'PUBLISHED',
            price: {
              lte: amountInRupees, // Event price should be <= payment amount
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        });
        
        // Try to match by calculating quantity
        for (const event of recentEvents) {
          const possibleQuantity = Math.round(amountInRupees / event.price);
          if (possibleQuantity > 0 && possibleQuantity <= 10) {
            eventId = event.id;
            console.log(`✅ Matched event by amount: ${event.title} (${possibleQuantity} tickets)`);
            break;
          }
        }
      }
    }
    
    if (!eventId) {
      console.error('❌ No eventId found, cannot process webhook. Order ID:', order.id);
      console.error('   Payment ID:', payment.id);
      console.error('   Amount:', payment.amount / 100);
      console.error('   Order Notes:', JSON.stringify(orderNotes, null, 2));
      // Return 500 to trigger Razorpay retry (they will retry failed webhooks)
      return NextResponse.json(
        { received: false, error: 'No eventId found' },
        { status: 500 }
      );
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
    let customerEmail = payment.email || orderNotes.guestEmail || payment.notes?.email;
    const customerName = payment.notes?.name || orderNotes.guestName || payment.customer_details?.name || 'Guest';
    let customerPhone = payment.contact || orderNotes.guestPhone || payment.customer_details?.contact || '';

    // If email still not found, try to extract from payment entity
    if (!customerEmail && payment.entity) {
      customerEmail = payment.entity.email;
      customerPhone = payment.entity.contact || customerPhone;
    }

    if (!customerEmail) {
      console.error('❌ No customer email found, cannot create user');
      console.error('   Payment entity:', JSON.stringify(payment, null, 2));
      console.error('   Order notes:', JSON.stringify(orderNotes, null, 2));
      // Return 500 to trigger retry - maybe email will be available in retry
      return NextResponse.json(
        { received: false, error: 'No customer email found' },
        { status: 500 }
      );
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
    console.error('   Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    
    // Return 500 for retryable errors (database issues, network issues)
    // Return 200 for non-retryable errors (validation errors, data issues)
    const errorMessage = (error as Error).message.toLowerCase();
    const isRetryable = 
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('database') ||
      errorMessage.includes('network');
    
    if (isRetryable) {
      console.log('   Returning 500 for retryable error');
      return NextResponse.json(
        { received: false, error: (error as Error).message },
        { status: 500 }
      );
    } else {
      console.log('   Returning 200 for non-retryable error');
      return NextResponse.json(
        { received: true, error: (error as Error).message },
        { status: 200 }
      );
    }
  }
}

