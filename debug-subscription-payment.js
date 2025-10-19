#!/usr/bin/env node

/**
 * Debug Guest Subscription Payment Verification
 * This script debugs the payment verification step
 */

async function debugPaymentVerification() {
  try {
    console.log('🔍 Debugging Payment Verification');
    console.log('=================================');
    
    // Use the subscription ID from the previous test
    const subscriptionId = 'cmgxnasoe000t11fvdubji42o';
    const orderId = 'order_RVJyv5gEjKxT0T';
    
    console.log('Using subscription ID:', subscriptionId);
    console.log('Using order ID:', orderId);
    
    // Generate a valid signature
    const crypto = require('crypto');
    const mockPaymentId = 'pay_debug_' + Date.now();
    
    function generateValidSignature(orderId, paymentId) {
      const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW';
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      return hmac.digest('hex');
    }
    
    const validSignature = generateValidSignature(orderId, mockPaymentId);
    
    console.log('Mock Payment ID:', mockPaymentId);
    console.log('Generated signature:', validSignature);
    
    // Test payment verification
    const verifyResponse = await fetch('http://localhost:3000/api/payment/razorpay/subscription/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        paymentId: mockPaymentId,
        signature: validSignature,
        orderData: {
          subscriptionId: subscriptionId,
          totalAmount: 999,
          guestName: 'Test Guest User',
          guestEmail: 'guest@example.com',
          guestPhone: '9876543210',
          userId: 'cmgxnasay000r11fvh4stjgkr',
        },
      }),
    });

    const verifyData = await verifyResponse.json();
    
    console.log('Verify Response Status:', verifyResponse.status);
    console.log('Verify Response:', JSON.stringify(verifyData, null, 2));
    
    if (verifyData.success) {
      console.log('✅ Payment verification SUCCESS!');
    } else {
      console.log('❌ Payment verification FAILED!');
      console.log('Error:', verifyData.error);
      console.log('Details:', verifyData.details);
    }
    
  } catch (error) {
    console.log('❌ Debug Error:', error.message);
  }
}

// Run the debug
debugPaymentVerification().catch(console.error);
