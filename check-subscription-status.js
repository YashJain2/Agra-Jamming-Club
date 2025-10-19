#!/usr/bin/env node

/**
 * Check Subscription Status
 * This script checks the current status of a subscription
 */

async function checkSubscriptionStatus() {
  try {
    console.log('🔍 Checking Subscription Status');
    console.log('===============================');
    
    const subscriptionId = 'cmgxnasoe000t11fvdubji42o';
    
    // Check subscription status using Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        user: true,
      },
    });
    
    if (subscription) {
      console.log('✅ Subscription found:');
      console.log('  ID:', subscription.id);
      console.log('  Status:', subscription.status);
      console.log('  Plan:', subscription.plan.name);
      console.log('  User:', subscription.user.name, '(' + subscription.user.email + ')');
      console.log('  Price:', subscription.price);
      console.log('  Start Date:', subscription.startDate);
      console.log('  End Date:', subscription.endDate);
    } else {
      console.log('❌ Subscription not found');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('❌ Check Error:', error.message);
  }
}

// Run the check
checkSubscriptionStatus().catch(console.error);
