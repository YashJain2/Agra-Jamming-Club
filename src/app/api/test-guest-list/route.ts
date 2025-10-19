import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to check guest list without authentication
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing guest list API...');
    
    const eventId = 'cmgxkm7ao00012xearybs7e8d'; // Diwal Bash event
    
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

    console.log('✅ Event found:', event.title);

    // Get all tickets for this event using Prisma ORM
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ['CONFIRMED', 'PENDING', 'USED']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            password: true, // We'll use this to identify guest users
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('✅ Found tickets:', tickets.length);

    // Calculate guest statistics
    const totalGuests = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const verifiedGuests = tickets.filter(t => t.status === 'USED').reduce((sum, ticket) => sum + ticket.quantity, 0);
    const pendingVerification = totalGuests - verifiedGuests;
    
    // Identify guest users (users with null password)
    const guestTickets = tickets.filter(t => !t.user?.password).length;
    const userTickets = tickets.filter(t => t.user?.password).length;

    console.log('📊 Statistics:', {
      totalGuests,
      verifiedGuests,
      pendingVerification,
      guestTickets,
      userTickets,
      availableTickets: event.maxTickets - event.soldTickets,
    });

    // Format guest list with both user and guest details
    const guestList = tickets.map((ticket) => {
      const isGuestUser = !ticket.user?.password; // Guest users have null password
      
      return {
        ticketId: ticket.id,
        userId: ticket.userId,
        userName: ticket.user?.name || 'Unknown',
        userEmail: ticket.user?.email || 'Unknown',
        userPhone: ticket.user?.phone || 'Unknown',
        quantity: ticket.quantity,
        totalPrice: ticket.totalPrice,
        status: ticket.status,
        isVerified: ticket.status === 'USED',
        verifiedAt: ticket.status === 'USED' ? ticket.updatedAt : null,
        verifiedBy: null, // Not tracked in current schema
        qrCode: null, // Not available in current schema
        specialRequests: ticket.specialRequests,
        seatNumbers: null, // Not available in current schema
        isGuestTicket: isGuestUser,
        isFreeAccess: false, // Not tracked in current schema
        subscriptionId: null, // Not tracked in current schema
        createdAt: ticket.createdAt,
        userRole: ticket.user?.role || 'USER',
      };
    });

    console.log('✅ Guest list formatted:', guestList.length, 'entries');

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
    console.error('Error testing guest list:', error);
    return NextResponse.json(
      { error: 'Failed to test guest list', details: (error as Error).message },
      { status: 500 }
    );
  }
}
