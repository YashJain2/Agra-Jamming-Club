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

async function syncMissingPayments() {
  try {
    console.log('🔍 Starting payment sync from Razorpay...\n');

    // Get all payments from Razorpay (last 100 payments)
    const payments = await razorpay.payments.all({
      count: 100,
    });

    console.log(`📊 Found ${payments.items.length} payments in Razorpay\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const razorpayPayment of payments.items) {
      try {
        // Skip if payment is not captured
        if (razorpayPayment.status !== 'captured') {
          skipped++;
          continue;
        }

        // Check if payment already exists in database
        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: razorpayPayment.id,
          },
        });

        if (existingPayment) {
          skipped++;
          continue;
        }

        // Get order details
        const orderId = razorpayPayment.order_id;
        if (!orderId) {
          console.log(`⚠️  Payment ${razorpayPayment.id} has no order_id, skipping`);
          skipped++;
          continue;
        }

        let order;
        try {
          order = await razorpay.orders.fetch(orderId);
        } catch (error) {
          console.log(`⚠️  Could not fetch order ${orderId} for payment ${razorpayPayment.id}`);
          skipped++;
          continue;
        }

        // Extract eventId from order notes
        const orderNotes = order.notes || {};
        const eventId = orderNotes.eventId;

        if (!eventId) {
          console.log(`⚠️  Order ${orderId} has no eventId in notes, skipping payment ${razorpayPayment.id}`);
          skipped++;
          continue;
        }

        // Find event
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        if (!event) {
          console.log(`⚠️  Event ${eventId} not found for payment ${razorpayPayment.id}`);
          skipped++;
          continue;
        }

        // Get or create user
        const customerEmail = razorpayPayment.email || orderNotes.guestEmail;
        if (!customerEmail) {
          console.log(`⚠️  No email found for payment ${razorpayPayment.id}`);
          skipped++;
          continue;
        }

        let user = await prisma.user.findFirst({
          where: { email: customerEmail },
        });

        if (!user) {
          const customerName = orderNotes.guestName || razorpayPayment.notes?.name || 'Guest';
          const customerPhone = razorpayPayment.contact || orderNotes.guestPhone || '';
          
          user = await prisma.user.create({
            data: {
              email: customerEmail,
              name: customerName,
              phone: customerPhone,
              role: 'USER',
              password: null,
            },
          });
          console.log(`   ✅ Created user: ${customerEmail}`);
        }

        // Calculate quantity
        const amountInRupees = razorpayPayment.amount / 100;
        const quantity = Math.round(amountInRupees / event.price) || 1;

        // Create ticket and payment
        const result = await prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              quantity: quantity,
              totalPrice: amountInRupees,
              status: 'CONFIRMED',
            },
          });

          const payment = await tx.payment.create({
            data: {
              userId: user.id,
              ticketId: ticket.id,
              amount: amountInRupees,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: razorpayPayment.method || 'UPI',
              gateway: 'RAZORPAY',
              gatewayOrderId: orderId,
              gatewayTxnId: razorpayPayment.id,
              gatewayResponse: {
                paymentId: razorpayPayment.id,
                orderId: orderId,
                amount: amountInRupees,
              },
            },
          });

          await tx.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                increment: quantity,
              },
            },
          });

          return { ticket, payment };
        });

        console.log(`✅ Synced: ${razorpayPayment.id} - ${customerEmail} (${quantity} tickets, ₹${amountInRupees})`);
        synced++;
      } catch (error) {
        console.error(`❌ Error syncing payment ${razorpayPayment.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${payments.items.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMissingPayments();

