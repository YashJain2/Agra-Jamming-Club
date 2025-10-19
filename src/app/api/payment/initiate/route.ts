import { NextRequest, NextResponse } from 'next/server';
import { PaytmService } from '@/lib/paytm';
import crypto from 'crypto';

const paytmService = new PaytmService({
  merchantId: process.env.PAYTM_MERCHANT_ID!,
  merchantKey: process.env.PAYTM_MERCHANT_KEY!,
  website: process.env.PAYTM_WEBSITE!,
  industryType: process.env.PAYTM_INDUSTRY_TYPE!,
  channelId: process.env.PAYTM_CHANNEL_ID!,
  callbackUrl: process.env.PAYTM_CALLBACK_URL!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerId, eventId, ticketQuantity, subscriptionId } = body;

    if (!orderId || !amount || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate unique order ID if not provided
    const finalOrderId = orderId || `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Create payment request
    const paymentRequest: Record<string, string> = paytmService.createPaymentRequest(
      finalOrderId,
      amount,
      customerId
    );

    // Add additional parameters for tracking
    if (eventId) {
      paymentRequest.EVENT_ID = eventId;
    }
    if (ticketQuantity) {
      paymentRequest.TICKET_QUANTITY = ticketQuantity.toString();
    }
    if (subscriptionId) {
      paymentRequest.SUBSCRIPTION_ID = subscriptionId;
    }

    const paytmUrl = paytmService.getPaytmUrl();

    return NextResponse.json({
      success: true,
      orderId: finalOrderId,
      paymentRequest,
      paytmUrl,
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
