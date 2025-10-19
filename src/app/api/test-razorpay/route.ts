import { NextRequest, NextResponse } from 'next/server';
import { razorpay, razorpayConfig } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Razorpay configuration...');
    console.log('Razorpay config:', razorpayConfig);
    
    // Test Razorpay REST API directly
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${razorpayConfig.key_id}:${razorpayConfig.key_secret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: 100, // 1 rupee in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    console.log('Razorpay API response status:', response.status);
    console.log('Razorpay API response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error response:', errorText);
      throw new Error(`Razorpay API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const testOrder = await response.json();
    console.log('Test order result:', testOrder);
    console.log('Test order type:', typeof testOrder);
    console.log('Test order keys:', testOrder ? Object.keys(testOrder) : 'undefined');

    return NextResponse.json({
      success: true,
      message: 'Razorpay configuration is working',
      config: {
        keyId: razorpayConfig.key_id,
        currency: razorpayConfig.currency,
        name: razorpayConfig.name,
      },
      testOrder: testOrder ? {
        id: testOrder.id,
        amount: testOrder.amount,
        currency: testOrder.currency,
        status: testOrder.status,
      } : null,
    });

  } catch (error) {
    console.error('Razorpay test error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Razorpay configuration failed', 
        details: (error as Error).message,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        config: {
          keyId: razorpayConfig.key_id,
          hasKeySecret: !!razorpayConfig.key_secret,
        }
      },
      { status: 500 }
    );
  }
}
