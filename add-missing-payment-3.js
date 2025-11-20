const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// Simple encryption function (matching the encryption.ts pattern)
function encryptPaymentData(data) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const text = JSON.stringify(data);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Payment to add
const payment = {
  paymentId: 'pay_RdZsz2E7CMtHiN',
  amount: 199,
  email: 'divya.garg2006@gmail.com',
  phone: '9873730799',
  name: 'Divya Garg',
  date: 'Sun Nov 9, 2:06pm'
};

async function main() {
  try {
    console.log(`🔍 Adding missing payment to database...\n`);

    // Find the event (assuming it's the Sip and Jam event)
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
      console.error('❌ Event not found. Please check the event exists.');
      return;
    }

    console.log(`✅ Event found: ${event.title} (₹${event.price})\n`);

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: payment.paymentId
      }
    });

    if (existingPayment) {
      console.log(`⏭️  Payment ${payment.paymentId} already exists, skipping...`);
      await prisma.$disconnect();
      return;
    }

    // Calculate quantity from amount
    const quantity = Math.floor(payment.amount / event.price);
    if (quantity < 1) {
      console.log(`⚠️  Invalid quantity for payment ${payment.paymentId}: ${quantity}`);
      await prisma.$disconnect();
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payment.email },
          { phone: payment.phone }
        ]
      }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: payment.email,
          phone: payment.phone,
          name: payment.name || payment.email.split('@')[0],
          password: crypto.randomBytes(32).toString('hex'), // Random password, user can reset
          role: 'USER'
        }
      });
      console.log(`✅ Created user: ${user.email}`);
    } else {
      // Update user info if needed
      if (!user.phone && payment.phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: payment.phone }
        });
      }
      if (!user.name && payment.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: payment.name }
        });
      }
    }

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

      // Encrypt payment data
      const encryptedGatewayResponse = encryptPaymentData({
        signature: 'manual-entry',
        orderId: `order_${payment.paymentId}`,
        paymentId: payment.paymentId
      });

      // Create payment record
      const paymentRecord = await tx.payment.create({
        data: {
          userId: user.id,
          ticketId: ticket.id,
          amount: payment.amount,
          currency: 'INR',
          status: 'COMPLETED',
          paymentMethod: 'RAZORPAY',
          gateway: 'RAZORPAY',
          gatewayOrderId: `order_${payment.paymentId}`,
          gatewayTxnId: payment.paymentId,
          gatewayResponse: encryptedGatewayResponse,
        },
      });

      // Update event sold tickets count
      await tx.event.update({
        where: { id: event.id },
        data: {
          soldTickets: {
            increment: quantity
          }
        },
      });

      return { ticket, payment: paymentRecord };
    });

    console.log(`✅ Created ticket ${result.ticket.id} and payment ${result.payment.id} for ${payment.email}`);
    console.log(`\n📈 Event soldTickets updated to: ${event.soldTickets + quantity}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


