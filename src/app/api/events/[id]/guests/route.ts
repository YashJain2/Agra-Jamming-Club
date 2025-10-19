import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireModerator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/guests - Get guest list for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = params;

    // Check if user has permission to view guest list
    const hasPermission = await requireModerator(session);
    if (!hasPermission) {
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

    // Get all tickets for this event (both user and guest tickets)
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ['CONFIRMED', 'PENDING', 'USED'],
        },
      },
      include: {
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
        createdAt: 'asc',
      },
    });

    // Calculate guest statistics
    const totalGuests = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const verifiedGuests = tickets.filter(t => t.isVerified).reduce((sum, ticket) => sum + ticket.quantity, 0);
    const pendingVerification = totalGuests - verifiedGuests;
    const guestTickets = tickets.filter(t => t.isGuestTicket === true).length;
    const userTickets = tickets.filter(t => !t.isGuestTicket).length;

    // Format guest list with both user and guest details
    const guestList = tickets.map(ticket => {
      const isGuestTicket = ticket.isGuestTicket ?? false; // Handle null values
      return {
        ticketId: ticket.id,
        userId: ticket.userId,
        userName: isGuestTicket ? ticket.guestName : ticket.user?.name,
        userEmail: isGuestTicket ? ticket.guestEmail : ticket.user?.email,
        userPhone: isGuestTicket ? ticket.guestPhone : ticket.user?.phone,
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
