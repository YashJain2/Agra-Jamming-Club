const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from env file
const envPath = path.join(__dirname, 'env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^DATABASE_URL=(.+)$/);
    if (match) {
      process.env.DATABASE_URL = match[1].trim();
      break;
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Simulating Admin Panel Subscription Filter...\n');
    console.log('=' .repeat(80));

    // Get all subscriptions (as admin would)
    const allSubscriptions = await prisma.subscription.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total subscriptions fetched: ${allSubscriptions.length}\n`);

    // Simulate the admin panel filter (same logic as in page.tsx)
    const activeSubscriptions = allSubscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const endDate = new Date(s.endDate);
      const now = new Date();
      return endDate > now; // Only count if not expired
    });

    console.log(`Active subscriptions (after filter): ${activeSubscriptions.length}\n`);

    // Show what's being filtered out
    const filteredOut = allSubscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return true;
      const endDate = new Date(s.endDate);
      const now = new Date();
      return endDate <= now;
    });

    console.log(`Filtered out: ${filteredOut.length}\n`);

    if (filteredOut.length > 0) {
      console.log('Subscriptions filtered out:\n');
      filteredOut.forEach((sub, idx) => {
        const endDate = new Date(sub.endDate);
        const now = new Date();
        const isExpired = endDate <= now;
        console.log(`${idx + 1}. ${sub.user.name} (${sub.user.email})`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   End Date: ${sub.endDate} (${endDate.toISOString()})`);
        console.log(`   Now: ${now.toISOString()}`);
        console.log(`   Is Expired: ${isExpired}`);
        console.log(`   Reason: ${sub.status !== 'ACTIVE' ? 'Status is not ACTIVE' : 'End date has passed'}`);
        console.log('');
      });
    }

    if (activeSubscriptions.length > 0) {
      console.log('\n✅ Active Subscriptions (would be shown in admin panel):\n');
      activeSubscriptions.forEach((sub, idx) => {
        const endDate = new Date(sub.endDate);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`${idx + 1}. ${sub.user.name} (${sub.user.email})`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   End Date: ${sub.endDate}`);
        console.log(`   Days Remaining: ${daysRemaining}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  NO ACTIVE SUBSCRIPTIONS FOUND\n');
      console.log('This is why the admin panel shows 0 active subscriptions.');
    }

    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



