import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createUserSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
});

// POST /api/subscriptions/user - Create subscription for authenticated users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSubscriptionSchema.parse(body);

    const { planId } = validatedData;
    const userId = session.user.id;

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

    // Check if user already has any subscription (ACTIVE or PENDING)
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
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
          { error: 'You already have an active subscription' },
          { status: 400 }
        );
      }
    }

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
        autoRenew: false, // Users can choose to enable auto-renew later
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Subscription',
        entityId: subscription.id,
        newValues: subscription,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });

  } catch (error) {
    console.error('Error creating user subscription:', error);
    
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
