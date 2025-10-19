import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to check all tickets
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking all tickets...');
    
    // Get all tickets with user and event details
    const tickets = await prisma.ticket.findMany({
      include: {
        user: true,
        event: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('✅ Found tickets:', tickets.length);
    
    // Format tickets for response
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      status: ticket.status,
      specialRequests: ticket.specialRequests,
      createdAt: ticket.createdAt,
      user: ticket.user ? {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email,
        phone: ticket.user.phone,
        role: ticket.user.role,
        password: ticket.user.password ? 'HAS_PASSWORD' : 'NO_PASSWORD', // Don't expose actual password
      } : null,
      event: ticket.event ? {
        id: ticket.event.id,
        title: ticket.event.title,
        date: ticket.event.date,
        time: ticket.event.time,
        venue: ticket.event.venue,
        price: ticket.event.price,
        maxTickets: ticket.event.maxTickets,
        soldTickets: ticket.event.soldTickets,
      } : null,
    }));
    
    return NextResponse.json({
      success: true,
      totalTickets: tickets.length,
      tickets: formattedTickets,
    });
    
  } catch (error) {
    console.error('Error checking tickets:', error);
    return NextResponse.json(
      { error: 'Failed to check tickets', details: (error as Error).message },
      { status: 500 }
    );
  }
}
