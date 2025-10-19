import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import QRCode from 'qrcode';
import { checkUserSubscriptionStatus, canUserAccessEventsForFree, hasUserUsedFreeAccessThisMonth } from '@/lib/subscription-utils';

// Validation schemas
const createTicketSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per booking'),
  specialRequests: z.string().optional(),
  // Guest checkout fields
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
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

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            venue: true,
            price: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket booking (supports guest checkout)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const { eventId, quantity, specialRequests, guestName, guestEmail, guestPhone } = validatedData;

    // Determine if this is a guest checkout or authenticated user
    const isGuestCheckout = !session && guestName && guestEmail && guestPhone;
    
    if (!session && !isGuestCheckout) {
      return NextResponse.json(
        { error: 'Either sign in or provide guest details' },
        { status: 400 }
      );
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

    if (!isGuestCheckout && userId) {
      const subscriptionStatus = await checkUserSubscriptionStatus(userId);
      
      if (subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isExpired) {
        // Check if user already used free access for this event this month
        const hasUsedFreeAccess = await hasUserUsedFreeAccessThisMonth(userId, eventId);
        
        if (!hasUsedFreeAccess) {
          totalPrice = 0; // Free access for subscribers
          isFreeAccess = true;
          subscriptionInfo = {
            subscriptionId: subscriptionStatus.subscription!.id,
            planName: subscriptionStatus.subscription!.plan.name,
            daysRemaining: subscriptionStatus.daysRemaining,
          };
        }
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
        ${ticketId}, ${userId}, ${eventId}, ${quantity}, ${totalPrice},
        ${specialRequests || null}, 'PENDING', ${Boolean(isGuestCheckout)},
        ${isGuestCheckout ? guestName : null}, 
        ${isGuestCheckout ? guestEmail : null}, 
        ${isGuestCheckout ? guestPhone : null},
        ${isFreeAccess}, ${subscriptionInfo?.subscriptionId || null}, NOW(), NOW()
      )
    `;

    // Get the created ticket with event and user details
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

    // Log the action (only for authenticated users)
    if (!isGuestCheckout && session) {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (
          id, "userId", action, entity, "entityId", 
          "newValues", "ipAddress", "userAgent", "createdAt"
        ) VALUES (
          ${`audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
          ${session.user.id}, 'CREATE', 'Ticket', ${formattedTicket.id},
          ${JSON.stringify({
            eventId: formattedTicket.eventId,
            quantity: formattedTicket.quantity,
            totalPrice: formattedTicket.totalPrice,
          })},
          ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null},
          ${request.headers.get('user-agent') || null},
          NOW()
        )
      `;
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
