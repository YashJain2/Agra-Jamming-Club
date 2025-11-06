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
    console.log('🔧 Creating missing payment and ticket records...');
    console.log('Payment ID: pay_RcO3VWcVJCLhR4');
    console.log('Order ID: order_RcO3P9TLKz4lAH');
    console.log('Customer: hasanrazza@yahoo.co.in, +91 9634 110747');
    console.log('Amount: ₹199.00');
    console.log('Created: Thu Nov 6, 01:52pm\n');

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: 'hasanrazza@yahoo.co.in'
      }
    });

    if (!user) {
      console.log('👤 Creating user...');
      user = await prisma.user.create({
        data: {
          email: 'hasanrazza@yahoo.co.in',
          name: 'Hasan Razza',
          phone: '9634110747',
          role: 'USER',
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ User found:', user.id, user.name);
    }

    // Find all events to see what's available
    const allEvents = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📅 Available events:');
    allEvents.forEach((e, index) => {
      console.log(`${index + 1}. ${e.title} - ₹${e.price} (ID: ${e.id})`);
    });

    // Find the event - try finding by price (199)
    let event = await prisma.event.findFirst({
      where: {
        price: 199
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If still not found, use the most recent event
    if (!event && allEvents.length > 0) {
      event = allEvents[0];
      console.log(`\n⚠️ Using most recent event: ${event.title}`);
    }

    if (!event) {
      console.error('❌ No events found in database.');
      return;
    }

    console.log('✅ Event found:', event.title, event.id);
    console.log('Quantity: 1 ticket (₹199)');

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayTxnId: 'pay_RcO3VWcVJCLhR4' },
          { gatewayOrderId: 'order_RcO3P9TLKz4lAH' }
        ]
      },
      include: {
        ticket: true
      }
    });

    if (existingPayment) {
      console.log('\n⚠️ Payment already exists:', existingPayment.id);
      if (existingPayment.ticket) {
        console.log('✅ Ticket already exists:', existingPayment.ticket.id);
      }
      return;
    }

    // Check if ticket already exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        quantity: 1,
        totalPrice: 199
      }
    });

    if (existingTicket) {
      console.log('\n⚠️ Ticket already exists:', existingTicket.id);
      console.log('💳 Creating payment record for existing ticket...');
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          ticketId: existingTicket.id,
          amount: 199,
          currency: 'INR',
          status: 'COMPLETED',
          paymentMethod: 'UPI',
          gateway: 'RAZORPAY',
          gatewayOrderId: 'order_RcO3P9TLKz4lAH',
          gatewayTxnId: 'pay_RcO3VWcVJCLhR4',
          gatewayResponse: {
            bankRRN: '693432340732',
            payerAccountType: 'Bank Account',
            paymentMethod: 'UPI',
            upiId: '9634110747@ptyes'
          },
        },
      });
      console.log('✅ Payment record created:', payment.id);
      return;
    }

    // Create ticket
    console.log('\n🎫 Creating ticket...');
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId: event.id,
        quantity: 1,
        totalPrice: 199,
        status: 'CONFIRMED',
      },
    });
    console.log('✅ Ticket created:', ticket.id);

    // Update event sold tickets
    console.log('🔄 Updating event sold tickets...');
    await prisma.event.update({
      where: { id: event.id },
      data: {
        soldTickets: {
          increment: 1
        }
      }
    });
    console.log('✅ Event sold tickets updated');

    // Create payment record
    console.log('💳 Creating payment record...');
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        ticketId: ticket.id,
        amount: 199,
        currency: 'INR',
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_RcO3P9TLKz4lAH',
        gatewayTxnId: 'pay_RcO3VWcVJCLhR4',
        gatewayResponse: {
          bankRRN: '693432340732',
          payerAccountType: 'Bank Account',
          paymentMethod: 'UPI',
          upiId: '9634110747@ptyes'
        },
      },
    });
    console.log('✅ Payment record created:', payment.id);

    console.log('\n✅ All records created successfully!');
    console.log(`Ticket ID: ${ticket.id}`);
    console.log(`Payment ID: ${payment.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

