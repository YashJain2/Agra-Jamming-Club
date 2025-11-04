#!/usr/bin/env node

/**
 * Script to remove all PENDING subscriptions from database
 * PENDING subscriptions are created when payment hasn't been confirmed
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (match) {
    process.env.DATABASE_URL = match[1];
  }
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Starting cleanup of PENDING subscriptions...');

    // Find all PENDING subscriptions
    const pendingSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        plan: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${pendingSubscriptions.length} PENDING subscriptions`);

    if (pendingSubscriptions.length === 0) {
      console.log('✅ No PENDING subscriptions to clean up');
      await prisma.$disconnect();
      return;
    }

    // Display what will be deleted
    console.log('\n📋 PENDING subscriptions to be removed:');
    pendingSubscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email}) - ${sub.plan.name} - ₹${sub.price}`);
    });

    // Delete all PENDING subscriptions
    const result = await prisma.subscription.deleteMany({
      where: {
        status: 'PENDING'
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} PENDING subscriptions`);
    console.log('🎉 Database cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

