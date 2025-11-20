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
    console.log('🔧 Deleting duplicate tickets...\n');

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

    console.log(`✅ Event: ${event.title}`);
    console.log(`   Current soldTickets: ${event.soldTickets}\n`);

    // 1. Fix Saurav Dayal
    console.log('1. Fixing Saurav Dayal (saurav.dayal.39@gmail.com)...');
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
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Found ${sauravTickets.length} ticket(s)`);
      
      // Find ticket without payment
      const ticketWithoutPayment = sauravTickets.find(t => t.payments.length === 0);
      const ticketWithPayment = sauravTickets.find(t => t.payments.length > 0);

      if (ticketWithoutPayment && ticketWithPayment) {
        console.log(`   Ticket to delete: ${ticketWithoutPayment.id} (${ticketWithoutPayment.quantity} tickets, no payment)`);
        console.log(`   Ticket to keep: ${ticketWithPayment.id} (${ticketWithPayment.quantity} tickets, payment: ${ticketWithPayment.payments[0].gatewayTxnId})`);

        await prisma.ticket.delete({
          where: { id: ticketWithoutPayment.id }
        });

        await prisma.event.update({
          where: { id: event.id },
          data: {
            soldTickets: {
              decrement: ticketWithoutPayment.quantity
            }
          }
        });

        console.log(`   ✅ Deleted duplicate ticket (decremented soldTickets by ${ticketWithoutPayment.quantity})`);
      } else {
        console.log(`   ⚠️  Could not find duplicate ticket`);
      }
    }

    // 2. Fix Rishab Jain
    console.log('\n2. Fixing Rishab Jain (rishab1065@gmail.com)...');
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
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Found ${rishabTickets.length} ticket(s)`);
      
      // Find ticket without payment
      const ticketWithoutPayment = rishabTickets.find(t => t.payments.length === 0);
      const ticketWithPayment = rishabTickets.find(t => t.payments.length > 0);

      if (ticketWithoutPayment && ticketWithPayment) {
        console.log(`   Ticket to delete: ${ticketWithoutPayment.id} (${ticketWithoutPayment.quantity} tickets, no payment)`);
        console.log(`   Ticket to keep: ${ticketWithPayment.id} (${ticketWithPayment.quantity} tickets, payment: ${ticketWithPayment.payments[0].gatewayTxnId})`);

        await prisma.ticket.delete({
          where: { id: ticketWithoutPayment.id }
        });

        await prisma.event.update({
          where: { id: event.id },
          data: {
            soldTickets: {
              decrement: ticketWithoutPayment.quantity
            }
          }
        });

        console.log(`   ✅ Deleted duplicate ticket (decremented soldTickets by ${ticketWithoutPayment.quantity})`);
      } else {
        console.log(`   ⚠️  Could not find duplicate ticket`);
      }
    }

    // Final verification
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id }
    });

    console.log(`\n\n✅ Summary:`);
    console.log(`   Event soldTickets: ${event.soldTickets} → ${finalEvent?.soldTickets}`);

    // Verify final state
    console.log(`\n📊 Final Verification:`);
    
    if (sauravUser) {
      const finalSauravTickets = await prisma.ticket.findMany({
        where: {
          userId: sauravUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        }
      });
      console.log(`   Saurav Dayal: ${finalSauravTickets.length} ticket(s), ${finalSauravTickets.reduce((sum, t) => sum + t.quantity, 0)} total tickets`);
    }

    if (rishabUser) {
      const finalRishabTickets = await prisma.ticket.findMany({
        where: {
          userId: rishabUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        }
      });
      console.log(`   Rishab Jain: ${finalRishabTickets.length} ticket(s), ${finalRishabTickets.reduce((sum, t) => sum + t.quantity, 0)} total tickets`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



