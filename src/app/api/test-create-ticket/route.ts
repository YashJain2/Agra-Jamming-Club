import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to create a ticket directly
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing direct ticket creation...');
    
    // First, check if we have events and users using Prisma ORM
    const events = await prisma.event.findMany({ take: 1 });
    const users = await prisma.user.findMany({ take: 1 });
    
    console.log('Events found:', events.length);
    console.log('Users found:', users.length);
    
    if (events.length === 0) {
      return NextResponse.json({
        error: 'No events found',
        events: events,
        users: users
      });
    }
    
    if (users.length === 0) {
      return NextResponse.json({
        error: 'No users found',
        events: events,
        users: users
      });
    }
    
    const eventId = events[0].id;
    // Use the admin user ID which we know exists
    const userId = 'cmgut5tjt0000fodfjvp0714k'; // Admin user ID
    
    console.log('Using event:', eventId);
    console.log('Using user:', userId);
    
    // Try to create a ticket using Prisma ORM
    const ticketId = `test_ticket_${Date.now()}`;
    
    console.log('Creating ticket with ID:', ticketId);
    
    // First, verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userExists) {
      return NextResponse.json({
        error: 'User not found',
        userId: userId,
        events: events,
        users: users
      });
    }
    
    console.log('User exists:', userExists.name, userExists.email);
    
    // Create ticket using Prisma ORM
    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        userId: userId,
        eventId: eventId,
        quantity: 1,
        totalPrice: 100,
        status: 'CONFIRMED',
      },
    });
    
    console.log('Ticket created:', ticket.id);
    
    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticket: ticket,
      events: events,
      users: users
    });
    
  } catch (error) {
    console.error('Direct ticket creation error:', error);
    return NextResponse.json(
      { error: 'Direct ticket creation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
