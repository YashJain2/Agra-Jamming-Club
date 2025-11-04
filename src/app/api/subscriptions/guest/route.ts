import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for guest subscription purchase
const guestSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  // Guest details
  guestName: z.string().min(1, 'Name is required'),
  guestEmail: z.string().email('Valid email is required'),
  guestPhone: z.string().min(1, 'Phone number is required'),
});

// POST /api/subscriptions/guest - Create subscription for guest users
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Guest subscription purchase started...');
    
    const body = await request.json();
    const validatedData = guestSubscriptionSchema.parse(body);
    
    const { planId, guestName, guestEmail, guestPhone } = validatedData;
    
    console.log('📋 Guest subscription details:', {
      planId,
      guestName,
      guestEmail,
      guestPhone
    });

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: 'Subscription plan is not available' },
        { status: 400 }
      );
    }

    console.log('✅ Plan found:', plan.name, 'Price:', plan.price);

    // Check if guest email already has a subscription
    const existingGuestUser = await prisma.user.findFirst({
      where: { email: guestEmail }
    });

    let userId: string;

    if (existingGuestUser) {
      // Check if this user already has any subscription (ACTIVE or PENDING)
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: existingGuestUser.id,
          status: {
            in: ['ACTIVE', 'PENDING']
          },
        },
      });

      if (existingSubscription) {
        // If it's pending and payment failed, cancel it first
        if (existingSubscription.status === 'PENDING') {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { status: 'CANCELLED' }
          });
        } else {
          return NextResponse.json(
            { error: 'This email already has an active subscription' },
            { status: 400 }
          );
        }
      }

      userId = existingGuestUser.id;
      console.log('✅ Using existing user:', userId);
    } else {
      // Create a new guest user
      const newGuestUser = await prisma.user.create({
        data: {
          email: guestEmail,
          name: guestName,
          phone: guestPhone,
          role: 'USER',
          password: null, // No password for guest users
        }
      });
      
      userId = newGuestUser.id;
      console.log('✅ Created new guest user:', userId);
    }

    // Create the subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        planId: planId,
        startDate,
        endDate,
        price: plan.price,
        status: 'PENDING', // Will be activated after payment
        autoRenew: false, // Guest subscriptions don't auto-renew by default
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        plan: true,
      },
    });

    console.log('✅ Subscription created:', subscription.id);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE',
        entity: 'Subscription',
        entityId: subscription.id,
        newValues: {
          planId: subscription.planId,
          price: subscription.price,
          guestEmail: guestEmail,
          guestName: guestName,
          guestPhone: guestPhone,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription,
        guestDetails: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
        },
        plan: plan,
        paymentRequired: true,
        message: 'Subscription created successfully. Payment required to activate.',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating guest subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
