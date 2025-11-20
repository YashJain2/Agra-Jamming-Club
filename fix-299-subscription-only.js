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
    console.log('🔧 Fixing ₹299 payment that was incorrectly linked to ticket...\n');

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

    // Find the payment that's incorrectly linked to a ticket
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayTxnId: 'pay_RbjhnrDftXcSCM',
        amount: 299
      },
      include: {
        ticket: true,
        user: true
      }
    });

    if (!payment) {
      console.log('✅ Payment not found or not linked to ticket');
      return;
    }

    console.log(`Found payment: ${payment.gatewayTxnId}`);
    console.log(`User: ${payment.user.email}`);
    console.log(`Ticket ID: ${payment.ticket?.id || 'None'}`);
    console.log(`Ticket Quantity: ${payment.ticket?.quantity || 'N/A'}`);

    if (payment.ticket) {
      const ticketId = payment.ticket.id;
      const ticketQuantity = payment.ticket.quantity;

      // Delete the payment record
      await prisma.payment.delete({
        where: {
          id: payment.id
        }
      });
      console.log(`✅ Deleted payment record`);

      // Delete the ticket
      await prisma.ticket.delete({
        where: {
          id: ticketId
        }
      });
      console.log(`✅ Deleted ticket record`);

      // Update event soldTickets
      await prisma.event.update({
        where: { id: event.id },
        data: {
          soldTickets: {
            decrement: ticketQuantity
          }
        }
      });
      console.log(`✅ Updated event soldTickets (decremented by ${ticketQuantity})`);

      console.log(`\n✅ Fixed! ₹299 payment is now treated as subscription payment only`);
    } else {
      console.log(`✅ Payment is not linked to a ticket, no action needed`);
    }

    // Final verification
    console.log(`\n📊 Final Status:`);
    const all299Payments = await prisma.payment.findMany({
      where: {
        amount: 299
      },
      include: {
        ticket: true
      }
    });

    const ticketPayments299 = all299Payments.filter(p => p.ticket !== null);
    const subscriptionPayments299 = all299Payments.filter(p => p.ticket === null);

    console.log(`   Total ₹299 payments: ${all299Payments.length}`);
    console.log(`   Linked to tickets: ${ticketPayments299.length} (should be 0)`);
    console.log(`   Subscription only: ${subscriptionPayments299.length} (should be 8)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



