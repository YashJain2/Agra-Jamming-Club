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
    console.log('🔍 Final verification and cleanup...\n');

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

    // Check suyash - should have exactly 3 tickets (one per payment)
    console.log('1. Verifying suyash.verma017@gmail.com...');
    const suyashUser = await prisma.user.findFirst({
      where: { email: 'suyash.verma017@gmail.com' }
    });

    if (suyashUser) {
      const suyashTickets = await prisma.ticket.findMany({
        where: {
          userId: suyashUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Found ${suyashTickets.length} ticket(s)`);
      
      // Expected: 3 tickets with payments
      // If there's a ticket without payment, we need to handle it
      const ticketsWithoutPayment = suyashTickets.filter(t => t.payments.length === 0);
      const ticketsWithPayment = suyashTickets.filter(t => t.payments.length > 0);

      if (ticketsWithoutPayment.length > 0) {
        console.log(`   ⚠️  Found ${ticketsWithoutPayment.length} ticket(s) without payment`);
        
        // Check if this is the original ticket that should be linked to pay_RcMEaGH3oH7oTb
        // If we already created tickets with all payments, delete the orphaned ticket
        if (ticketsWithPayment.length >= 3) {
          console.log(`   ✅ All 3 payments are linked, deleting orphaned ticket(s)`);
          for (const ticket of ticketsWithoutPayment) {
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
            console.log(`      ✅ Deleted orphaned ticket ${ticket.id}`);
          }
        }
      }

      // Final check
      const finalTickets = await prisma.ticket.findMany({
        where: {
          userId: suyashUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        }
      });
      console.log(`   Final: ${finalTickets.length} ticket(s) with payments`);
    }

    // Check Saurav - should have exactly 1 ticket with payment pay_Rc0OK9I4gRB5xF
    console.log('\n2. Verifying saurav.dayal.39@gmail.com...');
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
      
      if (sauravTickets.length > 1) {
        // Find ticket with payment pay_Rc0OK9I4gRB5xF
        const correctTicket = sauravTickets.find(t => 
          t.payments.some(p => p.gatewayTxnId === 'pay_Rc0OK9I4gRB5xF')
        );

        if (correctTicket) {
          const ticketsToDelete = sauravTickets.filter(t => t.id !== correctTicket.id);
          console.log(`   ✅ Found ticket with payment, deleting ${ticketsToDelete.length} duplicate(s)`);
          
          for (const ticket of ticketsToDelete) {
            if (ticket.payments.length > 0) {
              await prisma.payment.deleteMany({
                where: { ticketId: ticket.id }
              });
            }
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
            console.log(`      ✅ Deleted duplicate ticket ${ticket.id}`);
          }
        }
      }
    }

    // Check Rishab - should have exactly 1 ticket with payment pay_Rc5DxaydVtwsUt
    console.log('\n3. Verifying rishab1065@gmail.com...');
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
      
      if (rishabTickets.length > 1) {
        // Find ticket with payment pay_Rc5DxaydVtwsUt
        const correctTicket = rishabTickets.find(t => 
          t.payments.some(p => p.gatewayTxnId === 'pay_Rc5DxaydVtwsUt')
        );

        if (correctTicket) {
          const ticketsToDelete = rishabTickets.filter(t => t.id !== correctTicket.id);
          console.log(`   ✅ Found ticket with payment, deleting ${ticketsToDelete.length} duplicate(s)`);
          
          for (const ticket of ticketsToDelete) {
            if (ticket.payments.length > 0) {
              await prisma.payment.deleteMany({
                where: { ticketId: ticket.id }
              });
            }
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
            console.log(`      ✅ Deleted duplicate ticket ${ticket.id}`);
          }
        }
      }
    }

    console.log('\n✅ Verification completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



