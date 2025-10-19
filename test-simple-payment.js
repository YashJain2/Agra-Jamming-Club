#!/usr/bin/env node

/**
 * Simple Payment Verification Test
 * This script tests the payment verification endpoint with a valid signature
 */

const crypto = require('crypto');

// Mock payment data with valid signature
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

// Generate a valid signature
function generateValidSignature(orderId, paymentId) {
  const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW'; // Your Razorpay key secret
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest('hex');
}

// Generate the signature
mockPaymentData.signature = generateValidSignature(mockPaymentData.orderId, mockPaymentData.paymentId);

console.log('🎯 Simple Payment Verification Test');
console.log('===================================');
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
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Payment Verification SUCCESS!');
      console.log('Ticket Created:', result.data.id);
      console.log('Event:', result.data.event.title);
      console.log('Status:', result.data.status);
    } else {
      console.log('❌ Payment Verification FAILED!');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testPaymentVerification().catch(console.error);
