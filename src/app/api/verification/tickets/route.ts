import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireModerator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/verification/tickets - Get all tickets for verification (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view all tickets
    if (!['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all tickets with event and user details using raw SQL to handle missing columns
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
        u.phone as "userPhone",
        e.title as "eventTitle",
        e.date as "eventDate",
        e.time as "eventTime",
        e.venue as "eventVenue"
      FROM "Ticket" t
      LEFT JOIN "User" u ON t."userId" = u.id
      LEFT JOIN "Event" e ON t."eventId" = e.id
      WHERE t.status IN ('CONFIRMED', 'PENDING', 'USED')
      ORDER BY t."createdAt" DESC
    `;

    // Format tickets for verification
    const verificationTickets = tickets.map((ticket: any) => {
      const isGuestTicket = ticket.isGuestTicket ?? false;
      return {
        id: ticket.id,
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
        event: {
          id: ticket.eventId,
          title: ticket.eventTitle,
          date: ticket.eventDate,
          time: ticket.eventTime,
          venue: ticket.eventVenue,
        },
        user: ticket.userId ? {
          id: ticket.userId,
          name: ticket.userName,
          email: ticket.userEmail,
          phone: ticket.userPhone,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: verificationTickets,
    });

  } catch (error) {
    console.error('Error fetching verification tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification tickets' },
      { status: 500 }
    );
  }
}
