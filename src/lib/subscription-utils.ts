import { prisma } from './prisma';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  canAccessForFree: boolean;
  subscription?: {
    id: string;
    planId: string;
    startDate: Date;
    endDate: Date;
    status: string;
    plan: {
      id: string;
      name: string;
      price: number;
      duration: number;
      benefits: string[];
    };
  };
  daysRemaining?: number;
  isExpired?: boolean;
}

/**
 * Check if a user has an active, non-expired subscription
 */
export async function checkUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(), // Not expired
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc', // Get the most recent subscription
      },
    });

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        canAccessForFree: false,
        isExpired: true,
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return {
      hasActiveSubscription: true,
      canAccessForFree: !isExpired && subscription.status === 'ACTIVE',
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          duration: subscription.plan.duration,
          benefits: subscription.plan.benefits || [],
        },
      },
      daysRemaining: Math.max(0, daysRemaining),
      isExpired,
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      hasActiveSubscription: false,
      canAccessForFree: false,
      isExpired: true,
    };
  }
}

/**
 * Check if a user can access events for free based on their subscription
 */
export async function canUserAccessEventsForFree(userId: string): Promise<boolean> {
  const subscriptionStatus = await checkUserSubscriptionStatus(userId);
  return subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isExpired;
}

/**
 * Get subscription benefits for a user
 */
export async function getUserSubscriptionBenefits(userId: string): Promise<string[]> {
  const subscriptionStatus = await checkUserSubscriptionStatus(userId);
  
  if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.subscription) {
    return [];
  }

  return subscriptionStatus.subscription.plan.benefits || [];
}

/**
 * Check if a user has used their free event access for the current month
 */
export async function hasUserUsedFreeAccessThisMonth(userId: string, eventId: string): Promise<boolean> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Check if user already has tickets for this event in the current month
    const existingTickets = await prisma.ticket.findFirst({
      where: {
        userId: userId,
        eventId: eventId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'USED'],
        },
      },
    });

    return !!existingTickets;
  } catch (error) {
    console.error('Error checking free access usage:', error);
    return false;
  }
}

/**
 * Get the number of free events a user can access this month
 */
export async function getFreeEventsLimitThisMonth(userId: string): Promise<number> {
  const subscriptionStatus = await checkUserSubscriptionStatus(userId);
  
  if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.subscription) {
    return 0;
  }

  // For monthly subscriptions, users get unlimited free access to events
  // You can modify this logic based on your business rules
  const plan = subscriptionStatus.subscription.plan;
  
  if (plan.name.toLowerCase().includes('monthly')) {
    return -1; // -1 means unlimited
  }
  
  return 0;
}
