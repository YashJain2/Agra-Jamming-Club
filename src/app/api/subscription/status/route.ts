import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserSubscriptionStatus, canUserAccessEventsForFree, getUserSubscriptionBenefits } from '@/lib/subscription-utils';

// GET /api/subscription/status - Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get comprehensive subscription status
    const subscriptionStatus = await checkUserSubscriptionStatus(userId);
    const canAccessForFree = await canUserAccessEventsForFree(userId);
    const benefits = await getUserSubscriptionBenefits(userId);

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
        canAccessEventsForFree: canAccessForFree,
        subscription: subscriptionStatus.subscription,
        daysRemaining: subscriptionStatus.daysRemaining,
        isExpired: subscriptionStatus.isExpired,
        benefits: benefits,
      },
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
