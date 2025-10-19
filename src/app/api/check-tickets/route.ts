import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking ticket data in database...');

    // Get all tickets with event details using Prisma ORM
    const tickets = await prisma.ticket.findMany({
      include: {
        event: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get event ticket counts using Prisma ORM
    const events = await prisma.event.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        soldTickets: true
      }
    });

    const eventCounts = await Promise.all(
      events.map(async (event) => {
        const actualTickets = await prisma.ticket.findMany({
          where: {
            eventId: event.id,
            status: { in: ['CONFIRMED', 'PENDING', 'USED'] }
          },
          select: {
            quantity: true
          }
        });

        const actualTicketCount = actualTickets.length;
        const actualGuestCount = actualTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

        return {
          id: event.id,
          title: event.title,
          soldTickets: event.soldTickets,
          actualTicketCount,
          actualGuestCount,
          synced: event.soldTickets === actualGuestCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      totalTickets: tickets.length,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        eventTitle: ticket.event?.title || 'Unknown Event',
        quantity: ticket.quantity,
        status: ticket.status,
      })),
      eventCounts
    });

  } catch (error) {
    console.error('Error checking ticket data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check ticket data', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
