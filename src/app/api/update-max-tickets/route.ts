import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint to update event max tickets
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Updating event max tickets...');
    
    const eventId = 'cmgxkm7ao00012xearybs7e8d'; // Diwal Bash event
    const newMaxTickets = 16;
    
    // Get current event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        maxTickets: true,
        soldTickets: true,
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    console.log('Current event details:', {
      title: event.title,
      maxTickets: event.maxTickets,
      soldTickets: event.soldTickets,
    });
    
    // Calculate actual sold tickets
    const soldTicketsResult = await prisma.ticket.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ['CONFIRMED', 'PENDING', 'USED']
        }
      },
      select: {
        quantity: true,
      }
    });
    
    const actualSoldTickets = soldTicketsResult.reduce((sum, ticket) => sum + ticket.quantity, 0);
    
    console.log('Actual sold tickets:', actualSoldTickets);
    
    // Update max tickets to 16
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        maxTickets: newMaxTickets,
        soldTickets: actualSoldTickets, // Keep soldTickets accurate
      },
    });
    
    const availableTickets = newMaxTickets - actualSoldTickets;
    
    console.log('✅ Event updated:', {
      title: updatedEvent.title,
      oldMaxTickets: event.maxTickets,
      newMaxTickets: updatedEvent.maxTickets,
      actualSoldTickets: actualSoldTickets,
      availableTickets: availableTickets,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Event max tickets updated successfully',
      data: {
        event: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          oldMaxTickets: event.maxTickets,
          newMaxTickets: updatedEvent.maxTickets,
          actualSoldTickets: actualSoldTickets,
          availableTickets: availableTickets,
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating event max tickets:', error);
    return NextResponse.json(
      { error: 'Failed to update event max tickets', details: error.message },
      { status: 500 }
    );
  }
}
