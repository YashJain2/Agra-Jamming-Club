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
    console.log('📋 Checking Active Subscriptions...\n');
    console.log('=' .repeat(80));

    // Get all subscriptions
    const allSubscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total Subscriptions: ${allSubscriptions.length}\n`);

    // Filter active subscriptions (status ACTIVE and not expired)
    const now = new Date();
    const activeSubscriptions = allSubscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const endDate = new Date(s.endDate);
      return endDate > now;
    });

    const expiredSubscriptions = allSubscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const endDate = new Date(s.endDate);
      return endDate <= now;
    });

    const cancelledSubscriptions = allSubscriptions.filter(s => s.status === 'CANCELLED');
    const pendingSubscriptions = allSubscriptions.filter(s => s.status === 'PENDING');

    console.log(`📊 Status Breakdown:`);
    console.log(`   Active (not expired): ${activeSubscriptions.length}`);
    console.log(`   Expired: ${expiredSubscriptions.length}`);
    console.log(`   Cancelled: ${cancelledSubscriptions.length}`);
    console.log(`   Pending: ${pendingSubscriptions.length}`);

    if (activeSubscriptions.length > 0) {
      console.log(`\n\n✅ ACTIVE SUBSCRIPTIONS:\n`);
      activeSubscriptions.forEach((sub, index) => {
        const endDate = new Date(sub.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
        console.log(`   Phone: ${sub.user.phone || 'N/A'}`);
        console.log(`   Price: ₹${sub.price}`);
        console.log(`   Start Date: ${new Date(sub.startDate).toLocaleDateString()}`);
        console.log(`   End Date: ${new Date(sub.endDate).toLocaleDateString()}`);
        console.log(`   Days Remaining: ${daysRemaining}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Created: ${new Date(sub.createdAt).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log(`\n\n⚠️  NO ACTIVE SUBSCRIPTIONS FOUND\n`);
    }

    if (expiredSubscriptions.length > 0) {
      console.log(`\n\n⏰ EXPIRED SUBSCRIPTIONS:\n`);
      expiredSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
        console.log(`   End Date: ${new Date(sub.endDate).toLocaleDateString()}`);
        console.log('');
      });
    }

    if (pendingSubscriptions.length > 0) {
      console.log(`\n\n⏳ PENDING SUBSCRIPTIONS:\n`);
      pendingSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
        console.log(`   Price: ₹${sub.price}`);
        console.log(`   Created: ${new Date(sub.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    if (cancelledSubscriptions.length > 0) {
      console.log(`\n\n❌ CANCELLED SUBSCRIPTIONS:\n`);
      cancelledSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
        console.log(`   Cancelled: ${new Date(sub.updatedAt).toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check for payments linked to subscriptions
    console.log(`\n\n💳 Subscription Payments (₹299):\n`);
    const subscriptionPayments = await prisma.payment.findMany({
      where: {
        amount: 299,
        ticketId: null // Not linked to tickets
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`   Total subscription payments: ${subscriptionPayments.length}`);
    subscriptionPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.user.name} (${payment.user.email})`);
      console.log(`      Payment ID: ${payment.gatewayTxnId || 'N/A'}`);
      console.log(`      Status: ${payment.status}`);
      console.log(`      Created: ${new Date(payment.createdAt).toLocaleString()}`);
    });

    console.log(`\n` + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



