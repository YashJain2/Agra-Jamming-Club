// Create sample tickets for demo
const sampleTickets = [
  {
    eventId: 'sample-event-1',
    quantity: 2,
    guestName: 'Priya Sharma',
    guestEmail: 'priya.sharma@example.com',
    guestPhone: '+91-9876543210',
    isGuestTicket: true
  },
  {
    eventId: 'sample-event-1', 
    quantity: 1,
    guestName: 'Rahul Singh',
    guestEmail: 'rahul.singh@example.com',
    guestPhone: '+91-9876543211',
    isGuestTicket: true
  },
  {
    eventId: 'sample-event-2',
    quantity: 3,
    guestName: 'Sneha Gupta',
    guestEmail: 'sneha.gupta@example.com', 
    guestPhone: '+91-9876543212',
    isGuestTicket: true
  }
];

// Function to create tickets via API
async function createSampleTickets() {
  for (const ticket of sampleTickets) {
    try {
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticket)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ticket created:', data.data.id);
      } else {
        const error = await response.json();
        console.log('❌ Failed to create ticket:', error);
      }
    } catch (error) {
      console.log('❌ Error creating ticket:', error);
    }
  }
}

createSampleTickets();
