#!/usr/bin/env node

/**
 * Test Guest Subscription Flow
 * This script tests the guest subscription creation and payment flow
 */

async function testGuestSubscriptionFlow() {
  try {
    console.log('🎯 Testing Guest Subscription Flow');
    console.log('==================================');
    
    // Step 1: Create guest subscription
    console.log('📋 Step 1: Creating guest subscription...');
    
    const subscriptionResponse = await fetch('http://localhost:3000/api/subscriptions/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'monthly-plan', // This should match your actual plan ID
        guestName: 'Test Guest User',
        guestEmail: 'guest@example.com',
        guestPhone: '9876543210'
      }),
    });

    const subscriptionData = await subscriptionResponse.json();
    
    console.log('Subscription Response Status:', subscriptionResponse.status);
    console.log('Subscription Response:', JSON.stringify(subscriptionData, null, 2));
    
    if (!subscriptionData.success) {
      console.log('❌ Failed to create guest subscription:', subscriptionData.error);
      return;
    }
    
    console.log('✅ Guest subscription created successfully');
    console.log('Subscription ID:', subscriptionData.data.subscription.id);
    
    // Step 2: Create payment order
    console.log('\n📋 Step 2: Creating payment order...');
    
    const orderResponse = await fetch('http://localhost:3000/api/payment/razorpay/subscription/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: subscriptionData.data.subscription.id,
        guestName: 'Test Guest User',
        guestEmail: 'guest@example.com',
        guestPhone: '9876543210'
      }),
    });

    const orderData = await orderResponse.json();
    
    console.log('Order Response Status:', orderResponse.status);
    console.log('Order Response:', JSON.stringify(orderData, null, 2));
    
    if (!orderData.success) {
      console.log('❌ Failed to create payment order:', orderData.error);
      return;
    }
    
    console.log('✅ Payment order created successfully');
    console.log('Order ID:', orderData.data.orderId);
    
    // Step 3: Test payment verification (with mock data)
    console.log('\n📋 Step 3: Testing payment verification...');
    
    const crypto = require('crypto');
    
    // Generate a valid signature
    function generateValidSignature(orderId, paymentId) {
      const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW';
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      return hmac.digest('hex');
    }
    
    const mockPaymentId = 'pay_mock_' + Date.now();
    const validSignature = generateValidSignature(orderData.data.orderId, mockPaymentId);
    
    console.log('Generated valid signature:', validSignature);
    
    const verifyResponse = await fetch('http://localhost:3000/api/payment/razorpay/subscription/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderData.data.orderId,
        paymentId: mockPaymentId,
        signature: validSignature,
        orderData: orderData.data.orderData,
      }),
    });

    const verifyData = await verifyResponse.json();
    
    console.log('Verify Response Status:', verifyResponse.status);
    console.log('Verify Response:', JSON.stringify(verifyData, null, 2));
    
    if (verifyData.success) {
      console.log('✅ Guest Subscription Flow SUCCESS!');
      console.log('Subscription ID:', verifyData.data.subscription.id);
      console.log('Status:', verifyData.data.subscription.status);
      console.log('Guest Name:', verifyData.data.guestDetails.name);
      console.log('Guest Email:', verifyData.data.guestDetails.email);
    } else {
      console.log('❌ Guest Subscription Flow FAILED!');
      console.log('Error:', verifyData.error);
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testGuestSubscriptionFlow().catch(console.error);
