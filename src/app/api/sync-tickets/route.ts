import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Syncing event sold tickets with actual ticket data...');

    // Get all events with their actual ticket counts
    const events = await prisma.$queryRaw`
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

    const updates = [];
    
    // Update event sold tickets to match actual data
    for (const event of events as any[]) {
      const actualCount = parseInt(event.actualGuestCount);
      if (event.soldTickets !== actualCount) {
        console.log(`Updating ${event.title}: ${event.soldTickets} -> ${actualCount}`);
        
        await prisma.$executeRaw`
          UPDATE "Event" 
          SET "soldTickets" = ${actualCount}
          WHERE id = ${event.id}
        `;
        
        updates.push({
          eventId: event.id,
          title: event.title,
          oldCount: event.soldTickets,
          newCount: actualCount
        });
      }
    }

    // Get updated events to verify
    const updatedEvents = await prisma.$queryRaw`
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
      message: 'Event sold tickets synced with actual ticket data',
      updates: updates,
      verification: (updatedEvents as any[]).map((event: any) => ({
        id: event.id,
        title: event.title,
        soldTickets: event.soldTickets,
        actualTickets: event.actualTicketCount,
        actualGuests: event.actualGuestCount,
        synced: event.soldTickets === parseInt(event.actualGuestCount)
      }))
    });

  } catch (error) {
    console.error('Error syncing ticket data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync ticket data', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
