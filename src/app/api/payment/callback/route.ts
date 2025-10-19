import { NextRequest, NextResponse } from 'next/server';
import { PaytmService } from '@/lib/paytm';

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
    const { checksum, ...responseParams } = body;

    // Verify checksum
    const isValidChecksum = paytmService.verifyChecksum(responseParams, checksum);
    
    if (!isValidChecksum) {
      return NextResponse.json(
        { error: 'Invalid checksum' },
        { status: 400 }
      );
    }

    const {
      ORDERID: orderId,
      TXNID: txnId,
      TXNAMOUNT: amount,
      STATUS: status,
      RESPCODE: responseCode,
      RESPMSG: responseMessage,
      BANKTXNID: bankTxnId,
      GATEWAYNAME: gatewayName,
      PAYMENTMODE: paymentMode,
      CURRENCY: currency,
      TXNDATE: txnDate,
    } = responseParams;

    // Process payment based on status
    if (status === 'TXN_SUCCESS') {
      // Payment successful - update database
      console.log('Payment successful:', {
        orderId,
        txnId,
        amount,
        bankTxnId,
        gatewayName,
        paymentMode,
        currency,
        txnDate,
      });

      // TODO: Update database with successful payment
      // - Mark ticket/subscription as paid
      // - Send confirmation email
      // - Update user records

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        orderId,
        txnId,
        amount,
      });
    } else {
      // Payment failed
      console.log('Payment failed:', {
        orderId,
        status,
        responseCode,
        responseMessage,
      });

      return NextResponse.json({
        success: false,
        message: 'Payment failed',
        orderId,
        status,
        responseCode,
        responseMessage,
      });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment callback' },
      { status: 500 }
    );
  }
}
