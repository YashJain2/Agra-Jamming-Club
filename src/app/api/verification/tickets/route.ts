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

    // Get all tickets with event and user details using Prisma ORM
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING', 'USED'] }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            venue: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format tickets for verification
    const verificationTickets = tickets.map((ticket) => {
      const isGuestTicket = (ticket as any).isGuestTicket ?? false;
      return {
        id: ticket.id,
        ticketId: ticket.id,
        userId: ticket.userId,
        userName: isGuestTicket ? (ticket as any).guestName : ticket.user?.name,
        userEmail: isGuestTicket ? (ticket as any).guestEmail : ticket.user?.email,
        userPhone: isGuestTicket ? (ticket as any).guestPhone : ticket.user?.phone,
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
        isFreeAccess: (ticket as any).isFreeAccess ?? false,
        subscriptionId: (ticket as any).subscriptionId,
        createdAt: ticket.createdAt,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          time: ticket.event.time,
          venue: ticket.event.venue,
        },
        user: ticket.userId ? {
          id: ticket.user?.id,
          name: ticket.user?.name,
          email: ticket.user?.email,
          phone: ticket.user?.phone,
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
