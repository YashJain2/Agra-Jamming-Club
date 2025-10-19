import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder, razorpayConfig } from '@/lib/razorpay';
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
    const isGuestCheckout = !session && guestName && guestEmail && guestPhone;
    
    if (!session && !isGuestCheckout) {
      return NextResponse.json(
        { error: 'Either sign in or provide guest details' },
        { status: 400 }
      );
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

    // Check if there are enough tickets available
    const availableTickets = event.maxTickets - event.soldTickets;
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

    // Calculate total amount
    const totalAmount = event.price * quantity;

    // Create Razorpay order
    const order = await createRazorpayOrder(
      totalAmount,
      'INR',
      `event_${eventId}_${Date.now()}`
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
