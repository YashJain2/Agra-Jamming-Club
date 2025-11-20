/**
 * Script to add two missing payment entries
 * Payment 1: pay_RhvO4pWDk1vFvZ - ₹199 - sanjana16021999@gmail.com
 * Payment 2: pay_Rhv8datm6GCWLW - ₹398 - bhawnapunjabi06@gmail.com
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const payments = [
  {
    paymentId: 'pay_RhvO4pWDk1vFvZ',
    orderId: '569032032081',
    amount: 199,
    email: 'sanjana16021999@gmail.com',
    phone: '+919897489077',
    date: new Date('2024-11-20T13:44:00'), // Thu Nov 20, 1:44pm
  },
  {
    paymentId: 'pay_Rhv8datm6GCWLW',
    orderId: '128346593245',
    amount: 398,
    email: 'bhawnapunjabi06@gmail.com',
    phone: '+919634004169',
    date: new Date('2024-11-20T13:29:00'), // Thu Nov 20, 1:29pm
  },
];

async function main() {
  try {
    console.log('🔍 Finding the event...');
    
    // Find the most recent active event (likely the one with price 199)
    const event = await prisma.event.findFirst({
      where: {
        isActive: true,
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!event) {
      console.error('❌ No active event found');
      return;
    }

    console.log(`✅ Found event: ${event.title} (Price: ₹${event.price})`);
    console.log(`\n📝 Processing ${payments.length} payments...\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const paymentData of payments) {
      try {
        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: paymentData.paymentId,
          },
        });

        if (existingPayment) {
          console.log(`⏭️  Skipped: ${paymentData.paymentId} - Payment already exists`);
          skipped++;
          continue;
        }

        // Find or create user
        let user = await prisma.user.findFirst({
          where: {
            email: paymentData.email,
          },
        });

        if (!user) {
          // Extract name from email (first part before @)
          const nameFromEmail = paymentData.email.split('@')[0].replace(/[0-9]/g, '').replace(/\./g, ' ');
          const name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          
          user = await prisma.user.create({
            data: {
              email: paymentData.email,
              name: name,
              phone: paymentData.phone,
              role: 'USER',
              password: null, // No password for guest users
            },
          });
          console.log(`   ✅ Created user: ${user.email}`);
        } else {
          console.log(`   ✅ Found user: ${user.email}`);
        }

        // Calculate quantity based on amount
        const quantity = Math.round(paymentData.amount / event.price) || 1;

        // Create ticket and payment in transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create ticket
          const ticket = await tx.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              quantity: quantity,
              totalPrice: paymentData.amount,
              status: 'CONFIRMED',
            },
          });

          // Create payment record
          const payment = await tx.payment.create({
            data: {
              userId: user.id,
              ticketId: ticket.id,
              amount: paymentData.amount,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: 'UPI',
              gateway: 'RAZORPAY',
              gatewayOrderId: paymentData.orderId,
              gatewayTxnId: paymentData.paymentId,
              gatewayResponse: {
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
                amount: paymentData.amount,
                date: paymentData.date,
              },
            },
          });

          // Update event sold tickets
          await tx.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                increment: quantity
              }
            }
          });

          return { ticket, payment };
        });

        console.log(`✅ Created: ${paymentData.paymentId} - ${paymentData.email} (${quantity} tickets, ₹${paymentData.amount})`);
        created++;
      } catch (error) {
        console.error(`❌ Error processing ${paymentData.paymentId} (${paymentData.email}):`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${payments.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

