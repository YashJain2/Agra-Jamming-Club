import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to get tickets without session validation
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing tickets without session validation...');
    
    // Get all tickets for testing
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."specialRequests",
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
      ORDER BY t."createdAt" DESC
      LIMIT 10
    `;
    
    console.log('✅ Found tickets:', (tickets as any[]).length);
    
    // Format the response
    const formattedTickets = (tickets as any[]).map(ticket => ({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      status: ticket.status,
      specialRequests: ticket.specialRequests,
      createdAt: ticket.createdAt,
      event: {
        id: ticket.eventId,
        title: ticket.eventTitle,
        date: ticket.eventDate,
        time: ticket.eventTime,
        venue: ticket.eventVenue,
        price: ticket.eventPrice,
      },
      user: ticket.userId ? {
        id: ticket.userId,
        name: ticket.userName,
        email: ticket.userEmail,
        phone: ticket.userPhone,
      } : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedTickets,
      count: formattedTickets.length
    });
    
  } catch (error) {
    console.error('Tickets test error:', error);
    return NextResponse.json(
      { error: 'Tickets test failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
