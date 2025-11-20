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
    console.log('🔍 Checking ₹299 payments to identify subscription vs ticket payments...\n');

    // All ₹299 payments
    const payments299 = [
      { paymentId: 'pay_Rc01OFTxgLly9A', email: 'rj9926@gmail.com', name: 'Rahul Jain' },
      { paymentId: 'pay_RbxTo6OC0Rt4jJ', email: 'priyaseth205@gmail.com', name: 'Priya Seth' },
      { paymentId: 'pay_RbvsOsLO5LTi5x', email: 'ksshoesagra@gmail.com', name: 'Rahul Khatri' },
      { paymentId: 'pay_Rblwa4DC6E0zqs', email: 'mohitmoolchandani92@gmail.com', name: 'Manav' },
      { paymentId: 'pay_RbjhnrDftXcSCM', email: 'pratibhamotog@gmail.com', name: 'Pratibha Motog' },
      { paymentId: 'pay_RbismsuyRTPi6I', email: 'reemaarav2010@gmail.com', name: 'Reema Agarwal' },
      { paymentId: 'pay_Rbiiolyf8TZ5QF', email: 'sakshi.nk23@gmail.com', name: 'Sakshi Nijhawan' },
      { paymentId: 'pay_RbigE14jysKsFn', email: 'rover.rapper@gmail.com', name: 'Rohan Verma' },
      { paymentId: 'pay_RbZanviXu9trG7', email: 'prasukh123@gmail.com', name: 'Prasukh Jain' },
    ];

    console.log(`Total ₹299 payments: ${payments299.length}\n`);

    // Find the event
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { title: { contains: 'Sip and Jam', mode: 'insensitive' } },
          { price: 199 }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let subscriptionCount = 0;
    let ticketCount = 0;

    for (const paymentData of payments299) {
      // Check if payment exists and is linked to a ticket
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayTxnId: paymentData.paymentId
        },
        include: {
          ticket: true
        }
      });

      // Check if user has a subscription with this payment
      const user = await prisma.user.findFirst({
        where: { email: paymentData.email }
      });

      let isSubscription = false;
      if (user) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            price: 299
          }
        });
        if (subscription) {
          isSubscription = true;
        }
      }

      if (payment && payment.ticket) {
        console.log(`✅ ${paymentData.paymentId} (${paymentData.email}): TICKET PAYMENT`);
        console.log(`   Ticket ID: ${payment.ticket.id}, Quantity: ${payment.ticket.quantity}`);
        ticketCount++;
      } else if (isSubscription || (!payment || !payment.ticket)) {
        console.log(`📋 ${paymentData.paymentId} (${paymentData.email}): SUBSCRIPTION PAYMENT`);
        subscriptionCount++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Subscription payments: ${subscriptionCount}`);
    console.log(`   Ticket payments: ${ticketCount}`);
    console.log(`   Total ₹299 payments: ${payments299.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



