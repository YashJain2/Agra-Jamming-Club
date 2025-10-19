import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to get tickets for a specific user without session validation
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing tickets retrieval without session validation...');
    
    // Get tickets for the admin user
    const userId = 'cmgut5tjt0000fodfjvp0714k'; // Admin user ID
    
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: userId
      },
      include: {
        event: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Tickets found:', tickets.length);
    
    // Format the response to match the expected structure
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
      count: formattedTickets.length
    });
    
  } catch (error) {
    console.error('Tickets retrieval error:', error);
    return NextResponse.json(
      { error: 'Tickets retrieval failed', details: error.message },
      { status: 500 }
    );
  }
}
