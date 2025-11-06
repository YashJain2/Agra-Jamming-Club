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
    console.log('🔍 Checking payment and tickets for order: order_RcMgAmQhZIq1OT');
    console.log('🔍 Payment ID: pay_RcMgFJ7GlpwDOx');
    console.log('🔍 Customer: priyyasija0@gmail.com\n');

    // Check Payment records
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { gatewayTxnId: 'pay_RcMgFJ7GlpwDOx' },
          { gatewayOrderId: 'order_RcMgAmQhZIq1OT' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                date: true
              }
            }
          }
        }
      }
    });

    console.log(`\n📊 Found ${payments.length} payment record(s):`);
    payments.forEach((payment, index) => {
      console.log(`\n--- Payment ${index + 1} ---`);
      console.log(`ID: ${payment.id}`);
      console.log(`Amount: ₹${payment.amount}`);
      console.log(`Status: ${payment.status}`);
      console.log(`Gateway Order ID: ${payment.gatewayOrderId}`);
      console.log(`Gateway Txn ID: ${payment.gatewayTxnId}`);
      console.log(`User: ${payment.user?.name} (${payment.user?.email})`);
      console.log(`Ticket ID: ${payment.ticketId || 'N/A'}`);
      if (payment.ticket) {
        console.log(`Event: ${payment.ticket.event.title}`);
        console.log(`Quantity: ${payment.ticket.quantity}`);
      }
      console.log(`Created: ${payment.createdAt}`);
    });

    // Check Tickets for this user
    const user = await prisma.user.findFirst({
      where: {
        email: 'priyyasija0@gmail.com'
      }
    });

    if (user) {
      console.log(`\n\n🎫 Checking tickets for user: ${user.name} (${user.email})`);
      const tickets = await prisma.ticket.findMany({
        where: {
          userId: user.id
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              price: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`\n📊 Found ${tickets.length} ticket(s) for this user:`);
      tickets.forEach((ticket, index) => {
        console.log(`\n--- Ticket ${index + 1} ---`);
        console.log(`ID: ${ticket.id}`);
        console.log(`Event: ${ticket.event.title}`);
        console.log(`Quantity: ${ticket.quantity}`);
        console.log(`Total Price: ₹${ticket.totalPrice}`);
        console.log(`Status: ${ticket.status}`);
        console.log(`Created: ${ticket.createdAt}`);
      });

      // Check for tickets with quantity 8
      const tickets8 = tickets.filter(t => t.quantity === 8);
      console.log(`\n\n🎫 Tickets with quantity 8: ${tickets8.length}`);
      if (tickets8.length > 0) {
        tickets8.forEach((ticket, index) => {
          console.log(`\n--- Ticket ${index + 1} (8 tickets) ---`);
          console.log(`ID: ${ticket.id}`);
          console.log(`Event: ${ticket.event.title}`);
          console.log(`Total Price: ₹${ticket.totalPrice}`);
          console.log(`Status: ${ticket.status}`);
          console.log(`Created: ${ticket.createdAt}`);
        });
      }
    } else {
      console.log('\n❌ User not found with email: priyyasija0@gmail.com');
    }

    // Check all tickets with totalPrice around 1592
    console.log('\n\n🔍 Checking all tickets with totalPrice around ₹1592:');
    const tickets1592 = await prisma.ticket.findMany({
      where: {
        totalPrice: {
          gte: 1590,
          lte: 1595
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Found ${tickets1592.length} ticket(s) with price around ₹1592:`);
    tickets1592.forEach((ticket, index) => {
      console.log(`\n--- Ticket ${index + 1} ---`);
      console.log(`ID: ${ticket.id}`);
      console.log(`User: ${ticket.user.name} (${ticket.user.email})`);
      console.log(`Event: ${ticket.event.title}`);
      console.log(`Quantity: ${ticket.quantity}`);
      console.log(`Total Price: ₹${ticket.totalPrice}`);
      console.log(`Status: ${ticket.status}`);
      console.log(`Created: ${ticket.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

