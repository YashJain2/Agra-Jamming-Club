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
    console.log('🔧 Fixing Prasukh Jain ticket quantity from 10 to 1...\n');

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: 'prasukh123@gmail.com' }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

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

    console.log(`✅ Found event: ${event.title} (₹${event.price})`);
    console.log(`   Current soldTickets: ${event.soldTickets}`);

    // Find ticket with quantity 10
    const ticket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        quantity: 10
      },
      include: {
        payments: true
      }
    });

    if (!ticket) {
      console.log('⚠️  No ticket with quantity 10 found');
      
      // Check all tickets for this user
      const allTickets = await prisma.ticket.findMany({
        where: {
          userId: user.id,
          eventId: event.id
        },
        include: {
          payments: true
        }
      });
      
      console.log(`\nFound ${allTickets.length} ticket(s) for this user:`);
      allTickets.forEach((t, idx) => {
        console.log(`   ${idx + 1}. Ticket ID: ${t.id}, Quantity: ${t.quantity}, Price: ₹${t.totalPrice}`);
        console.log(`      Payments: ${t.payments.map(p => p.gatewayTxnId).join(', ') || 'None'}`);
      });
      return;
    }

    console.log(`✅ Found ticket: ${ticket.id}`);
    console.log(`   Current quantity: ${ticket.quantity}`);
    console.log(`   Current price: ₹${ticket.totalPrice}`);
    console.log(`   Payments: ${ticket.payments.map(p => p.gatewayTxnId).join(', ') || 'None'}`);

    // Calculate difference
    const quantityDiff = ticket.quantity - 1; // Should be 9

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update ticket quantity to 1
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          quantity: 1,
          totalPrice: 0 // Free ticket for subscriber
        }
      });
      console.log(`✅ Updated ticket quantity to 1`);

      // Update event soldTickets (decrement by 9)
      const updatedEvent = await tx.event.update({
        where: { id: event.id },
        data: {
          soldTickets: {
            decrement: quantityDiff
          }
        }
      });
      console.log(`✅ Updated event soldTickets: ${event.soldTickets} → ${updatedEvent.soldTickets} (decremented by ${quantityDiff})`);

      return { ticket: updatedTicket, event: updatedEvent };
    });

    console.log(`\n\n✅ Successfully updated:`);
    console.log(`   - Ticket quantity: 10 → 1`);
    console.log(`   - Ticket price: ₹${ticket.totalPrice} → ₹0`);
    console.log(`   - Event soldTickets: ${event.soldTickets} → ${result.event.soldTickets}`);

    // Verify
    console.log(`\n\n📊 Verification:`);
    const finalTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id }
    });
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id }
    });

    console.log(`   Ticket Quantity: ${finalTicket?.quantity}`);
    console.log(`   Ticket Price: ₹${finalTicket?.totalPrice}`);
    console.log(`   Event soldTickets: ${finalEvent?.soldTickets}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



