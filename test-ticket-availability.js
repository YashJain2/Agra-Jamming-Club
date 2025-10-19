#!/usr/bin/env node

/**
 * Test Ticket Availability Validation
 * This script tests if the create-order API properly validates ticket availability
 */

async function testTicketAvailability() {
  try {
    console.log('🔍 Testing ticket availability validation...');
    
    const eventId = 'cmgxkm7ao00012xearybs7e8d'; // Diwal Bash event (max 10, sold 11)
    
    // Try to create an order for 1 ticket (should fail since it's oversold)
    console.log('📋 Testing order creation for 1 ticket...');
    
    const orderResponse = await fetch('http://localhost:3000/api/payment/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: eventId,
        quantity: 1,
        guestName: 'Test User',
        guestEmail: 'test@example.com',
        guestPhone: '9876543210',
      }),
    });

    const orderData = await orderResponse.json();
    
    console.log('Order Response Status:', orderResponse.status);
    console.log('Order Response:', JSON.stringify(orderData, null, 2));
    
    if (orderResponse.status === 400) {
      console.log('✅ SUCCESS: Order creation properly blocked due to overselling!');
      console.log('Error message:', orderData.error);
    } else if (orderResponse.status === 200) {
      console.log('❌ FAILURE: Order creation should have been blocked!');
      console.log('This means the validation is not working properly.');
    } else {
      console.log('⚠️ Unexpected response status:', orderResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testTicketAvailability().catch(console.error);
