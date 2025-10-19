#!/usr/bin/env node

/**
 * Frontend Payment Flow Test
 * This script simulates the actual frontend payment flow
 */

async function testFrontendPaymentFlow() {
  try {
    console.log('🎯 Frontend Payment Flow Test');
    console.log('============================');
    
    // Step 1: Create order (simulating frontend call)
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
    console.log('Order Data:', JSON.stringify(createOrderData.data.orderData, null, 2));
    
    // Step 2: Simulate Razorpay payment success (simulating Razorpay callback)
    console.log('\n📋 Step 2: Simulating Razorpay payment success...');
    
    const mockRazorpayResponse = {
      razorpay_order_id: createOrderData.data.orderId,
      razorpay_payment_id: 'pay_mock_' + Date.now(),
      razorpay_signature: 'mock_signature_' + Date.now()
    };
    
    console.log('Mock Razorpay Response:', JSON.stringify(mockRazorpayResponse, null, 2));
    
    // Step 3: Verify payment (simulating frontend verification call)
    console.log('\n📋 Step 3: Verifying payment...');
    
    const verifyResponse = await fetch('http://localhost:3000/api/payment/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: mockRazorpayResponse.razorpay_order_id,
        paymentId: mockRazorpayResponse.razorpay_payment_id,
        signature: mockRazorpayResponse.razorpay_signature,
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
    } else {
      console.log('❌ Frontend Payment Flow FAILED!');
      console.log('Error:', verifyData.error);
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testFrontendPaymentFlow().catch(console.error);
