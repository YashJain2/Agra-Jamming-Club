import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireModerator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/guests - Get guest list for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    // Check if user has permission to view guest list
    if (!['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        venue: true,
        maxTickets: true,
        soldTickets: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all tickets for this event using raw SQL to handle missing columns
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."isVerified",
        t."verifiedAt",
        t."verifiedBy",
        t."qrCode",
        t."specialRequests",
        t."seatNumbers",
        t."guestName",
        t."guestEmail",
        t."guestPhone",
        t."isGuestTicket",
        t."isFreeAccess",
        t."subscriptionId",
        t."createdAt",
        u.name as "userName",
        u.email as "userEmail",
        u.phone as "userPhone"
      FROM "Ticket" t
      LEFT JOIN "User" u ON t."userId" = u.id
      WHERE t."eventId" = ${eventId}
        AND t.status IN ('CONFIRMED', 'PENDING', 'USED')
      ORDER BY t."createdAt" ASC
    `;

    // Calculate guest statistics
    const totalGuests = tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0);
    const verifiedGuests = tickets.filter((t: any) => t.isVerified).reduce((sum: number, ticket: any) => sum + ticket.quantity, 0);
    const pendingVerification = totalGuests - verifiedGuests;
    const guestTickets = tickets.filter((t: any) => t.isGuestTicket === true).length;
    const userTickets = tickets.filter((t: any) => !t.isGuestTicket).length;

    // Format guest list with both user and guest details
    const guestList = tickets.map((ticket: any) => {
      const isGuestTicket = ticket.isGuestTicket ?? false; // Handle null values
      return {
        ticketId: ticket.id,
        userId: ticket.userId,
        userName: isGuestTicket ? ticket.guestName : ticket.userName,
        userEmail: isGuestTicket ? ticket.guestEmail : ticket.userEmail,
        userPhone: isGuestTicket ? ticket.guestPhone : ticket.userPhone,
        quantity: ticket.quantity,
        totalPrice: ticket.totalPrice,
        status: ticket.status,
        isVerified: ticket.isVerified,
        verifiedAt: ticket.verifiedAt,
        verifiedBy: ticket.verifiedBy,
        qrCode: ticket.qrCode,
        specialRequests: ticket.specialRequests,
        seatNumbers: ticket.seatNumbers,
        isGuestTicket: isGuestTicket,
        isFreeAccess: ticket.isFreeAccess ?? false,
        subscriptionId: ticket.subscriptionId,
        createdAt: ticket.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        event: event,
        guestList: guestList,
        statistics: {
          totalGuests: totalGuests,
          verifiedGuests: verifiedGuests,
          pendingVerification: pendingVerification,
          totalTickets: tickets.length,
          guestTickets: guestTickets,
          userTickets: userTickets,
          availableTickets: event.maxTickets - event.soldTickets,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching guest list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest list' },
      { status: 500 }
    );
  }
}
