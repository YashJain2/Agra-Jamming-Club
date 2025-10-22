import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { sendEmail, emailTemplates } from '@/lib/email';
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
  }).optional(), // Make orderData optional for Razorpay direct calls
});

// POST /api/payment/razorpay/verify - Verify Razorpay payment
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Payment verification started...');
    console.log('📋 Request URL:', request.url);
    console.log('📋 Request Method:', request.method);
    console.log('📋 Request Headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const session = await getServerSession(authOptions);
    const body = await request.json();
    console.log('📋 Request body received:', JSON.stringify(body, null, 2));
    
    const validatedData = verifyPaymentSchema.parse(body);
    console.log('✅ Data validation passed');

    const { orderId, paymentId, signature, orderData } = validatedData;
    console.log('🔍 Payment details:', { orderId, paymentId, eventId: orderData?.eventId });

    // If orderData is not present, this is a direct Razorpay callback
    if (!orderData) {
      console.log('⚠️ Direct Razorpay callback - no orderData provided');
      return NextResponse.json(
        { error: 'Direct Razorpay callbacks not supported. Please use the frontend payment flow.' },
        { status: 400 }
      );
    }

    // Verify payment signature
    console.log('🔐 Verifying payment signature...');
    const isSignatureValid = await verifyPaymentSignature(orderId, paymentId, signature);
    console.log('🔐 Signature valid:', isSignatureValid);
    
    if (!isSignatureValid) {
      console.log('❌ Invalid payment signature');
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Check if event still exists and is available (use Prisma ORM for this)
    console.log('🎫 Checking event availability...');
    const event = await prisma.event.findUnique({
      where: { id: orderData.eventId },
    });

    if (!event) {
      console.log('❌ Event not found:', orderData.eventId);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.title, 'Status:', event.status);

    if (event.status !== 'PUBLISHED') {
      console.log('❌ Event not published:', event.status);
      return NextResponse.json(
        { error: 'Event is no longer available' },
        { status: 400 }
      );
    }

    // Check if there are still enough tickets available
    const availableTickets = event.maxTickets - event.soldTickets;
    console.log('🎫 Available tickets:', availableTickets, 'Required:', orderData.quantity);
    
    if (availableTickets < orderData.quantity) {
      console.log('❌ Not enough tickets available');
      return NextResponse.json(
        { error: `Only ${availableTickets} tickets available now` },
        { status: 400 }
      );
    }

    // Check if user already has tickets for this event (only for authenticated users)
    if (!orderData.isGuestCheckout && orderData.userId) {
      console.log('🔍 Checking for existing tickets...');
      const existingTicketsResult = await prisma.$queryRaw`
        SELECT id FROM "Ticket" 
        WHERE "userId" = ${orderData.userId} 
        AND "eventId" = ${orderData.eventId}
        AND status IN ('PENDING', 'CONFIRMED')
      `;

      const existingTickets = existingTicketsResult as any[];
      if (existingTickets.length > 0) {
        console.log('❌ User already has tickets for this event');
        return NextResponse.json(
          { error: 'You already have tickets for this event' },
          { status: 400 }
        );
      }
    }

    // Create ticket using Prisma ORM (minimal approach)
    console.log('🎫 Creating ticket with Prisma ORM...');
    
    console.log('🔍 Ticket data:', {
      userId: orderData.userId,
      eventId: orderData.eventId,
      quantity: orderData.quantity,
      totalAmount: orderData.totalAmount
    });
    
    // For guest checkout, we need to create a temporary user or handle it differently
    let ticketUserId = orderData.userId;
    
    if (orderData.isGuestCheckout && !orderData.userId) {
      // For guest tickets, create a user with the actual guest details
      console.log('🔍 Creating guest user with details:', {
        name: orderData.guestName,
        email: orderData.guestEmail,
        phone: orderData.guestPhone
      });
      
      // Check if a user with this email already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: orderData.guestEmail }
      });
      
      if (existingUser) {
        ticketUserId = existingUser.id;
        console.log('✅ Using existing user:', ticketUserId);
      } else {
        // Create a new user with guest details
        const newGuestUser = await prisma.user.create({
          data: {
            email: orderData.guestEmail,
            name: orderData.guestName,
            phone: orderData.guestPhone,
            role: 'USER',
            password: null, // No password for guest user
          }
        });
        ticketUserId = newGuestUser.id;
        console.log('✅ Created new guest user:', ticketUserId);
      }
    }
    
    const ticket = await prisma.ticket.create({
      data: {
        userId: ticketUserId, // Use the determined user ID
        eventId: orderData.eventId,
        quantity: orderData.quantity,
        totalPrice: orderData.totalAmount,
        status: 'CONFIRMED',
      },
    });

    console.log('✅ Ticket created successfully:', ticket.id);

    // Get event and user details separately
    const eventDetails = await prisma.event.findUnique({
      where: { id: orderData.eventId },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        venue: true,
        price: true,
      },
    });

    const userDetails = await prisma.user.findUnique({
      where: { id: ticketUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    // Generate QR code for the ticket
    console.log('🔲 Generating QR code...');
    const qrData = JSON.stringify({
      ticketId: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
    });

    const qrCode = await QRCode.toDataURL(qrData);
    console.log('✅ QR code generated');
    
    // Update ticket with QR code
    console.log('🔄 Updating ticket with QR code...');
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCode: qrCode },
    });

    // Update event sold tickets count
    console.log('🔄 Updating event sold tickets count...');
    await prisma.event.update({
      where: { id: orderData.eventId },
      data: { 
        soldTickets: {
          increment: orderData.quantity
        }
      },
    });
    console.log('✅ Event sold tickets updated');

    // Format the response
    const formattedTicket = {
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      status: ticket.status,
      specialRequests: null, // Not available in minimal approach
      isGuestTicket: orderData.isGuestCheckout, // Use from orderData
      isFreeAccess: false, // Default value
      subscriptionId: null, // Default value
      createdAt: ticket.createdAt,
      qrCode: qrCode,
      event: eventDetails,
      user: userDetails,
      // Add guest info from orderData for display
      guestName: orderData.isGuestCheckout ? orderData.guestName : null,
      guestEmail: orderData.isGuestCheckout ? orderData.guestEmail : null,
      guestPhone: orderData.isGuestCheckout ? orderData.guestPhone : null,
    };

    // Log the payment success
    console.log('📝 Logging payment success...');
    await prisma.auditLog.create({
      data: {
        userId: orderData.userId,
        action: 'PAYMENT_SUCCESS',
        entity: 'Ticket',
        entityId: formattedTicket.id,
        newValues: {
          paymentId: paymentId,
          orderId: orderId,
          eventId: formattedTicket.eventId,
          quantity: formattedTicket.quantity,
          totalPrice: formattedTicket.totalPrice,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Send confirmation email
    console.log('📧 Sending confirmation email...');
    const guestDetails = {
      name: orderData.guestName || userDetails?.name || 'Guest',
      email: orderData.guestEmail || userDetails?.email || '',
      phone: orderData.guestPhone || userDetails?.phone || '',
    };

    const emailTemplate = emailTemplates.guestTicketConfirmation(
      guestDetails,
      {
        quantity: orderData.quantity,
        totalPrice: orderData.totalAmount,
      },
      {
        title: eventDetails?.title || 'Event',
        date: eventDetails?.date || new Date(),
        time: eventDetails?.time || 'TBD',
        venue: eventDetails?.venue || 'TBD',
      }
    );

    const emailSent = await sendEmail({
      to: guestDetails.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (emailSent) {
      console.log('✅ Confirmation email sent successfully');
    } else {
      console.log('⚠️ Failed to send confirmation email');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...formattedTicket,
        emailSent: emailSent,
      },
      message: 'Payment successful! Your tickets have been booked.',
      paymentId: paymentId,
      orderId: orderId,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', (error as Error).message);
    console.error('❌ Error stack:', (error as Error).stack);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment verification failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
