import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Initialize subscription plans
 * This endpoint creates the ₹299 monthly subscription plan if it doesn't exist
 * Can be called without authentication for initialization purposes
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the ₹299 plan already exists
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        price: 299,
        duration: 1,
      },
    });

    if (existingPlan) {
      return NextResponse.json({
        success: true,
        message: '₹299 monthly subscription plan already exists',
        data: existingPlan,
      });
    }

    // Create the ₹299 monthly subscription plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Full Access - Monthly Membership',
        description: 'Access to both monthly meetups with all member benefits',
        price: 299,
        duration: 1, // 1 month
        maxEvents: null, // unlimited events
        benefits: [
          'Priority invites & early access to events',
          'Entry into our Members-Only WhatsApp group',
          'Special opportunities to perform, host, or collaborate',
          'Exclusive offers and community perks from our partners',
          'Access to both monthly meetups',
          'No judgment zone - sing freely',
          'Inclusive and safe space',
        ],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '₹299 monthly subscription plan created successfully',
      data: plan,
    });

  } catch (error) {
    console.error('Error initializing subscription plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize subscription plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if plan exists
export async function GET(request: NextRequest) {
  try {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        price: 299,
        duration: 1,
      },
    });

    if (plan) {
      return NextResponse.json({
        success: true,
        exists: true,
        data: plan,
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      message: '₹299 monthly subscription plan does not exist',
    });

  } catch (error) {
    console.error('Error checking subscription plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check subscription plan'
      },
      { status: 500 }
    );
  }
}


