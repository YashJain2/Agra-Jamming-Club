import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Fixing ticket data...');

    // First, reset all event sold tickets to 0
    await prisma.$executeRaw`
      UPDATE "Event" SET "soldTickets" = 0
    `;
    console.log('Reset all event sold tickets to 0');

    // Get the first event and user
    const events = await prisma.$queryRaw`
      SELECT id, title FROM "Event" LIMIT 1
    `;
    
    const users = await prisma.$queryRaw`
      SELECT id, name, email FROM "User" LIMIT 1
    `;

    if (events.length === 0 || users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No events or users found'
      });
    }

    const eventId = events[0].id;
    const userId = users[0].id;

    console.log(`Creating sample tickets for event: ${events[0].title}`);

    // Create sample tickets with guest data
    const sampleTickets = [
      {
        id: `ticket_${Date.now()}_1`,
        userId: userId,
        eventId: eventId,
        quantity: 1,
        totalPrice: 299,
        status: 'CONFIRMED',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '9876543210',
        isGuestTicket: true,
        isFreeAccess: false
      },
      {
        id: `ticket_${Date.now()}_2`,
        userId: userId,
        eventId: eventId,
        quantity: 2,
        totalPrice: 598,
        status: 'PENDING',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '9876543211',
        isGuestTicket: true,
        isFreeAccess: false
      },
      {
        id: `ticket_${Date.now()}_3`,
        userId: userId,
        eventId: eventId,
        quantity: 1,
        totalPrice: 0,
        status: 'CONFIRMED',
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        isGuestTicket: false,
        isFreeAccess: true
      }
    ];

    // Insert tickets
    for (const ticket of sampleTickets) {
      await prisma.$executeRaw`
        INSERT INTO "Ticket" (
          id, "userId", "eventId", quantity, "totalPrice", status,
          "guestName", "guestEmail", "guestPhone", "isGuestTicket", 
          "isFreeAccess", "createdAt", "updatedAt"
        ) VALUES (
          ${ticket.id}, ${ticket.userId}, ${ticket.eventId}, ${ticket.quantity}, 
          ${ticket.totalPrice}, ${ticket.status}, ${ticket.guestName}, 
          ${ticket.guestEmail}, ${ticket.guestPhone}, ${ticket.isGuestTicket}, 
          ${ticket.isFreeAccess}, NOW(), NOW()
        )
      `;
      console.log(`Created ticket: ${ticket.id}`);
    }

    // Update event sold tickets count
    const ticketCount = await prisma.$queryRaw`
      SELECT SUM(quantity) as total FROM "Ticket" WHERE "eventId" = ${eventId}
    `;

    await prisma.$executeRaw`
      UPDATE "Event" SET "soldTickets" = ${parseInt(ticketCount[0].total)} WHERE id = ${eventId}
    `;

    console.log(`Updated event sold tickets to: ${ticketCount[0].total}`);

    // Verify the data
    const verifyTickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.quantity,
        t.status,
        t."guestName",
        t."isGuestTicket",
        e.title as "eventTitle"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      ORDER BY t."createdAt" DESC
    `;

    console.log('Verification - Current tickets:');
    verifyTickets.forEach((ticket: any, index: number) => {
      console.log(`${index + 1}. ${ticket.eventTitle} - ${ticket.guestName || 'User Ticket'} - Qty: ${ticket.quantity} - Status: ${ticket.status}`);
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket data fixed successfully!',
      ticketsCreated: sampleTickets.length,
      eventUpdated: events[0].title,
      totalGuests: ticketCount[0].total,
      verification: verifyTickets.map((ticket: any) => ({
        id: ticket.id,
        eventTitle: ticket.eventTitle,
        guestName: ticket.guestName || 'User Ticket',
        quantity: ticket.quantity,
        status: ticket.status
      }))
    });

  } catch (error) {
    console.error('Error fixing ticket data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fix ticket data', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
