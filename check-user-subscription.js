const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from env file
const envPath = path.join(__dirname, 'env');
let databaseUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    databaseUrl = match[1].trim();
    process.env.DATABASE_URL = databaseUrl;
  }
}

const prisma = new PrismaClient();

async function checkUserSubscription() {
  try {
    const email = 'rover.rapper@gmail.com';
    
    console.log('🔍 Checking user:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tickets: {
          include: {
            event: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Phone:', user.phone);
    console.log('Role:', user.role);

    console.log('\n💳 Subscriptions:');
    if (user.subscriptions.length === 0) {
      console.log('No subscriptions found');
    } else {
      user.subscriptions.forEach((sub, index) => {
        console.log(`\nSubscription ${index + 1}:`);
        console.log('  ID:', sub.id);
        console.log('  Status:', sub.status);
        console.log('  Plan:', sub.plan.name);
        console.log('  Start Date:', sub.startDate);
        console.log('  End Date:', sub.endDate);
        console.log('  Price:', sub.price);
        
        const now = new Date();
        const endDate = new Date(sub.endDate);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log('  Days Remaining:', daysRemaining);
        console.log('  Is Expired:', endDate < now);
        console.log('  Is Active:', sub.status === 'ACTIVE' && endDate > now);
      });
    }

    console.log('\n🎫 Tickets:');
    if (user.tickets.length === 0) {
      console.log('No tickets found');
    } else {
      user.tickets.forEach((ticket, index) => {
        console.log(`\nTicket ${index + 1}:`);
        console.log('  ID:', ticket.id);
        console.log('  Event:', ticket.event.title);
        console.log('  Quantity:', ticket.quantity);
        console.log('  Total Price:', ticket.totalPrice);
        console.log('  Status:', ticket.status);
        console.log('  Created At:', ticket.createdAt);
        console.log('  Is Free:', ticket.totalPrice === 0);
      });
    }

    // Check for free tickets
    const freeTickets = user.tickets.filter(t => t.totalPrice === 0);
    console.log('\n🆓 Free Tickets Count:', freeTickets.length);
    if (freeTickets.length > 1) {
      console.log('⚠️  WARNING: User has more than 1 free ticket!');
      console.log('Free tickets:');
      freeTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. Event: ${ticket.event.title}, Quantity: ${ticket.quantity}, Price: ${ticket.totalPrice}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUserSubscription();

