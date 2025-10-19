const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleTicketsSQL() {
  try {
    console.log('Creating sample tickets using SQL...');

    // Get the first user
    const users = await prisma.$queryRaw`
      SELECT id, email FROM "User" LIMIT 1;
    `;
    
    if (users.length === 0) {
      console.log('No users found. Please run the database initialization first.');
      return;
    }

    // Get the first event
    const firstEvent = await prisma.$queryRaw`
      SELECT id, title FROM "Event" LIMIT 1;
    `;
    
    if (firstEvent.length === 0) {
      console.log('No events found. Creating a sample event first...');
      await prisma.$executeRaw`
        INSERT INTO "Event" (id, title, description, date, time, venue, address, city, state, country, price, "maxTickets", "soldTickets", category, tags, status, "createdAt", "updatedAt")
        VALUES ('sample-event-1', 'Sample Music Event', 'A sample music event for testing', '2024-12-25 19:00:00', '19:00', 'Community Center', '123 Music Street', 'Agra', 'Uttar Pradesh', 'India', 299, 100, 0, 'Music', ARRAY['live', 'acoustic'], 'PUBLISHED', NOW(), NOW());
      `;
      console.log('Created sample event');
    }

    // Get the event again after potential creation
    const eventResult = await prisma.$queryRaw`
      SELECT id, title FROM "Event" LIMIT 1;
    `;

    const userId = users[0].id;
    const selectedEventId = eventResult[0].id;

    console.log(`Creating tickets for user ${userId} and event ${selectedEventId}`);

    // Create sample tickets using SQL
    await prisma.$executeRaw`
      INSERT INTO "Ticket" (id, "userId", "eventId", quantity, "totalPrice", status, "guestName", "guestEmail", "guestPhone", "isGuestTicket", "isFreeAccess", "createdAt", "updatedAt")
      VALUES 
        ('ticket-1', $1, $2, 1, 299, 'CONFIRMED', 'John Doe', 'john@example.com', '9876543210', true, false, NOW(), NOW()),
        ('ticket-2', $1, $2, 2, 598, 'PENDING', 'Jane Smith', 'jane@example.com', '9876543211', true, false, NOW(), NOW()),
        ('ticket-3', $1, $2, 1, 0, 'CONFIRMED', NULL, NULL, NULL, false, true, NOW(), NOW());
    `, [userId, selectedEventId];

    console.log('Sample tickets created successfully!');

    // Update event sold tickets count
    const ticketCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Ticket" WHERE "eventId" = $1;
    `, [selectedEventId];

    await prisma.$executeRaw`
      UPDATE "Event" SET "soldTickets" = $1 WHERE id = $2;
    `, [parseInt(ticketCount[0].count), selectedEventId];

    console.log(`Updated event sold tickets count to: ${ticketCount[0].count}`);

  } catch (error) {
    console.error('Error creating sample tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTicketsSQL();
