const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkColumns() {
  try {
    console.log('Checking Ticket table columns...');

    // Query the table structure
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Ticket' 
      ORDER BY ordinal_position;
    `;

    console.log('Ticket table columns:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
