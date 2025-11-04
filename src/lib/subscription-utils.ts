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

/**
 * Check if a user can access a specific event for free based on their subscription
 * This considers the event date and subscription validity period
 */
export async function canUserAccessEventForFree(userId: string, eventDate: Date): Promise<{
  canAccessForFree: boolean;
  reason: 'no_subscription' | 'subscription_expired' | 'event_past' | 'subscription_valid';
  subscriptionEndDate?: Date;
}> {
  try {
    const subscriptionStatus = await checkUserSubscriptionStatus(userId);
    
    // No subscription
    if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.subscription) {
      return {
        canAccessForFree: false,
        reason: 'no_subscription'
      };
    }

    const now = new Date();
    const subscription = subscriptionStatus.subscription;
    
    // Check if event is in the past
    if (eventDate < now) {
      return {
        canAccessForFree: false,
        reason: 'event_past'
      };
    }

    // Check if subscription expires before the event date
    if (subscription.endDate < eventDate) {
      return {
        canAccessForFree: false,
        reason: 'subscription_expired',
        subscriptionEndDate: subscription.endDate
      };
    }

    // Subscription is valid for this event
    return {
      canAccessForFree: true,
      reason: 'subscription_valid',
      subscriptionEndDate: subscription.endDate
    };

  } catch (error) {
    console.error('Error checking event access:', error);
    return {
      canAccessForFree: false,
      reason: 'no_subscription'
    };
  }
}

/**
 * Check if an event is in the past
 */
export function isEventPast(eventDate: Date): boolean {
  const now = new Date();
  return eventDate < now;
}

/**
 * Get event pricing information for a user
 */
export async function getEventPricingForUser(userId: string, eventDate: Date, eventPrice: number): Promise<{
  isFree: boolean;
  displayPrice: number;
  isPastEvent: boolean;
  subscriptionValid: boolean;
  subscriptionEndDate?: Date;
  reason: string;
}> {
  const isPastEvent = isEventPast(eventDate);
  
  if (isPastEvent) {
    return {
      isFree: false,
      displayPrice: eventPrice,
      isPastEvent: true,
      subscriptionValid: false,
      reason: 'Event has already passed'
    };
  }

  const accessInfo = await canUserAccessEventForFree(userId, eventDate);
  
  return {
    isFree: accessInfo.canAccessForFree,
    displayPrice: accessInfo.canAccessForFree ? 0 : eventPrice,
    isPastEvent: false,
    subscriptionValid: accessInfo.canAccessForFree,
    subscriptionEndDate: accessInfo.subscriptionEndDate,
    reason: accessInfo.reason === 'subscription_valid' ? 'Free with subscription' : 
            accessInfo.reason === 'subscription_expired' ? 'Subscription expires before event' :
            accessInfo.reason === 'no_subscription' ? 'No active subscription' : 'Unknown'
  };
}
