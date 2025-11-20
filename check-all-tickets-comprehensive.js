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
    console.log('🔍 Comprehensive check for all tickets (including all statuses)...\n');

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

    // Check Rishab Jain - ALL tickets regardless of status
    console.log('1. Rishab Jain (rishab1065@gmail.com):');
    const rishabUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'rishab1065@gmail.com' },
          { email: 'Rishab1065@gmail.com' }
        ]
      }
    });

    if (rishabUser) {
      const allRishabTickets = await prisma.ticket.findMany({
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

      console.log(`   Total tickets found: ${allRishabTickets.length}`);
      allRishabTickets.forEach((ticket, idx) => {
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
        console.log('');
      });

      // Find tickets without payment
      const ticketsWithoutPayment = allRishabTickets.filter(t => t.payments.length === 0);
      if (ticketsWithoutPayment.length > 0) {
        console.log(`   ⚠️  Found ${ticketsWithoutPayment.length} ticket(s) without payment - these should be deleted`);
      }
    } else {
      console.log('   ❌ User not found');
    }

    // Check Saurav Dayal - ALL tickets regardless of status
    console.log('\n2. Saurav Dayal (saurav.dayal.39@gmail.com):');
    const sauravUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'saurav.dayal.39@gmail.com' },
          { email: 'Saurav.dayal.39@gmail.com' }
        ]
      }
    });

    if (sauravUser) {
      const allSauravTickets = await prisma.ticket.findMany({
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

      console.log(`   Total tickets found: ${allSauravTickets.length}`);
      allSauravTickets.forEach((ticket, idx) => {
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
        console.log('');
      });

      // Find tickets without payment
      const ticketsWithoutPayment = allSauravTickets.filter(t => t.payments.length === 0);
      if (ticketsWithoutPayment.length > 0) {
        console.log(`   ⚠️  Found ${ticketsWithoutPayment.length} ticket(s) without payment - these should be deleted`);
      }
    } else {
      console.log('   ❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



