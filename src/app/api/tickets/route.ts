import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkUserSubscriptionStatus, hasUserUsedFreeAccessThisMonth } from '@/lib/subscription-utils';
import QRCode from 'qrcode';

// Validation schemas
const createTicketSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per booking'),
  specialRequests: z.string().optional(),
  // Guest checkout fields
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  // Free booking flag
  isFreeBooking: z.boolean().optional(),
});

// GET /api/tickets - Get user's tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    const where: any = {
      userId: session.user.id,
    };

    if (eventId) {
      where.eventId = eventId;
    }

    if (status) {
      where.status = status;
    }

    // Use Prisma ORM with includes for better reliability
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: session.user.id,
        ...(eventId && { eventId }),
        ...(status && { status: status as any }),
      },
      include: {
        event: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response to match expected structure
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      status: ticket.status,
      specialRequests: ticket.specialRequests,
      createdAt: ticket.createdAt,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        date: ticket.event.date,
        time: ticket.event.time,
        venue: ticket.event.venue,
        price: ticket.event.price,
        imageUrl: ticket.event.imageUrl,
      },
      user: ticket.user ? {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email,
        phone: ticket.user.phone,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTickets,
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket booking (supports guest checkout and free subscription booking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const { eventId, quantity, specialRequests, guestName, guestEmail, guestPhone, isFreeBooking } = validatedData;

    // Determine if this is a guest checkout or authenticated user
    const isGuestCheckout = !session && guestName && guestEmail && guestPhone;
    
    if (!session && !isGuestCheckout) {
      return NextResponse.json(
        { error: 'Either sign in or provide guest details' },
        { status: 400 }
      );
    }

    // Check subscription status for free booking
    if (isFreeBooking && session) {
      const subscriptionStatus = await checkUserSubscriptionStatus(session.user.id);
      if (!subscriptionStatus.canAccessForFree) {
        return NextResponse.json(
          { error: 'You do not have an active subscription for free booking' },
          { status: 400 }
        );
      }
    }

    let userId: string | null = null;
    let userDetails: any = {};

    if (isGuestCheckout) {
      // For guest checkout, store guest details in ticket
      userId = null; // No user ID for guest tickets
      userDetails = {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      };
    } else {
      // For authenticated users
      userId = session!.user.id;
      userDetails = {
        name: session!.user.name,
        email: session!.user.email,
        phone: (session!.user as any).phone || '',
      };
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
    if (!isGuestCheckout) {
      const existingTickets = await prisma.ticket.findMany({
        where: {
          userId: userId,
          eventId: eventId,
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

    // Check if user has active subscription for free access
    let totalPrice = event.price * quantity;
    let isFreeAccess = false;
    let subscriptionInfo = null;

    if (isFreeBooking && !isGuestCheckout && userId) {
      // This is a free booking request from a subscriber (quantity = 1)
      totalPrice = 0;
      isFreeAccess = true;
      const subscriptionStatus = await checkUserSubscriptionStatus(userId);
      subscriptionInfo = {
        subscriptionId: subscriptionStatus.subscription!.id,
        planName: subscriptionStatus.subscription!.plan.name,
        daysRemaining: subscriptionStatus.daysRemaining,
      };
    } else if (!isGuestCheckout && userId) {
      // Check if user has active subscription for free access
      const subscriptionStatus = await checkUserSubscriptionStatus(userId);
      
      if (subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isExpired) {
        // Check if user already used free access for this event this month
        const hasUsedFreeAccess = await hasUserUsedFreeAccessThisMonth(userId, eventId);
        
        if (!hasUsedFreeAccess) {
          // For subscribers: 1 ticket is free, rest are paid (only if free ticket is available)
          if (quantity === 1) {
            totalPrice = 0; // Completely free
            isFreeAccess = true;
          } else {
            // Partial free: 1 free + rest paid
            totalPrice = (quantity - 1) * event.price;
            isFreeAccess = false; // Not completely free, but has free component
          }
          
          subscriptionInfo = {
            subscriptionId: subscriptionStatus.subscription!.id,
            planName: subscriptionStatus.subscription!.plan.name,
            daysRemaining: subscriptionStatus.daysRemaining,
          };
        } else {
          // User has already used free ticket for this event, charge full price
          totalPrice = event.price * quantity;
          isFreeAccess = false;
        }
      }
    }

    // Create ticket using Prisma ORM
    const ticket = await prisma.ticket.create({
      data: {
        userId: userId,
        eventId: eventId,
        quantity: quantity,
        totalPrice: totalPrice,
        specialRequests: specialRequests || null,
        status: 'PENDING',
      },
    });

    // Get the created ticket with event and user details
    const createdTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        event: true,
        user: true
      }
    });

    // Generate QR code for the ticket
    const qrData = JSON.stringify({
      ticketId: createdTicket?.id,
      userId: createdTicket?.userId,
      eventId: createdTicket?.eventId,
      quantity: createdTicket?.quantity,
    });

    const qrCode = await QRCode.toDataURL(qrData);
    
    // Update ticket with QR code
    if (createdTicket) {
      await prisma.ticket.update({
        where: { id: createdTicket.id },
        data: { qrCode: qrCode }
      });
    }

    // Format the response
    const formattedTicket = {
      id: createdTicket?.id,
      userId: createdTicket?.userId,
      eventId: createdTicket?.eventId,
      quantity: createdTicket?.quantity,
      totalPrice: createdTicket?.totalPrice,
      status: createdTicket?.status,
      specialRequests: createdTicket?.specialRequests,
      createdAt: createdTicket?.createdAt,
      qrCode: qrCode,
      event: {
        id: (createdTicket as any)?.event?.id,
        title: (createdTicket as any)?.event?.title,
        date: (createdTicket as any)?.event?.date,
        time: (createdTicket as any)?.event?.time,
        venue: (createdTicket as any)?.event?.venue,
        price: (createdTicket as any)?.event?.price,
      },
      user: (createdTicket as any)?.user ? {
        id: (createdTicket as any).user.id,
        name: (createdTicket as any).user.name,
        email: (createdTicket as any).user.email,
        phone: (createdTicket as any).user.phone,
      } : null,
    };

    // Log the action (only for authenticated users)
    if (!isGuestCheckout && session) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          entity: 'Ticket',
          entityId: formattedTicket.id,
          newValues: {
            eventId: formattedTicket.eventId,
            quantity: formattedTicket.quantity,
            totalPrice: formattedTicket.totalPrice,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedTicket,
      message: isFreeAccess ? 'Ticket booked successfully with free access!' : 'Ticket booked successfully',
      subscriptionInfo: subscriptionInfo,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
