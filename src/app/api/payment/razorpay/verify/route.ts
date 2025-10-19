import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { z } from 'zod';
import QRCode from 'qrcode';

// Validation schema for payment verification
const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
  orderData: z.object({
    eventId: z.string(),
    quantity: z.number(),
    totalAmount: z.number(),
    specialRequests: z.string().optional(),
    guestName: z.string().optional(),
    guestEmail: z.string().optional(),
    guestPhone: z.string().optional(),
    userId: z.string().nullable(),
    isGuestCheckout: z.boolean(),
  }),
});

// POST /api/payment/razorpay/verify - Verify Razorpay payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    const { orderId, paymentId, signature, orderData } = validatedData;

    // Verify payment signature
    const isSignatureValid = await verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Check if event still exists and is available
    const event = await prisma.event.findUnique({
      where: { id: orderData.eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event is no longer available' },
        { status: 400 }
      );
    }

    // Check if there are still enough tickets available
    const availableTickets = event.maxTickets - event.soldTickets;
    if (availableTickets < orderData.quantity) {
      return NextResponse.json(
        { error: `Only ${availableTickets} tickets available now` },
        { status: 400 }
      );
    }

    // Check if user already has tickets for this event (only for authenticated users)
    if (!orderData.isGuestCheckout && orderData.userId) {
      const existingTickets = await prisma.ticket.findMany({
        where: {
          userId: orderData.userId,
          eventId: orderData.eventId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      });

      if (existingTickets.length > 0) {
        return NextResponse.json(
          { error: 'You already have tickets for this event' },
          { status: 400 }
        );
      }
    }

    // Create ticket using raw SQL to handle missing columns
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$executeRaw`
      INSERT INTO "Ticket" (
        id, "userId", "eventId", quantity, "totalPrice", 
        "specialRequests", status, "isGuestTicket", 
        "guestName", "guestEmail", "guestPhone", 
        "isFreeAccess", "subscriptionId", "createdAt", "updatedAt"
      ) VALUES (
        ${ticketId}, ${orderData.userId}, ${orderData.eventId}, ${orderData.quantity}, ${orderData.totalAmount},
        ${orderData.specialRequests || null}, 'CONFIRMED', ${orderData.isGuestCheckout},
        ${orderData.isGuestCheckout ? orderData.guestName : null}, 
        ${orderData.isGuestCheckout ? orderData.guestEmail : null}, 
        ${orderData.isGuestCheckout ? orderData.guestPhone : null},
        false, null, NOW(), NOW()
      )
    `;

    // Get the created ticket with event details
    const ticket = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."specialRequests",
        t."isGuestTicket",
        t."guestName",
        t."guestEmail",
        t."guestPhone",
        t."isFreeAccess",
        t."subscriptionId",
        t."createdAt",
        e.title as "eventTitle",
        e.date as "eventDate",
        e.time as "eventTime",
        e.venue as "eventVenue",
        e.price as "eventPrice",
        u.name as "userName",
        u.email as "userEmail",
        u.phone as "userPhone"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      LEFT JOIN "User" u ON t."userId" = u.id
      WHERE t.id = ${ticketId}
    `;

    const createdTicket = ticket[0];

    // Generate QR code for the ticket
    const qrData = JSON.stringify({
      ticketId: createdTicket.id,
      userId: createdTicket.userId,
      eventId: createdTicket.eventId,
      quantity: createdTicket.quantity,
    });

    const qrCode = await QRCode.toDataURL(qrData);
    
    // Update ticket with QR code
    await prisma.$executeRaw`
      UPDATE "Ticket" 
      SET "qrCode" = ${qrCode}
      WHERE id = ${ticketId}
    `;

    // Update event sold tickets count
    await prisma.$executeRaw`
      UPDATE "Event" 
      SET "soldTickets" = "soldTickets" + ${orderData.quantity}
      WHERE id = ${orderData.eventId}
    `;

    // Format the response
    const formattedTicket = {
      id: createdTicket.id,
      userId: createdTicket.userId,
      eventId: createdTicket.eventId,
      quantity: createdTicket.quantity,
      totalPrice: createdTicket.totalPrice,
      status: createdTicket.status,
      specialRequests: createdTicket.specialRequests,
      isGuestTicket: createdTicket.isGuestTicket,
      guestName: createdTicket.guestName,
      guestEmail: createdTicket.guestEmail,
      guestPhone: createdTicket.guestPhone,
      isFreeAccess: createdTicket.isFreeAccess,
      subscriptionId: createdTicket.subscriptionId,
      createdAt: createdTicket.createdAt,
      qrCode: qrCode,
      event: {
        id: createdTicket.eventId,
        title: createdTicket.eventTitle,
        date: createdTicket.eventDate,
        time: createdTicket.eventTime,
        venue: createdTicket.eventVenue,
        price: createdTicket.eventPrice,
      },
      user: createdTicket.userId ? {
        id: createdTicket.userId,
        name: createdTicket.userName,
        email: createdTicket.userEmail,
        phone: createdTicket.userPhone,
      } : null,
    };

    // Log the payment success
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" (
        id, "userId", action, entity, "entityId", 
        "newValues", "ipAddress", "userAgent", "createdAt"
      ) VALUES (
        ${`audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
        ${orderData.userId || null}, 'PAYMENT_SUCCESS', 'Ticket', ${formattedTicket.id},
        ${JSON.stringify({
          paymentId: paymentId,
          orderId: orderId,
          eventId: formattedTicket.eventId,
          quantity: formattedTicket.quantity,
          totalPrice: formattedTicket.totalPrice,
        })},
        ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null},
        ${request.headers.get('user-agent') || null},
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      data: formattedTicket,
      message: 'Payment successful! Your tickets have been booked.',
      paymentId: paymentId,
      orderId: orderId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
