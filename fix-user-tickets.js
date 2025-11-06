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

    // Find tickets with quantity > 1 and totalPrice = 0 (should not happen)
    const problematicTickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
        totalPrice: 0,
        quantity: {
          gt: 1
        }
      },
      include: {
        event: true
      }
    });

    console.log(`\n📋 Found ${problematicTickets.length} problematic ticket(s):`);

    for (const ticket of problematicTickets) {
      console.log(`\n🎫 Ticket ID: ${ticket.id}`);
      console.log(`   Event: ${ticket.event.title}`);
      console.log(`   Quantity: ${ticket.quantity}`);
      console.log(`   Current Price: ₹${ticket.totalPrice}`);
      console.log(`   Event Price: ₹${ticket.event.price}`);

      // Calculate correct price: 1 free + rest paid
      const correctPrice = (ticket.quantity - 1) * ticket.event.price;
      
      console.log(`   Correct Price: ₹${correctPrice} (1 free + ${ticket.quantity - 1} paid)`);

      // Update the ticket
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          totalPrice: correctPrice
        }
      });

      console.log(`   ✅ Updated ticket price to ₹${correctPrice}`);
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedTickets = await prisma.ticket.findMany({
      where: {
        userId: user.id
      },
      include: {
        event: true
      }
    });

    console.log('\n📋 Updated Tickets:');
    updatedTickets.forEach((ticket, index) => {
      console.log(`\nTicket ${index + 1}:`);
      console.log('  Event:', ticket.event.title);
      console.log('  Quantity:', ticket.quantity);
      console.log('  Total Price:', ticket.totalPrice);
      console.log('  Is Free:', ticket.totalPrice === 0);
    });

    // Check subscription visibility
    console.log('\n💳 Checking subscription visibility...');
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`\n✅ Found ${subscriptions.length} active subscription(s):`);
    subscriptions.forEach((sub, index) => {
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`\nSubscription ${index + 1}:`);
      console.log('  ID:', sub.id);
      console.log('  Status:', sub.status);
      console.log('  Plan:', sub.plan.name);
      console.log('  Days Remaining:', daysRemaining);
      console.log('  User:', sub.user.name, `(${sub.user.email})`);
      console.log('  Should show in admin:', daysRemaining > 0 && sub.status === 'ACTIVE');
    });

    await prisma.$disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixUserTickets();


