import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple endpoint to publish Christmas Fun event
export async function POST(request: NextRequest) {
  try {
    const eventId = 'cmgxrje3l000541bel0dwuou4'; // Christmas Fun event ID
    
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'PUBLISHED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Event published successfully',
      data: updatedEvent,
    });

  } catch (error) {
    console.error('Error publishing event:', error);
    return NextResponse.json(
      { error: 'Failed to publish event' },
      { status: 500 }
    );
  }
}
