import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { sendEmail, emailTemplates } from '@/lib/email';
import { z } from 'zod';

// Validation schema for subscription payment verification
const verifySubscriptionPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
  orderData: z.object({
    subscriptionId: z.string(),
    totalAmount: z.number(),
    guestName: z.string().optional(),
    guestEmail: z.string().optional(),
    guestPhone: z.string().optional(),
    userId: z.string(),
  }),
});

// POST /api/payment/razorpay/subscription/verify - Verify subscription payment
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Subscription payment verification started...');
    
    const body = await request.json();
    const validatedData = verifySubscriptionPaymentSchema.parse(body);
    
    const { orderId, paymentId, signature, orderData } = validatedData;
    console.log('🔍 Payment details:', { orderId, paymentId, subscriptionId: orderData.subscriptionId });

    // Verify payment signature
    console.log('🔐 Verifying payment signature...');
    const isSignatureValid = await verifyPaymentSignature(orderId, paymentId, signature);
    console.log('🔐 Signature valid:', isSignatureValid);

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: orderData.subscriptionId },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Subscription is not pending payment' },
        { status: 400 }
      );
    }

    console.log('✅ Subscription found:', subscription.id);

    // Update subscription status to ACTIVE
    console.log('🔄 Activating subscription...');
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      include: {
        plan: true,
        user: true,
      },
    });

    console.log('✅ Subscription activated:', updatedSubscription.id);

    // Create payment record
    console.log('🔄 Creating payment record...');
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: orderData.totalAmount,
        currency: 'INR',
        status: 'COMPLETED',
        paymentMethod: 'RAZORPAY',
        razorpayPaymentId: paymentId,
        orderId: orderId,
        signature: signature,
        paidAt: new Date(),
      },
    });

    console.log('✅ Payment record created:', payment.id);

    // Log the action
    console.log('🔄 Logging audit action...');
    await prisma.auditLog.create({
      data: {
        userId: orderData.userId,
        action: 'PAYMENT_SUCCESS',
        entity: 'Subscription',
        entityId: subscription.id,
        newValues: {
          paymentId: paymentId,
          orderId: orderId,
          subscriptionId: subscription.id,
          amount: orderData.totalAmount,
          status: 'ACTIVE',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    console.log('✅ Payment verification completed successfully');

    // Send confirmation email
    console.log('📧 Sending subscription confirmation email...');
    const guestDetails = {
      name: orderData.guestName || subscription.user.name,
      email: orderData.guestEmail || subscription.user.email,
      phone: orderData.guestPhone || subscription.user.phone,
    };

    const emailTemplate = emailTemplates.guestSubscriptionConfirmation(
      guestDetails,
      updatedSubscription,
      subscription.plan
    );

    const emailSent = await sendEmail({
      to: guestDetails.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (emailSent) {
      console.log('✅ Subscription confirmation email sent successfully');
    } else {
      console.log('⚠️ Failed to send subscription confirmation email');
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: updatedSubscription,
        payment: payment,
        guestDetails: guestDetails,
        emailSent: emailSent,
      },
      message: 'Payment successful! Your subscription has been activated.',
      paymentId: paymentId,
      orderId: orderId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
