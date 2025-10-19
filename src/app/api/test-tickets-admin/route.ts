import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to get tickets for admin user (bypassing session)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing tickets API for admin user...');
    
    // Use admin user ID directly (bypassing session)
    const userId = 'cmgut5tjt0000fodfjvp0714k'; // Admin user ID
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    // Use Prisma ORM with includes for better reliability
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: userId,
        ...(eventId && { eventId: eventId }),
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
        id: (ticket as any).event.id,
        title: (ticket as any).event.title,
        date: (ticket as any).event.date,
        time: (ticket as any).event.time,
        venue: (ticket as any).event.venue,
        price: (ticket as any).event.price,
        imageUrl: (ticket as any).event.imageUrl,
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
