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
    console.log('🔍 Finding and removing duplicate tickets/payments...\n');

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

    console.log(`✅ Event: ${event.title}\n`);

    // Get all tickets for this event
    const allTickets = await prisma.ticket.findMany({
      where: {
        eventId: event.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first - keep originals, delete newer duplicates
      }
    });

    console.log(`📊 Total tickets found: ${allTickets.length}\n`);

    // Group by email
    const ticketsByEmail = new Map();
    for (const ticket of allTickets) {
      if (!ticket.user || !ticket.user.email) continue;
      const email = ticket.user.email;
      if (!ticketsByEmail.has(email)) {
        ticketsByEmail.set(email, []);
      }
      ticketsByEmail.get(email).push(ticket);
    }

    let totalDeleted = 0;
    let totalPaymentsDeleted = 0;
    let totalQuantityRefunded = 0;

    // For each email, keep the oldest ticket(s), delete newer duplicates
    for (const [email, tickets] of ticketsByEmail.entries()) {
      if (tickets.length <= 1) continue; // No duplicates

      console.log(`\n📧 ${email}: ${tickets.length} ticket(s)`);

      // Sort by creation date (oldest first)
      tickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Keep the first (oldest) ticket
      const keepTicket = tickets[0];
      const deleteTickets = tickets.slice(1);

      console.log(`   ✅ Keeping: Ticket ${keepTicket.id} (created: ${new Date(keepTicket.createdAt).toLocaleString()})`);
      console.log(`   ❌ Deleting: ${deleteTickets.length} duplicate ticket(s)`);

      for (const ticketToDelete of deleteTickets) {
        try {
          // Delete payments for this ticket
          const payments = await prisma.payment.findMany({
            where: {
              ticketId: ticketToDelete.id
            }
          });

          if (payments.length > 0) {
            const deletedPayments = await prisma.payment.deleteMany({
              where: {
                ticketId: ticketToDelete.id
              }
            });
            totalPaymentsDeleted += deletedPayments.count;
            console.log(`      - Deleted ${deletedPayments.count} payment(s) for ticket ${ticketToDelete.id}`);
          }

          // Delete ticket
          await prisma.ticket.delete({
            where: {
              id: ticketToDelete.id
            }
          });
          totalDeleted++;

          // Update event sold tickets
          await prisma.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                decrement: ticketToDelete.quantity
              }
            }
          });
          totalQuantityRefunded += ticketToDelete.quantity;

          console.log(`      ✅ Deleted ticket ${ticketToDelete.id} (quantity: ${ticketToDelete.quantity}, amount: ₹${ticketToDelete.totalPrice})`);

        } catch (error) {
          console.error(`      ❌ Error deleting ticket ${ticketToDelete.id}:`, error.message);
        }
      }
    }

    // Also check for duplicate payments (same payment ID)
    console.log(`\n\n🔍 Checking for duplicate payments (same payment ID)...\n`);
    const allPayments = await prisma.payment.findMany({
      where: {
        ticket: {
          eventId: event.id
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const paymentGroups = new Map();
    for (const payment of allPayments) {
      if (!payment.gatewayTxnId) continue;
      const key = payment.gatewayTxnId;
      if (!paymentGroups.has(key)) {
        paymentGroups.set(key, []);
      }
      paymentGroups.get(key).push(payment);
    }

    let dupPaymentsDeleted = 0;
    for (const [paymentId, payments] of paymentGroups.entries()) {
      if (payments.length > 1) {
        console.log(`Payment ID: ${paymentId} - ${payments.length} entries`);
        // Keep first (oldest), delete rest
        const keepPayment = payments[0];
        const deletePayments = payments.slice(1);

        for (const paymentToDelete of deletePayments) {
          try {
            await prisma.payment.delete({
              where: { id: paymentToDelete.id }
            });
            dupPaymentsDeleted++;
            console.log(`  ✅ Deleted duplicate payment: ${paymentToDelete.id}`);
          } catch (error) {
            console.error(`  ❌ Error deleting payment ${paymentToDelete.id}:`, error.message);
          }
        }
      }
    }

    console.log(`\n\n📊 Cleanup Summary:`);
    console.log(`   Duplicate tickets deleted: ${totalDeleted}`);
    console.log(`   Duplicate payments deleted: ${totalPaymentsDeleted + dupPaymentsDeleted}`);
    console.log(`   Ticket quantities refunded from event: ${totalQuantityRefunded}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
