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
    console.log('🔧 Activating subscription and creating free ticket for pratibhamotog@gmail.com...\n');

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: 'pratibhamotog@gmail.com' }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

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

    if (!event) {
      console.error('❌ Event not found');
      return;
    }

    console.log(`✅ Found event: ${event.title} (₹${event.price})`);

    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        price: 299,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      console.error('❌ PENDING subscription not found');
      return;
    }

    console.log(`✅ Found subscription: ${subscription.id} (Status: ${subscription.status})`);

    // Do everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Activate subscription
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Activated subscription: ${updatedSubscription.id}`);

      // 2. Create payment record for subscription
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          amount: 299,
          currency: 'INR',
          status: 'COMPLETED',
          paymentMethod: 'UPI',
          gateway: 'RAZORPAY',
          gatewayOrderId: `order_RbjhnrDftXcSCM`,
          gatewayTxnId: 'pay_RbjhnrDftXcSCM',
          gatewayResponse: {
            paymentId: 'pay_RbjhnrDftXcSCM',
            amount: 299,
            subscriptionId: subscription.id
          },
        }
      });
      console.log(`✅ Created payment record: ${payment.id} (${payment.gatewayTxnId})`);

      // 3. Create free ticket (1 ticket, ₹0 price for subscriber)
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          eventId: event.id,
          quantity: 1,
          totalPrice: 0, // Free ticket for subscriber
          status: 'CONFIRMED',
        }
      });
      console.log(`✅ Created free ticket: ${ticket.id} (1 ticket, ₹0)`);

      // 4. Update event soldTickets
      await tx.event.update({
        where: { id: event.id },
        data: {
          soldTickets: {
            increment: 1
          }
        }
      });
      console.log(`✅ Updated event soldTickets count`);

      return { subscription: updatedSubscription, payment, ticket };
    });

    console.log(`\n\n✅ Successfully completed:`);
    console.log(`   - Subscription activated: ${result.subscription.id}`);
    console.log(`   - Payment created: ${result.payment.gatewayTxnId}`);
    console.log(`   - Free ticket created: ${result.ticket.id} (1 ticket)`);
    console.log(`   - Event soldTickets updated`);

    // Verify
    console.log(`\n\n📊 Verification:`);
    const finalSubscription = await prisma.subscription.findUnique({
      where: { id: subscription.id }
    });
    const finalPayment = await prisma.payment.findFirst({
      where: { gatewayTxnId: 'pay_RbjhnrDftXcSCM' }
    });
    const finalTicket = await prisma.ticket.findUnique({
      where: { id: result.ticket.id }
    });

    console.log(`   Subscription Status: ${finalSubscription?.status}`);
    console.log(`   Payment Status: ${finalPayment?.status}`);
    console.log(`   Ticket Status: ${finalTicket?.status}, Quantity: ${finalTicket?.quantity}, Price: ₹${finalTicket?.totalPrice}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



