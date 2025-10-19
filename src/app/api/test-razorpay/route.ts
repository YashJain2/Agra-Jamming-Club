import { NextRequest, NextResponse } from 'next/server';
import { razorpay, razorpayConfig } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Razorpay configuration...');
    
    // Test Razorpay instance
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 rupee in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      payment_capture: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Razorpay configuration is working',
      config: {
        keyId: razorpayConfig.key_id,
        currency: razorpayConfig.currency,
        name: razorpayConfig.name,
      },
      testOrder: {
        id: testOrder.id,
        amount: testOrder.amount,
        currency: testOrder.currency,
        status: testOrder.status,
      },
    });

  } catch (error) {
    console.error('Razorpay test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Razorpay configuration failed', 
        details: (error as Error).message,
        config: {
          keyId: razorpayConfig.key_id,
          hasKeySecret: !!razorpayConfig.key_secret,
        }
      },
      { status: 500 }
    );
  }
}
