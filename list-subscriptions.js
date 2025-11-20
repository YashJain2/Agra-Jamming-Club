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
    console.log('📋 SUBSCRIPTION LIST\n');
    console.log('=' .repeat(80));

    // Get all subscriptions
    const subscriptions = await prisma.subscription.findMany({
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

    console.log(`\nTotal Subscriptions: ${subscriptions.length}\n`);

    // Group by status
    const activeSubscriptions = subscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const endDate = new Date(s.endDate);
      const now = new Date();
      return endDate > now;
    });

    const expiredSubscriptions = subscriptions.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const endDate = new Date(s.endDate);
      const now = new Date();
      return endDate <= now;
    });

    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED');
    const pendingSubscriptions = subscriptions.filter(s => s.status === 'PENDING');

    console.log(`📊 Status Breakdown:`);
    console.log(`   Active (not expired): ${activeSubscriptions.length}`);
    console.log(`   Expired: ${expiredSubscriptions.length}`);
    console.log(`   Cancelled: ${cancelledSubscriptions.length}`);
    console.log(`   Pending: ${pendingSubscriptions.length}`);

    console.log(`\n\n✅ ACTIVE SUBSCRIPTIONS:\n`);
    activeSubscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
      console.log(`   Phone: ${sub.user.phone || 'N/A'}`);
      console.log(`   Price: ₹${sub.price}`);
      console.log(`   Start Date: ${new Date(sub.startDate).toLocaleDateString()}`);
      console.log(`   End Date: ${new Date(sub.endDate).toLocaleDateString()}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${new Date(sub.createdAt).toLocaleString()}`);
      console.log('');
    });

    if (expiredSubscriptions.length > 0) {
      console.log(`\n\n⏰ EXPIRED SUBSCRIPTIONS:\n`);
      expiredSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.user.name || 'N/A'} (${sub.user.email})`);
        console.log(`   End Date: ${new Date(sub.endDate).toLocaleDateString()}`);
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

    // Check for payment pay_RbjhnrDftXcSCM
    console.log(`\n\n🔍 Checking payment pay_RbjhnrDftXcSCM:\n`);
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: 'pay_RbjhnrDftXcSCM'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true
          }
        },
        ticket: true
      }
    });

    if (payment) {
      console.log(`✅ Payment Found:`);
      console.log(`   Payment ID: ${payment.id}`);
      console.log(`   Gateway Txn ID: ${payment.gatewayTxnId}`);
      console.log(`   Amount: ₹${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   User: ${payment.user.name} (${payment.user.email})`);
      console.log(`   Phone: ${payment.user.phone || 'N/A'}`);
      console.log(`   Linked to Ticket: ${payment.ticket ? `Yes (ID: ${payment.ticket.id})` : 'No'}`);
      console.log(`   Created: ${new Date(payment.createdAt).toLocaleString()}`);
    } else {
      console.log(`❌ Payment not found in database`);
      console.log(`   This payment was deleted because ₹299 is only for subscriptions`);
      
      // Check if user has subscription
      const user = await prisma.user.findFirst({
        where: { email: 'pratibhamotog@gmail.com' }
      });
      
      if (user) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            price: 299
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        if (subscription) {
          console.log(`\n✅ User has subscription:`);
          console.log(`   User: ${user.name || 'N/A'} (${user.email})`);
          console.log(`   Subscription Status: ${subscription.status}`);
          console.log(`   Start Date: ${new Date(subscription.startDate).toLocaleDateString()}`);
          console.log(`   End Date: ${new Date(subscription.endDate).toLocaleDateString()}`);
          console.log(`   Price: ₹${subscription.price}`);
        } else {
          console.log(`\n⚠️  User exists but no subscription found`);
          console.log(`   User: ${user.name || 'N/A'} (${user.email})`);
        }
      } else {
        console.log(`\n⚠️  User not found: pratibhamotog@gmail.com`);
      }
    }

    console.log(`\n\n` + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



