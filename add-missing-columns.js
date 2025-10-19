const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to existing database...');

    // Add guest fields to Ticket table if they don't exist
    await prisma.$executeRaw`
      ALTER TABLE "Ticket" 
      ADD COLUMN IF NOT EXISTS "guestName" TEXT,
      ADD COLUMN IF NOT EXISTS "guestEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "guestPhone" TEXT,
      ADD COLUMN IF NOT EXISTS "isGuestTicket" BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "isFreeAccess" BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
    `;

    console.log('Successfully added missing columns to Ticket table');

    // Add foreign key constraint for subscriptionId if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Ticket" 
        ADD CONSTRAINT "Ticket_subscriptionId_fkey" 
        FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" (id);
      `;
      console.log('Added foreign key constraint for subscriptionId');
    } catch (error) {
      console.log('Foreign key constraint might already exist:', error.message);
    }

  } catch (error) {
    console.error('Error adding missing columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();
