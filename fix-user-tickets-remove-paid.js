const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from env file
const envPath = path.join(__dirname, 'env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    process.env.DATABASE_URL = match[1].trim();
  }
}

const prisma = new PrismaClient();

async function fixUserTickets() {
  try {
    const email = 'rover.rapper@gmail.com';
    
    console.log('🔍 Finding user:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.name);

    // Find the ticket with quantity 2
    const ticket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        quantity: 2,
        totalPrice: {
          in: [0, 199] // Either free or the corrected price
        }
      },
      include: {
        event: true
      }
    });

    if (!ticket) {
      console.log('❌ Ticket not found');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n🎫 Found ticket:`);
    console.log(`   Ticket ID: ${ticket.id}`);
    console.log(`   Event: ${ticket.event.title}`);
    console.log(`   Current Quantity: ${ticket.quantity}`);
    console.log(`   Current Price: ₹${ticket.totalPrice}`);

    // Update to 1 free ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        quantity: 1,
        totalPrice: 0
      }
    });

    console.log(`\n   ✅ Updated to:`);
    console.log(`   Quantity: 1`);
    console.log(`   Price: ₹0 (FREE)`);

    // Update event sold tickets count
    const currentSoldTickets = ticket.event.soldTickets;
    await prisma.event.update({
      where: { id: ticket.eventId },
      data: {
        soldTickets: currentSoldTickets - 1 // Reduce by 1 since we removed 1 ticket
      }
    });

    console.log(`\n   ✅ Updated event sold tickets: ${currentSoldTickets} → ${currentSoldTickets - 1}`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        event: true
      }
    });

    console.log('\n📋 Updated Ticket:');
    console.log('  Event:', updatedTicket.event.title);
    console.log('  Quantity:', updatedTicket.quantity);
    console.log('  Total Price:', updatedTicket.totalPrice);
    console.log('  Is Free:', updatedTicket.totalPrice === 0);

    await prisma.$disconnect();
    console.log('\n✅ Done! Ticket is now 1 free ticket only.');
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixUserTickets();


