const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixTickets() {
  try {
    console.log('Checking ticket data...');

    // Check all tickets
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."isVerified",
        t."guestName",
        t."guestEmail",
        t."guestPhone",
        t."isGuestTicket",
        t."isFreeAccess",
        t."createdAt",
        e.title as "eventTitle",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      LEFT JOIN "User" u ON t."userId" = u.id
      ORDER BY t."createdAt" DESC
    `;

    console.log(`Found ${tickets.length} tickets:`);
    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.eventTitle} - ${ticket.userName || ticket.guestName || 'Unknown'} - Qty: ${ticket.quantity} - Status: ${ticket.status}`);
    });

    // Check event ticket counts
    const events = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.title,
        e."soldTickets",
        COUNT(t.id) as "actualTicketCount",
        SUM(t.quantity) as "actualGuestCount"
      FROM "Event" e
      LEFT JOIN "Ticket" t ON e.id = t."eventId" AND t.status IN ('CONFIRMED', 'PENDING', 'USED')
      GROUP BY e.id, e.title, e."soldTickets"
      ORDER BY e.title
    `;

    console.log('\nEvent ticket counts:');
    events.forEach(event => {
      console.log(`${event.title}: Sold=${event.soldTickets}, Actual Tickets=${event.actualTicketCount}, Actual Guests=${event.actualGuestCount}`);
    });

    // Update event sold tickets to match actual data
    for (const event of events) {
      if (event.soldTickets !== parseInt(event.actualGuestCount)) {
        console.log(`\nUpdating ${event.title}: ${event.soldTickets} -> ${event.actualGuestCount}`);
        await prisma.$executeRaw`
          UPDATE "Event" 
          SET "soldTickets" = ${parseInt(event.actualGuestCount)}
          WHERE id = ${event.id}
        `;
      }
    }

    console.log('\nTicket data check completed!');

  } catch (error) {
    console.error('Error checking tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixTickets();
