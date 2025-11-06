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
    console.log('Payment ID: pay_Rc8YTl8k7HwyJB');
    console.log('Order ID: order_Rc8Xj270zqKf1Q');
    console.log('Customer: ayushi.234gupta@gmail.com, +91 9650 719630');
    console.log('Amount: ₹597.00');
    console.log('Created: Wed Nov 5, 10:43pm\n');

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: 'ayushi.234gupta@gmail.com'
      }
    });

    if (!user) {
      console.log('👤 Creating user...');
      user = await prisma.user.create({
        data: {
          email: 'ayushi.234gupta@gmail.com',
          name: 'Ayushi Gupta',
          phone: '9650719630',
          role: 'USER',
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ User found:', user.id, user.name);
    }

    // Find all events to determine which one this payment is for
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📅 Available events:');
    events.forEach((event, index) => {
      const possibleQuantity = Math.round(597 / event.price);
      console.log(`${index + 1}. ${event.title} - ₹${event.price} (Possible ${possibleQuantity} tickets = ₹${possibleQuantity * event.price})`);
    });

    // Try to find event where 597 matches a ticket price
    // Common scenarios: 1 ticket at 597, 3 tickets at 199, etc.
    let event = null;
    let quantity = 1;

    // Check if 597 matches a single ticket price
    event = events.find(e => Math.abs(e.price - 597) < 1);
    if (event) {
      quantity = 1;
      console.log(`\n✅ Found matching event: ${event.title} (1 ticket)`);
    } else {
      // Check if 597 is divisible by common prices
      for (const e of events) {
        const qty = Math.round(597 / e.price);
        if (Math.abs(qty * e.price - 597) < 1) {
          event = e;
          quantity = qty;
          console.log(`\n✅ Found matching event: ${event.title} (${quantity} tickets)`);
          break;
        }
      }
    }

    // If still not found, use the most recent event (likely Raahein)
    if (!event) {
      event = events[0];
      quantity = Math.round(597 / event.price);
      console.log(`\n⚠️ Using most recent event: ${event.title} (${quantity} tickets calculated)`);
    }

    console.log(`Event: ${event.title}`);
    console.log(`Quantity: ${quantity}`);
    console.log(`Total: ₹${quantity * event.price}`);

    // Check if ticket already exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        totalPrice: 597
      }
    });

    if (existingTicket) {
      console.log('\n⚠️ Ticket already exists:', existingTicket.id);
      
      // Check if payment exists
      const existingPayment = await prisma.payment.findFirst({
        where: {
          gatewayTxnId: 'pay_Rc8YTl8k7HwyJB',
          gatewayOrderId: 'order_Rc8Xj270zqKf1Q'
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
            amount: 597,
            currency: 'INR',
            status: 'COMPLETED',
            paymentMethod: 'UPI',
            gateway: 'RAZORPAY',
            gatewayOrderId: 'order_Rc8Xj270zqKf1Q',
            gatewayTxnId: 'pay_Rc8YTl8k7HwyJB',
            gatewayResponse: {
              bankRRN: '530972020117',
              payerAccountType: 'Bank Account',
              paymentMethod: 'UPI',
              upiId: 'ayushi.234gupta@okicici'
            },
          },
        });
        console.log('✅ Payment record created:', payment.id);
        return;
      }
    }

    // Create ticket
    console.log('\n🎫 Creating ticket...');
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId: event.id,
        quantity: quantity,
        totalPrice: 597,
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
          increment: quantity
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
        amount: 597,
        currency: 'INR',
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_Rc8Xj270zqKf1Q',
        gatewayTxnId: 'pay_Rc8YTl8k7HwyJB',
        gatewayResponse: {
          bankRRN: '530972020117',
          payerAccountType: 'Bank Account',
          paymentMethod: 'UPI',
          upiId: 'ayushi.234gupta@okicici'
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

