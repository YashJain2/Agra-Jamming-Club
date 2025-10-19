#!/usr/bin/env node

/**
 * Debug Payment Verification Test
 * This script tests the payment verification endpoint with debug info
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

// Generate a valid signature
function generateValidSignature(orderId, paymentId) {
  const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW';
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest('hex');
}

// Generate the signature
mockPaymentData.signature = generateValidSignature(mockPaymentData.orderId, mockPaymentData.paymentId);

console.log('🎯 Debug Payment Verification Test');
console.log('==================================');
console.log('Order ID:', mockPaymentData.orderId);
console.log('Payment ID:', mockPaymentData.paymentId);
console.log('Signature:', mockPaymentData.signature);
console.log('Event ID:', mockPaymentData.orderData.eventId);
console.log('');

// Test signature verification manually
function testSignatureVerification() {
  const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW';
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${mockPaymentData.orderId}|${mockPaymentData.paymentId}`);
  const generatedSignature = hmac.digest('hex');
  
  console.log('🔍 Signature Verification Test:');
  console.log('Generated Signature:', generatedSignature);
  console.log('Provided Signature:', mockPaymentData.signature);
  console.log('Signatures Match:', generatedSignature === mockPaymentData.signature);
  console.log('');
}

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
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
    console.log('Error Stack:', error.stack);
  }
}

// Run the tests
testSignatureVerification();
testPaymentVerification().catch(console.error);
