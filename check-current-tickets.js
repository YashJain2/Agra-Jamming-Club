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
    console.log('🔍 Checking current state of Saurav Dayal and Rishab Jain tickets...\n');

    // Find the event
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
      console.error('❌ Event not found');
      return;
    }

    // Check Saurav Dayal
    console.log('1. Saurav Dayal (saurav.dayal.39@gmail.com):');
    const sauravUser = await prisma.user.findFirst({
      where: { email: 'saurav.dayal.39@gmail.com' }
    });

    if (sauravUser) {
      const sauravTickets = await prisma.ticket.findMany({
        where: {
          userId: sauravUser.id,
          eventId: event.id
        },
        include: {
          payments: {
            select: {
              id: true,
              gatewayTxnId: true,
              amount: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Total tickets: ${sauravTickets.length}`);
      sauravTickets.forEach((ticket, idx) => {
        console.log(`   Ticket ${idx + 1}:`);
        console.log(`      ID: ${ticket.id}`);
        console.log(`      Quantity: ${ticket.quantity}`);
        console.log(`      Price: ₹${ticket.totalPrice}`);
        console.log(`      Status: ${ticket.status}`);
        console.log(`      Created: ${new Date(ticket.createdAt).toLocaleString()}`);
        console.log(`      Payments: ${ticket.payments.length}`);
        ticket.payments.forEach((p, pIdx) => {
          console.log(`         Payment ${pIdx + 1}: ${p.gatewayTxnId || 'N/A'} (₹${p.amount}, ${p.status})`);
        });
      });
    } else {
      console.log('   ❌ User not found');
    }

    // Check Rishab Jain
    console.log('\n2. Rishab Jain (rishab1065@gmail.com):');
    const rishabUser = await prisma.user.findFirst({
      where: { email: 'rishab1065@gmail.com' }
    });

    if (rishabUser) {
      const rishabTickets = await prisma.ticket.findMany({
        where: {
          userId: rishabUser.id,
          eventId: event.id
        },
        include: {
          payments: {
            select: {
              id: true,
              gatewayTxnId: true,
              amount: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Total tickets: ${rishabTickets.length}`);
      rishabTickets.forEach((ticket, idx) => {
        console.log(`   Ticket ${idx + 1}:`);
        console.log(`      ID: ${ticket.id}`);
        console.log(`      Quantity: ${ticket.quantity}`);
        console.log(`      Price: ₹${ticket.totalPrice}`);
        console.log(`      Status: ${ticket.status}`);
        console.log(`      Created: ${new Date(ticket.createdAt).toLocaleString()}`);
        console.log(`      Payments: ${ticket.payments.length}`);
        ticket.payments.forEach((p, pIdx) => {
          console.log(`         Payment ${pIdx + 1}: ${p.gatewayTxnId || 'N/A'} (₹${p.amount}, ${p.status})`);
        });
      });
    } else {
      console.log('   ❌ User not found');
    }

    console.log(`\n\n📊 Event soldTickets: ${event.soldTickets}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



