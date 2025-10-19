#!/usr/bin/env node

/**
 * Simple Ticket Creation Test
 * This script tests if we can create a basic ticket
 */

async function testTicketCreation() {
  try {
    console.log('🎫 Testing basic ticket creation...');
    
    const response = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: 'cmgxkm7ao00012xearybs7e8d',
        quantity: 1,
        guestName: 'Test User',
        guestEmail: 'test@example.com',
        guestPhone: '9876543210'
      }),
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Ticket creation SUCCESS!');
    } else {
      console.log('❌ Ticket creation FAILED!');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testTicketCreation().catch(console.error);
