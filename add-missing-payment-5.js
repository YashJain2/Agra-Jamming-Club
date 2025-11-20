/**
 * Script to add missing payment entry
 * Payment: pay_RhurVsR8rWYw2C - ₹199 - divya.garg2006@gmail.com
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const payment = {
  paymentId: 'pay_RhurVsR8rWYw2C',
  orderId: '569027922568',
  amount: 199,
  email: 'divya.garg2006@gmail.com',
  phone: '+919873730799',
  date: new Date('2024-11-20T13:13:00'), // Thu Nov 20, 1:13pm
};

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
    console.log(`\n📝 Processing payment...\n`);

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: payment.paymentId,
      },
    });

    if (existingPayment) {
      console.log(`⏭️  Payment ${payment.paymentId} already exists`);
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: payment.email,
      },
    });

    if (!user) {
      // Extract name from email
      const nameFromEmail = payment.email.split('@')[0].replace(/[0-9]/g, '').replace(/\./g, ' ');
      const name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      
      user = await prisma.user.create({
        data: {
          email: payment.email,
          name: name,
          phone: payment.phone,
          role: 'USER',
          password: null,
        },
      });
      console.log(`   ✅ Created user: ${user.email}`);
    } else {
      console.log(`   ✅ Found user: ${user.email}`);
    }

    // Calculate quantity based on amount
    const quantity = Math.round(payment.amount / event.price) || 1;

    // Create ticket and payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          eventId: event.id,
          quantity: quantity,
          totalPrice: payment.amount,
          status: 'CONFIRMED',
        },
      });

      // Create payment record
      const paymentRecord = await tx.payment.create({
        data: {
          userId: user.id,
          ticketId: ticket.id,
          amount: payment.amount,
          currency: 'INR',
          status: 'COMPLETED',
          paymentMethod: 'UPI',
          gateway: 'RAZORPAY',
          gatewayOrderId: payment.orderId,
          gatewayTxnId: payment.paymentId,
          gatewayResponse: {
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            amount: payment.amount,
            date: payment.date,
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

      return { ticket, payment: paymentRecord };
    });

    console.log(`✅ Created: ${payment.paymentId} - ${payment.email} (${quantity} tickets, ₹${payment.amount})`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

