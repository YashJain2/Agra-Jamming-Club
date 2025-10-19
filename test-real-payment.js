#!/usr/bin/env node

/**
 * Real Payment Verification Test
 * This script tests the payment verification with real Razorpay data
 */

async function testRealPaymentVerification() {
  try {
    console.log('🎯 Real Payment Verification Test');
    console.log('==================================');
    
    const realPaymentData = {
      orderId: "order_RVJTzqRQMl1Fzh",
      paymentId: "pay_RVJUS1D8fSN4e1",
      signature: "64ce27bd74728f0466e32ebc61103e76cfbb5e330cb63f7a64cf6c8d6d2f54df",
      orderData: {
        orderId: "order_RVJTzqRQMl1Fzh",
        eventId: "cmgxkm7ao00012xearybs7e8d",
        quantity: 1,
        totalAmount: 1,
        userId: "cmgxjt2vk000090p2x2bnroav",
        isGuestCheckout: false,
        createdAt: "2025-10-19T11:21:34.614Z"
      }
    };

    console.log('Order ID:', realPaymentData.orderId);
    console.log('Payment ID:', realPaymentData.paymentId);
    console.log('Event ID:', realPaymentData.orderData.eventId);
    console.log('User ID:', realPaymentData.orderData.userId);
    console.log('');

    console.log('🔄 Testing Real Payment Verification...');
    
    const response = await fetch('http://localhost:3000/api/payment/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realPaymentData),
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Real Payment Verification SUCCESS!');
      console.log('Ticket ID:', result.data.id);
      console.log('Event:', result.data.event.title);
      console.log('User:', result.data.user?.name || 'Guest');
    } else {
      console.log('❌ Real Payment Verification FAILED!');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testRealPaymentVerification().catch(console.error);
