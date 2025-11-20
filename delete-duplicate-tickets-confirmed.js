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
    console.log('🔧 Deleting duplicate tickets without payment records...\n');

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

    // 1. Delete Rishab Jain's ticket without payment
    console.log('1. Deleting Rishab Jain ticket without payment...');
    const rishabTicketId = 'cmhm2c50c00021s3nt0fx2859';
    const rishabTicket = await prisma.ticket.findUnique({
      where: { id: rishabTicketId },
      include: {
        payments: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (rishabTicket) {
      if (rishabTicket.payments.length > 0) {
        console.log(`   ⚠️  Ticket has ${rishabTicket.payments.length} payment(s), skipping deletion`);
      } else {
        console.log(`   Ticket: ${rishabTicket.id}`);
        console.log(`   User: ${rishabTicket.user.name} (${rishabTicket.user.email})`);
        console.log(`   Quantity: ${rishabTicket.quantity}`);
        console.log(`   Price: ₹${rishabTicket.totalPrice}`);
        
        await prisma.ticket.delete({
          where: { id: rishabTicketId }
        });

        await prisma.event.update({
          where: { id: event.id },
          data: {
            soldTickets: {
              decrement: rishabTicket.quantity
            }
          }
        });

        console.log(`   ✅ Deleted ticket (decremented soldTickets by ${rishabTicket.quantity})`);
      }
    } else {
      console.log(`   ⚠️  Ticket not found: ${rishabTicketId}`);
    }

    // 2. Delete Saurav Dayal's ticket without payment
    console.log('\n2. Deleting Saurav Dayal ticket without payment...');
    const sauravTicketId = 'cmhls7eno0002zypc0jvc8iip';
    const sauravTicket = await prisma.ticket.findUnique({
      where: { id: sauravTicketId },
      include: {
        payments: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (sauravTicket) {
      if (sauravTicket.payments.length > 0) {
        console.log(`   ⚠️  Ticket has ${sauravTicket.payments.length} payment(s), skipping deletion`);
      } else {
        console.log(`   Ticket: ${sauravTicket.id}`);
        console.log(`   User: ${sauravTicket.user.name} (${sauravTicket.user.email})`);
        console.log(`   Quantity: ${sauravTicket.quantity}`);
        console.log(`   Price: ₹${sauravTicket.totalPrice}`);
        
        await prisma.ticket.delete({
          where: { id: sauravTicketId }
        });

        await prisma.event.update({
          where: { id: event.id },
          data: {
            soldTickets: {
              decrement: sauravTicket.quantity
            }
          }
        });

        console.log(`   ✅ Deleted ticket (decremented soldTickets by ${sauravTicket.quantity})`);
      }
    } else {
      console.log(`   ⚠️  Ticket not found: ${sauravTicketId}`);
    }

    // Final verification
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id }
    });

    console.log(`\n\n✅ Summary:`);
    console.log(`   Event soldTickets: ${event.soldTickets} → ${finalEvent?.soldTickets}`);

    // Verify final state
    console.log(`\n📊 Final Verification:`);
    
    const rishabUser = await prisma.user.findFirst({
      where: { email: 'rishab1065@gmail.com' }
    });
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

    const sauravUser = await prisma.user.findFirst({
      where: { email: 'saurav.dayal.39@gmail.com' }
    });
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



