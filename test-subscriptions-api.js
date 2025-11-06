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

async function testSubscriptions() {
  try {
    console.log('🔍 Checking all subscriptions in database...\n');
    
    // Get all subscriptions (like admin would see)
    const allSubscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total subscriptions in database: ${allSubscriptions.length}\n`);

    allSubscriptions.forEach((sub, index) => {
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = endDate < now;
      
      console.log(`\nSubscription ${index + 1}:`);
      console.log('  ID:', sub.id);
      console.log('  User:', sub.user.name, `(${sub.user.email})`);
      console.log('  Plan:', sub.plan.name);
      console.log('  Status:', sub.status);
      console.log('  Start Date:', sub.startDate);
      console.log('  End Date:', sub.endDate);
      console.log('  Days Remaining:', daysRemaining);
      console.log('  Is Expired:', isExpired);
      console.log('  Should show in admin:', sub.status === 'ACTIVE' && !isExpired);
    });

    // Check specifically for Rohan Verma
    console.log('\n\n🔍 Checking specifically for Rohan Verma...\n');
    const rohanSub = allSubscriptions.find(s => s.user.email === 'rover.rapper@gmail.com');
    
    if (rohanSub) {
      console.log('✅ Found Rohan\'s subscription:');
      console.log('  ID:', rohanSub.id);
      console.log('  Status:', rohanSub.status);
      console.log('  Plan:', rohanSub.plan.name);
      const now = new Date();
      const endDate = new Date(rohanSub.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log('  Days Remaining:', daysRemaining);
      console.log('  Is Expired:', endDate < now);
      console.log('  Should appear in admin:', rohanSub.status === 'ACTIVE' && endDate > now);
    } else {
      console.log('❌ Rohan\'s subscription not found in results!');
    }

    // Check for any filtering issues
    console.log('\n\n🔍 Checking for ACTIVE subscriptions only...\n');
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Active subscriptions: ${activeSubscriptions.length}`);
    activeSubscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.user.name} (${sub.user.email}) - ${sub.plan.name}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testSubscriptions();


