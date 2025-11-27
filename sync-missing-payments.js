/**
 * Script to sync missing payments from Razorpay
 * This should be run periodically to catch any payments that were missed
 * 
 * Usage: node sync-missing-payments.js
 * 
 * Note: Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function findMissingPayments() {
  try {
    console.log('🔍 Scanning for missing payments from Razorpay...\n');

    // Get all payments from Razorpay (last 100 payments)
    const payments = await razorpay.payments.all({
      count: 100,
    });

    console.log(`📊 Found ${payments.items.length} payments in Razorpay\n`);

    const missingPayments = [];

    for (const razorpayPayment of payments.items) {
      try {
        // Skip if payment is not captured
        if (razorpayPayment.status !== 'captured') {
          continue;
        }

        // Check if payment already exists in database
        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: razorpayPayment.id,
          },
        });

        if (existingPayment) {
          continue;
        }

        // Get order details
        const orderId = razorpayPayment.order_id;
        if (!orderId) {
          continue;
        }

        let order;
        try {
          order = await razorpay.orders.fetch(orderId);
        } catch (error) {
          continue;
        }

        // Extract eventId from order notes
        const orderNotes = order.notes || {};
        const eventId = orderNotes.eventId;

        if (!eventId) {
          continue;
        }

        // Find event
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        if (!event) {
          continue;
        }

        // Get customer details
        const customerEmail = razorpayPayment.email || orderNotes.guestEmail;
        if (!customerEmail) {
          continue;
        }

        const customerName = orderNotes.guestName || razorpayPayment.notes?.name || 'Guest';
        const customerPhone = razorpayPayment.contact || orderNotes.guestPhone || '';
        const amountInRupees = razorpayPayment.amount / 100;
        const quantity = Math.round(amountInRupees / event.price) || 1;

        missingPayments.push({
          paymentId: razorpayPayment.id,
          orderId: orderId,
          eventId: eventId,
          eventTitle: event.title,
          customerEmail: customerEmail,
          customerName: customerName,
          customerPhone: customerPhone,
          amount: amountInRupees,
          quantity: quantity,
          method: razorpayPayment.method || 'UPI',
          createdAt: razorpayPayment.created_at,
        });
      } catch (error) {
        // Skip errors during scanning
      }
    }

    return missingPayments;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return [];
  }
}

async function syncMissingPayments(missingPayments) {
  try {
    console.log(`\n🔄 Syncing ${missingPayments.length} missing payments...\n`);

    let synced = 0;
    let errors = 0;

    for (const paymentData of missingPayments) {
      try {
        // Get or create user
        let user = await prisma.user.findFirst({
          where: { email: paymentData.customerEmail },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: paymentData.customerEmail,
              name: paymentData.customerName,
              phone: paymentData.customerPhone,
              role: 'USER',
              password: null,
            },
          });
          console.log(`   ✅ Created user: ${paymentData.customerEmail}`);
        }

        // Find event
        const event = await prisma.event.findUnique({
          where: { id: paymentData.eventId },
        });

        if (!event) {
          console.log(`⚠️  Event ${paymentData.eventId} not found for payment ${paymentData.paymentId}`);
          errors++;
          continue;
        }

        // Create ticket and payment
        await prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              quantity: paymentData.quantity,
              totalPrice: paymentData.amount,
              status: 'CONFIRMED',
            },
          });

          await tx.payment.create({
            data: {
              userId: user.id,
              ticketId: ticket.id,
              amount: paymentData.amount,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: paymentData.method,
              gateway: 'RAZORPAY',
              gatewayOrderId: paymentData.orderId,
              gatewayTxnId: paymentData.paymentId,
              gatewayResponse: {
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
                amount: paymentData.amount,
              },
            },
          });

          await tx.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                increment: paymentData.quantity,
              },
            },
          });
        });

        console.log(`✅ Synced: ${paymentData.paymentId} - ${paymentData.customerEmail} (${paymentData.quantity} tickets, ₹${paymentData.amount})`);
        synced++;
      } catch (error) {
        console.error(`❌ Error syncing payment ${paymentData.paymentId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${missingPayments.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const missingPayments = await findMissingPayments();

  if (missingPayments.length === 0) {
    console.log('✅ No missing payments found! All payments are synced.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📋 Found ${missingPayments.length} missing payment(s):\n`);
  console.log('─'.repeat(100));
  
  missingPayments.forEach((payment, index) => {
    console.log(`\n${index + 1}. Payment ID: ${payment.paymentId}`);
    console.log(`   Order ID: ${payment.orderId}`);
    console.log(`   Event: ${payment.eventTitle}`);
    console.log(`   Customer: ${payment.customerName} (${payment.customerEmail})`);
    console.log(`   Phone: ${payment.customerPhone || 'N/A'}`);
    console.log(`   Amount: ₹${payment.amount}`);
    console.log(`   Quantity: ${payment.quantity} ticket(s)`);
    console.log(`   Method: ${payment.method}`);
    console.log(`   Date: ${new Date(payment.createdAt * 1000).toLocaleString()}`);
  });

  console.log('\n' + '─'.repeat(100));
  console.log(`\n📊 Total: ${missingPayments.length} missing payment(s)\n`);

  // Use readline for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Do you want to add these payments to the database? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await syncMissingPayments(missingPayments);
    } else {
      console.log('\n❌ Sync cancelled by user.\n');
    }
    rl.close();
    await prisma.$disconnect();
  });
}

main();

