import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  maxEvents: z.number().min(0).optional(),
  benefits: z.array(z.string()).optional(),
});

const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/subscription-plans - Get all subscription plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// POST /api/subscription-plans - Create subscription plan (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    const plan = await prisma.subscriptionPlan.create({
      data: validatedData,
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'SubscriptionPlan',
        entityId: plan.id,
        newValues: plan,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}
