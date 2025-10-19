#!/usr/bin/env node

/**
 * Frontend Payment Flow Test (Bypass Signature)
 * This script tests the frontend flow with signature verification bypassed
 */

async function testFrontendFlowBypassSignature() {
  try {
    console.log('🎯 Frontend Payment Flow Test (Bypass Signature)');
    console.log('===============================================');
    
    // Step 1: Create order
    console.log('📋 Step 1: Creating Razorpay order...');
    const createOrderResponse = await fetch('http://localhost:3000/api/payment/razorpay/create-order', {
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

    const createOrderData = await createOrderResponse.json();
    
    if (!createOrderData.success) {
      console.log('❌ Failed to create order:', createOrderData.error);
      return;
    }
    
    console.log('✅ Order created successfully');
    console.log('Order ID:', createOrderData.data.orderId);
    
    // Step 2: Test with valid signature (using our test signature generation)
    console.log('\n📋 Step 2: Testing with valid signature...');
    
    const crypto = require('crypto');
    
    // Generate a valid signature
    function generateValidSignature(orderId, paymentId) {
      const keySecret = 'm6D1WwnpTGAe6GOxxtFtzcBW';
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      return hmac.digest('hex');
    }
    
    const mockPaymentId = 'pay_mock_' + Date.now();
    const validSignature = generateValidSignature(createOrderData.data.orderId, mockPaymentId);
    
    console.log('Generated valid signature:', validSignature);
    
    // Step 3: Verify payment with valid signature
    console.log('\n📋 Step 3: Verifying payment with valid signature...');
    
    const verifyResponse = await fetch('http://localhost:3000/api/payment/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: createOrderData.data.orderId,
        paymentId: mockPaymentId,
        signature: validSignature,
        orderData: createOrderData.data.orderData,
      }),
    });

    const verifyData = await verifyResponse.json();
    
    console.log('Verify Response Status:', verifyResponse.status);
    console.log('Verify Response:', JSON.stringify(verifyData, null, 2));
    
    if (verifyData.success) {
      console.log('✅ Frontend Payment Flow SUCCESS!');
      console.log('Ticket ID:', verifyData.data.id);
      console.log('Event:', verifyData.data.event.title);
      console.log('Guest Name:', verifyData.data.guestName);
      console.log('Guest Email:', verifyData.data.guestEmail);
      console.log('Guest Phone:', verifyData.data.guestPhone);
    } else {
      console.log('❌ Frontend Payment Flow FAILED!');
      console.log('Error:', verifyData.error);
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testFrontendFlowBypassSignature().catch(console.error);
