import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder, razorpayConfig } from '@/lib/razorpay';
import { z } from 'zod';

// Validation schema for subscription payment order
const subscriptionOrderSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  // Guest details (optional for existing users)
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
});

// POST /api/payment/razorpay/subscription/create-order - Create Razorpay order for subscription
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Subscription payment order creation started...');
    
    const body = await request.json();
    const validatedData = subscriptionOrderSchema.parse(body);
    
    const { subscriptionId, guestName, guestEmail, guestPhone } = validatedData;
    
    console.log('📋 Subscription order details:', {
      subscriptionId,
      guestName,
      guestEmail,
      guestPhone
    });

    // Get the subscription with plan details
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
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

    console.log('✅ Subscription found:', subscription.id, 'Plan:', subscription.plan.name);

    // Calculate total amount
    const totalAmount = subscription.price;

    // Check minimum amount requirement for Razorpay (minimum ₹1 = 100 paise)
    if (totalAmount < 1) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1' },
        { status: 400 }
      );
    }

    // Create a shorter receipt (max 40 characters for Razorpay)
    const shortSubscriptionId = subscriptionId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `sub_${shortSubscriptionId}_${timestamp}`;

    console.log('🔄 Creating Razorpay order...');
    const order = await createRazorpayOrder(
      totalAmount,
      'INR',
      receipt
    );

    console.log('✅ Razorpay order created:', order.id);

    // Store order details temporarily
    const orderData = {
      orderId: order.id,
      subscriptionId: subscriptionId,
      totalAmount: totalAmount,
      guestName: guestName || subscription.user.name,
      guestEmail: guestEmail || subscription.user.email,
      guestPhone: guestPhone || subscription.user.phone,
      userId: subscription.userId,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayConfig.key_id,
        name: razorpayConfig.name,
        description: `${subscription.plan.name} Subscription - ${subscription.plan.duration} months`,
        image: razorpayConfig.image,
        theme: razorpayConfig.theme,
        orderData: orderData,
      },
    });

  } catch (error) {
    console.error('Error creating subscription order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
