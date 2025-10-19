// Simple script to create sample tickets via API
const createSampleTickets = async () => {
  try {
    console.log('Creating sample tickets via API...');

    // First, let's create a sample event
    const eventResponse = await fetch('https://agra-jamming-club-hcq6qmc5t-yashjain2s-projects.vercel.app/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Sample Music Event for Testing',
        description: 'A sample music event to test guest list functionality',
        date: '2024-12-25',
        time: '19:00',
        venue: 'Community Center',
        address: '123 Music Street',
        city: 'Agra',
        state: 'Uttar Pradesh',
        country: 'India',
        price: 299,
        maxTickets: 100,
        category: 'Music',
        tags: ['live', 'acoustic'],
        status: 'PUBLISHED'
      })
    });

    if (!eventResponse.ok) {
      console.log('Event creation failed or event already exists');
    } else {
      const event = await eventResponse.json();
      console.log('Created event:', event.data.title);
    }

    // Now create some sample tickets
    const ticketResponse = await fetch('https://agra-jamming-club-hcq6qmc5t-yashjain2s-projects.vercel.app/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: 'sample-event-1', // Use a known event ID
        quantity: 1,
        totalPrice: 299,
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '9876543210',
        isGuestTicket: true
      })
    });

    if (!ticketResponse.ok) {
      console.log('Ticket creation failed:', await ticketResponse.text());
    } else {
      const ticket = await ticketResponse.json();
      console.log('Created ticket:', ticket.data.id);
    }

    console.log('Sample data creation completed!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Run the script
createSampleTickets();
