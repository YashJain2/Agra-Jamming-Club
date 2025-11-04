import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder, razorpayConfig } from '@/lib/razorpay';
import { checkUserSubscriptionStatus, hasUserUsedFreeAccessThisMonth } from '@/lib/subscription-utils';
import { z } from 'zod';

// Validation schema for creating payment order
const createOrderSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per booking'),
  specialRequests: z.string().optional(),
  // Guest checkout fields
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
});

// POST /api/payment/razorpay/create-order - Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const { eventId, quantity, specialRequests, guestName, guestEmail, guestPhone } = validatedData;

    // Determine if this is a guest checkout or authenticated user
    const isGuestCheckout = !session;
    
    // For guest checkout, require all guest details to be provided
    if (isGuestCheckout) {
      if (!guestName || !guestEmail || !guestPhone) {
        return NextResponse.json(
          { error: 'Please provide all guest details (name, email, phone) for guest checkout' },
          { status: 400 }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        return NextResponse.json(
          { error: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
      
      // Validate phone number (basic validation)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(guestPhone)) {
        return NextResponse.json(
          { error: 'Please provide a valid 10-digit phone number' },
          { status: 400 }
        );
      }
    }

    // Check if event exists and is available
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event is not available for booking' },
        { status: 400 }
      );
    }

    // Check if there are enough tickets available (real-time calculation)
    const soldTicketsResult = await prisma.ticket.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ['CONFIRMED', 'PENDING', 'USED']
        }
      },
      select: {
        quantity: true,
      }
    });
    
    const actualSoldTickets = soldTicketsResult.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const availableTickets = event.maxTickets - actualSoldTickets;
    
    console.log('Ticket availability check:', {
      eventId,
      maxTickets: event.maxTickets,
      actualSoldTickets,
      availableTickets,
      requestedQuantity: quantity,
    });
    
    if (availableTickets < quantity) {
      return NextResponse.json(
        { error: `Only ${availableTickets} tickets available` },
        { status: 400 }
      );
    }

    // Check if user already has tickets for this event (only for authenticated users)
    if (!isGuestCheckout && session) {
      const existingTickets = await prisma.$queryRaw`
        SELECT id, status, quantity
        FROM "Ticket"
        WHERE "userId" = ${session.user.id}
        AND "eventId" = ${eventId}
        AND status IN ('PENDING', 'CONFIRMED')
      `;

      if ((existingTickets as any[]).length > 0) {
        return NextResponse.json(
          { error: 'You already have tickets for this event' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount based on subscription status
    let totalAmount = event.price * quantity;
    
    // Check if user has active subscription for free access (1 ticket free)
    if (!isGuestCheckout && session) {
      const subscriptionStatus = await checkUserSubscriptionStatus(session.user.id);
      
      if (subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isExpired) {
        // Check if user already used free access for this event this month
        const hasUsedFreeAccess = await hasUserUsedFreeAccessThisMonth(session.user.id, eventId);
        
        if (!hasUsedFreeAccess) {
          // For subscribers: 1 ticket is free, rest are paid
          if (quantity === 1) {
            // This should not reach here - should be handled by free booking flow
            return NextResponse.json(
              { error: 'Single ticket booking with subscription should use free booking flow' },
              { status: 400 }
            );
          } else {
            // Partial free: charge only for additional tickets (1 free + rest paid)
            totalAmount = (quantity - 1) * event.price;
          }
        } else {
          // User has already used free ticket for this event, charge full price
          totalAmount = event.price * quantity;
        }
      }
    }

    // Check minimum amount requirement for Razorpay (minimum ₹1 = 100 paise)
    if (totalAmount < 1) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    console.log('Creating order for event:', {
      eventId,
      eventTitle: event.title,
      eventPrice: event.price,
      quantity,
      totalAmount,
      isGuestCheckout,
      guestName,
      guestEmail,
      guestPhone
    });

    // Create a shorter receipt (max 40 characters for Razorpay)
    const shortEventId = eventId.substring(0, 8); // Take first 8 chars of event ID
    const timestamp = Date.now().toString().slice(-8); // Take last 8 digits of timestamp
    const receipt = `evt_${shortEventId}_${timestamp}`; // Format: evt_12345678_12345678 (max 25 chars)

    const order = await createRazorpayOrder(
      totalAmount,
      'INR',
      receipt
    );

    // Store order details temporarily (you might want to store this in a separate table)
    const orderData = {
      orderId: order.id,
      eventId,
      quantity,
      totalAmount,
      specialRequests,
      guestName,
      guestEmail,
      guestPhone,
      userId: session?.user.id || null,
      isGuestCheckout,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayConfig.key_id,
        name: razorpayConfig.name,
        description: `${event.title} - ${quantity} ticket(s)`,
        image: razorpayConfig.image,
        theme: razorpayConfig.theme,
        orderData: orderData,
      },
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
