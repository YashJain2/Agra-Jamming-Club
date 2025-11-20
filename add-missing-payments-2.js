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

// Payments to add
const payments = [
  { 
    paymentId: 'pay_RdXx1z7eWkCxOG', 
    amount: 199, 
    email: 'rajatguptarg_ece18@its.edu.in', 
    phone: '9634628935', 
    name: 'Rajat Gupta',
    date: 'Sun Nov 9, 12:12pm'
  },
  { 
    paymentId: 'pay_RdWxzhNShv3m8p', 
    amount: 199, 
    email: 'princyverma102@gmail.com', 
    phone: '8650940721', 
    name: 'Princy Verma',
    date: 'Sun Nov 9, 11:15am'
  },
];

async function main() {
  try {
    console.log(`🔍 Adding ${payments.length} missing payments to database...\n`);

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

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const paymentData of payments) {
      try {
        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: paymentData.paymentId
          }
        });

        if (existingPayment) {
          console.log(`⏭️  Payment ${paymentData.paymentId} already exists, skipping...`);
          skipped++;
          continue;
        }

        // Calculate quantity from amount
        const quantity = Math.floor(paymentData.amount / event.price);
        if (quantity < 1) {
          console.log(`⚠️  Invalid quantity for payment ${paymentData.paymentId}: ${quantity}`);
          errors++;
          continue;
        }

        // Find or create user
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: paymentData.email },
              { phone: paymentData.phone }
            ]
          }
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: paymentData.email,
              phone: paymentData.phone,
              name: paymentData.name || paymentData.email.split('@')[0],
              password: crypto.randomBytes(32).toString('hex'), // Random password, user can reset
              role: 'USER'
            }
          });
          console.log(`✅ Created user: ${user.email}`);
        } else {
          // Update user info if needed
          if (!user.phone && paymentData.phone) {
            await prisma.user.update({
              where: { id: user.id },
              data: { phone: paymentData.phone }
            });
          }
          if (!user.name && paymentData.name) {
            await prisma.user.update({
              where: { id: user.id },
              data: { name: paymentData.name }
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
              totalPrice: paymentData.amount,
              status: 'CONFIRMED',
            },
          });

          // Encrypt payment data
          const encryptedGatewayResponse = encryptPaymentData({
            signature: 'manual-entry',
            orderId: `order_${paymentData.paymentId}`,
            paymentId: paymentData.paymentId
          });

          // Create payment record
          const payment = await tx.payment.create({
            data: {
              userId: user.id,
              ticketId: ticket.id,
              amount: paymentData.amount,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: 'RAZORPAY',
              gateway: 'RAZORPAY',
              gatewayOrderId: `order_${paymentData.paymentId}`,
              gatewayTxnId: paymentData.paymentId,
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

          return { ticket, payment };
        });

        console.log(`✅ Created ticket ${result.ticket.id} and payment ${result.payment.id} for ${paymentData.email}`);
        created++;
      } catch (error) {
        console.error(`❌ Error processing payment ${paymentData.paymentId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Final verification
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id }
    });
    console.log(`\n📈 Event soldTickets updated to: ${finalEvent.soldTickets}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


