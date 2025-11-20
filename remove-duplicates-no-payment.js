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
    console.log('🔧 Removing duplicate tickets without payment records...\n');

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

    // 1. Fix Rishab Jain
    console.log('1. Fixing Rishab Jain (rishab1065@gmail.com)...');
    const rishabUser = await prisma.user.findFirst({
      where: { email: 'rishab1065@gmail.com' }
    });

    if (!rishabUser) {
      console.log('   ❌ User not found');
    } else {
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
      
      // Find tickets without payment
      const ticketsWithoutPayment = rishabTickets.filter(t => t.payments.length === 0);
      const ticketsWithPayment = rishabTickets.filter(t => t.payments.length > 0);

      if (ticketsWithoutPayment.length > 0) {
        console.log(`   Found ${ticketsWithoutPayment.length} ticket(s) without payment`);
        
        for (const ticket of ticketsWithoutPayment) {
          console.log(`   Deleting ticket ${ticket.id} (${ticket.quantity} tickets, no payment)`);
          
          await prisma.ticket.delete({
            where: { id: ticket.id }
          });

          await prisma.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                decrement: ticket.quantity
              }
            }
          });

          console.log(`   ✅ Deleted (decremented soldTickets by ${ticket.quantity})`);
        }
      } else {
        console.log(`   ✅ No tickets without payment found`);
      }

      if (ticketsWithPayment.length > 0) {
        console.log(`   ✅ Keeping ${ticketsWithPayment.length} ticket(s) with payment:`);
        ticketsWithPayment.forEach(t => {
          console.log(`      - Ticket ${t.id}: ${t.quantity} tickets, Payment: ${t.payments[0].gatewayTxnId}`);
        });
      }
    }

    // 2. Fix Saurav Dayal
    console.log('\n2. Fixing Saurav Dayal (saurav.dayal.39@gmail.com)...');
    const sauravUser = await prisma.user.findFirst({
      where: { email: 'saurav.dayal.39@gmail.com' }
    });

    if (!sauravUser) {
      console.log('   ❌ User not found');
    } else {
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
      
      // Find tickets without payment
      const ticketsWithoutPayment = sauravTickets.filter(t => t.payments.length === 0);
      const ticketsWithPayment = sauravTickets.filter(t => t.payments.length > 0);

      if (ticketsWithoutPayment.length > 0) {
        console.log(`   Found ${ticketsWithoutPayment.length} ticket(s) without payment`);
        
        for (const ticket of ticketsWithoutPayment) {
          console.log(`   Deleting ticket ${ticket.id} (${ticket.quantity} tickets, no payment)`);
          
          await prisma.ticket.delete({
            where: { id: ticket.id }
          });

          await prisma.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                decrement: ticket.quantity
              }
            }
          });

          console.log(`   ✅ Deleted (decremented soldTickets by ${ticket.quantity})`);
        }
      } else {
        console.log(`   ✅ No tickets without payment found`);
      }

      if (ticketsWithPayment.length > 0) {
        console.log(`   ✅ Keeping ${ticketsWithPayment.length} ticket(s) with payment:`);
        ticketsWithPayment.forEach(t => {
          console.log(`      - Ticket ${t.id}: ${t.quantity} tickets, Payment: ${t.payments[0].gatewayTxnId}`);
        });
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
      finalRishabTickets.forEach(t => {
        console.log(`      - ${t.quantity} tickets, ₹${t.totalPrice}, Payments: ${t.payments.length}`);
      });
    }

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
      finalSauravTickets.forEach(t => {
        console.log(`      - ${t.quantity} tickets, ₹${t.totalPrice}, Payments: ${t.payments.length}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



