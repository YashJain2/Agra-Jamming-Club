import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  startDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(true),
});

const updateSubscriptionSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING']).optional(),
  autoRenew: z.boolean().optional(),
  cancellationReason: z.string().optional(),
});

// GET /api/subscriptions - Get subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};

    // Regular users can only see their own subscriptions
    if (session.user.role === 'USER') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: true,
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create subscription (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: validatedData.userId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = await prisma.subscription.create({
      data: {
        userId: validatedData.userId,
        planId: validatedData.planId,
        startDate,
        endDate,
        price: plan.price,
        autoRenew: validatedData.autoRenew,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    console.error('Error creating subscription:', error);
    
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
