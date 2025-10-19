import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking ticket data in database...');

    // Get all tickets with event details
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."eventId",
        t.quantity,
        t.status,
        t."guestName",
        t."isGuestTicket",
        e.title as "eventTitle"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      ORDER BY t."createdAt" DESC
    `;

    // Get event ticket counts
    const eventCounts = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.title,
        e."soldTickets",
        COUNT(t.id) as "actualTicketCount",
        COALESCE(SUM(t.quantity), 0) as "actualGuestCount"
      FROM "Event" e
      LEFT JOIN "Ticket" t ON e.id = t."eventId" AND t.status IN ('CONFIRMED', 'PENDING', 'USED')
      GROUP BY e.id, e.title, e."soldTickets"
      ORDER BY e.title
    `;

    return NextResponse.json({
      success: true,
      totalTickets: tickets.length,
      tickets: tickets.map((ticket: any) => ({
        id: ticket.id,
        eventTitle: ticket.eventTitle,
        quantity: ticket.quantity,
        status: ticket.status,
        guestName: ticket.guestName,
        isGuestTicket: ticket.isGuestTicket
      })),
      eventCounts: eventCounts.map((event: any) => ({
        id: event.id,
        title: event.title,
        soldTickets: event.soldTickets,
        actualTicketCount: event.actualTicketCount,
        actualGuestCount: event.actualGuestCount,
        synced: event.soldTickets === parseInt(event.actualGuestCount)
      }))
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
