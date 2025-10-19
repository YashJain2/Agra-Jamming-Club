#!/usr/bin/env node

/**
 * Create Test Event
 * This script creates a test event in the local database
 */

async function createTestEvent() {
  try {
    console.log('🎫 Creating test event...');
    
    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // Mock session for admin
      },
      body: JSON.stringify({
        title: 'Test Diwali Event',
        description: 'Test event for payment verification',
        date: '2025-10-26T13:00:00.000Z',
        time: '18:30',
        venue: 'Test Venue',
        price: 1,
        maxTickets: 10,
        category: 'MUSIC',
        status: 'PUBLISHED'
      }),
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Test event created successfully!');
      console.log('Event ID:', result.data.id);
      return result.data.id;
    } else {
      console.log('❌ Test event creation failed!');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
    return null;
  }
}

// Run the test
createTestEvent().catch(console.error);
