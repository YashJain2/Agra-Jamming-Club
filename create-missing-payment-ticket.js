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
    console.log('Payment ID: pay_RcMgFJ7GlpwDOx');
    console.log('Order ID: order_RcMgAmQhZIq1OT');
    console.log('Customer: priyyasija0@gmail.com, +91 7409 331250');
    console.log('Amount: ₹1,592.00');
    console.log('Quantity: 8 tickets\n');

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: 'priyyasija0@gmail.com'
      }
    });

    if (!user) {
      console.log('👤 Creating user...');
      user = await prisma.user.create({
        data: {
          email: 'priyyasija0@gmail.com',
          name: 'Priyya Sija',
          phone: '7409331250',
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

    // Find the event - try Raahein first, then any event with price 199
    let event = await prisma.event.findFirst({
      where: {
        OR: [
          { title: { contains: 'Raahein', mode: 'insensitive' } },
          { title: { contains: 'Raahein', mode: 'insensitive' } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If not found, try finding by price (1592 / 8 = 199)
    if (!event) {
      event = await prisma.event.findFirst({
        where: {
          price: 199
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

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

    // Check if ticket already exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        quantity: 8,
        totalPrice: 1592
      }
    });

    if (existingTicket) {
      console.log('⚠️ Ticket already exists:', existingTicket.id);
      
      // Check if payment exists
      const existingPayment = await prisma.payment.findFirst({
        where: {
          gatewayTxnId: 'pay_RcMgFJ7GlpwDOx',
          gatewayOrderId: 'order_RcMgAmQhZIq1OT'
        }
      });

      if (existingPayment) {
        console.log('⚠️ Payment already exists:', existingPayment.id);
        return;
      } else {
        // Create payment record for existing ticket
        console.log('💳 Creating payment record for existing ticket...');
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            ticketId: existingTicket.id,
            amount: 1592,
            currency: 'INR',
            status: 'COMPLETED',
            paymentMethod: 'UPI',
            gateway: 'RAZORPAY',
            gatewayOrderId: 'order_RcMgAmQhZIq1OT',
            gatewayTxnId: 'pay_RcMgFJ7GlpwDOx',
            gatewayResponse: {
              bankRRN: '531031573428',
              payerAccountType: 'Bank Account',
              paymentMethod: 'UPI',
              upiId: '7409331250@ptaxis'
            },
          },
        });
        console.log('✅ Payment record created:', payment.id);
        return;
      }
    }

    // Create ticket
    console.log('🎫 Creating ticket...');
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId: event.id,
        quantity: 8,
        totalPrice: 1592,
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
          increment: 8
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
        amount: 1592,
        currency: 'INR',
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_RcMgAmQhZIq1OT',
        gatewayTxnId: 'pay_RcMgFJ7GlpwDOx',
        gatewayResponse: {
          bankRRN: '531031573428',
          payerAccountType: 'Bank Account',
          paymentMethod: 'UPI',
          upiId: '7409331250@ptaxis'
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

