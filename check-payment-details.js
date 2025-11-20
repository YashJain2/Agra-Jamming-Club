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
    console.log('🔍 Detailed information for pay_RbjhnrDftXcSCM:\n');
    console.log('=' .repeat(80));

    // Check user
    const user = await prisma.user.findFirst({
      where: { email: 'pratibhamotog@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User Information:`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   User ID: ${user.id}`);

    // Check subscription
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
      console.log(`\n📋 Subscription Information:`);
      console.log(`   Subscription ID: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Price: ₹${subscription.price}`);
      console.log(`   Start Date: ${new Date(subscription.startDate).toLocaleString()}`);
      console.log(`   End Date: ${new Date(subscription.endDate).toLocaleString()}`);
      console.log(`   Created: ${new Date(subscription.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(subscription.updatedAt).toLocaleString()}`);
    } else {
      console.log(`\n❌ No subscription found`);
    }

    // Check all payments for this user
    const allPayments = await prisma.payment.findMany({
      where: {
        userId: user.id
      },
      include: {
        ticket: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n💳 All Payments for this user:`);
    console.log(`   Total payments: ${allPayments.length}`);
    
    if (allPayments.length > 0) {
      allPayments.forEach((payment, index) => {
        console.log(`\n   ${index + 1}. Payment ID: ${payment.id}`);
        console.log(`      Gateway Txn ID: ${payment.gatewayTxnId || 'N/A'}`);
        console.log(`      Amount: ₹${payment.amount}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Linked to Ticket: ${payment.ticket ? `Yes (ID: ${payment.ticket.id}, Qty: ${payment.ticket.quantity})` : 'No'}`);
        console.log(`      Created: ${new Date(payment.createdAt).toLocaleString()}`);
      });
    } else {
      console.log(`   No payments found`);
    }

    // Check if payment pay_RbjhnrDftXcSCM exists anywhere
    const specificPayment = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: 'pay_RbjhnrDftXcSCM'
      }
    });

    console.log(`\n\n🔍 Payment pay_RbjhnrDftXcSCM:`);
    if (specificPayment) {
      console.log(`   ✅ Found in database`);
      console.log(`   Payment ID: ${specificPayment.id}`);
      console.log(`   Amount: ₹${specificPayment.amount}`);
      console.log(`   Status: ${specificPayment.status}`);
    } else {
      console.log(`   ❌ Not found in database`);
      console.log(`   This payment was deleted because it was incorrectly linked to a ticket.`);
      console.log(`   Since ₹299 is only for subscriptions, this payment should be for subscription only.`);
    }

    // Summary
    console.log(`\n\n📊 Summary:`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Subscription Status: ${subscription?.status || 'None'}`);
    console.log(`   Total Payments: ${allPayments.length}`);
    console.log(`   Payment pay_RbjhnrDftXcSCM: ${specificPayment ? 'Exists' : 'Deleted (was linked to ticket)'}`);

    console.log(`\n` + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



