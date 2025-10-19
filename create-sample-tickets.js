const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleTickets() {
  try {
    console.log('Creating sample tickets...');

    // Get the first event
    const event = await prisma.event.findFirst();
    if (!event) {
      console.log('No events found. Creating a sample event first...');
      const newEvent = await prisma.event.create({
        data: {
          title: 'Sample Music Event',
          description: 'A sample music event for testing',
          date: new Date('2024-12-25'),
          time: '19:00',
          venue: 'Community Center',
          address: '123 Music Street',
          city: 'Agra',
          state: 'Uttar Pradesh',
          country: 'India',
          price: 299,
          maxTickets: 100,
          soldTickets: 0,
          category: 'Music',
          tags: ['live', 'acoustic'],
          status: 'PUBLISHED'
        }
      });
      console.log('Created event:', newEvent.title);
    }

    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No users found. Please run the database initialization first.');
      return;
    }

    // Get the first event
    const firstEvent = await prisma.event.findFirst();
    if (!firstEvent) {
      console.log('No events found.');
      return;
    }

    // Create sample tickets
    const tickets = [
      {
        userId: user.id,
        eventId: firstEvent.id,
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
        userId: user.id,
        eventId: firstEvent.id,
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
        userId: user.id,
        eventId: firstEvent.id,
        quantity: 1,
        totalPrice: 0,
        status: 'CONFIRMED',
        isGuestTicket: false,
        isFreeAccess: true
      }
    ];

    for (const ticketData of tickets) {
      const ticket = await prisma.ticket.create({
        data: ticketData
      });
      console.log('Created ticket:', ticket.id, 'for', ticket.guestName || 'User');
    }

    console.log('Sample tickets created successfully!');
    
    // Update event sold tickets count
    const ticketCount = await prisma.ticket.count({
      where: { eventId: firstEvent.id }
    });
    
    await prisma.event.update({
      where: { id: firstEvent.id },
      data: { soldTickets: ticketCount }
    });

    console.log(`Updated event sold tickets count to: ${ticketCount}`);

  } catch (error) {
    console.error('Error creating sample tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTickets();