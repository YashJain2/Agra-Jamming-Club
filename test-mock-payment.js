#!/usr/bin/env node

/**
 * Mock Successful Payment Test
 * This script simulates a complete payment flow for the Diwali event
 */

const crypto = require('crypto');

// Mock payment data
const mockPaymentData = {
  orderId: 'order_RVIrdRkSppi1je',
  paymentId: 'pay_mock_' + Date.now(),
  signature: '', // Will be generated
  orderData: {
    eventId: 'cmgxkm7ao00012xearybs7e8d',
    quantity: 1,
    totalAmount: 1,
    userId: null,
    isGuestCheckout: true,
    guestName: 'Test User',
    guestEmail: 'test@example.com',
    guestPhone: '9876543210'
  }
};

// Generate a mock signature (this would normally come from Razorpay)
function generateMockSignature(orderId, paymentId) {
  const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW'; // Your Razorpay key secret
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest('hex');
}

// Generate the signature
mockPaymentData.signature = generateMockSignature(mockPaymentData.orderId, mockPaymentData.paymentId);

console.log('🎯 Mock Payment Test for Diwali Event');
console.log('=====================================');
console.log('Event ID:', mockPaymentData.orderData.eventId);
console.log('Event Title: Diwal Bash');
console.log('Price: ₹1');
console.log('Quantity:', mockPaymentData.orderData.quantity);
console.log('Guest Name:', mockPaymentData.orderData.guestName);
console.log('Guest Email:', mockPaymentData.orderData.guestEmail);
console.log('Guest Phone:', mockPaymentData.orderData.guestPhone);
console.log('');

console.log('📋 Payment Details:');
console.log('Order ID:', mockPaymentData.orderId);
console.log('Payment ID:', mockPaymentData.paymentId);
console.log('Signature:', mockPaymentData.signature);
console.log('');

// Test the payment verification endpoint
async function testPaymentVerification() {
  try {
    console.log('🔄 Testing Payment Verification...');
    
    const response = await fetch('http://localhost:3000/api/payment/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPaymentData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment Verification SUCCESS!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // Test fetching the created ticket
      console.log('');
      console.log('🎫 Testing Ticket Retrieval...');
      
      const ticketResponse = await fetch('http://localhost:3000/api/tickets', {
        headers: {
          'Cookie': 'next-auth.session-token=test-session' // Mock session
        }
      });
      
      if (ticketResponse.ok) {
        const tickets = await ticketResponse.json();
        console.log('✅ Tickets Retrieved Successfully!');
        console.log('Tickets:', JSON.stringify(tickets, null, 2));
      } else {
        console.log('❌ Failed to retrieve tickets:', await ticketResponse.text());
      }
      
    } else {
      console.log('❌ Payment Verification FAILED!');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Test the individual event API
async function testEventAPI() {
  try {
    console.log('🔄 Testing Individual Event API...');
    
    const response = await fetch(`http://localhost:3000/api/events/${mockPaymentData.orderData.eventId}`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Event API SUCCESS!');
      console.log('Event Title:', result.data.title);
      console.log('Event Price:', result.data.price);
      console.log('Event Status:', result.data.status);
    } else {
      console.log('❌ Event API FAILED!');
      console.log('Error:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Event API Error:', error.message);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Mock Payment Tests...');
  console.log('');
  
  await testEventAPI();
  console.log('');
  await testPaymentVerification();
  
  console.log('');
  console.log('🏁 Test Complete!');
}

// Run if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { mockPaymentData, testPaymentVerification, testEventAPI };
