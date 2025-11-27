/**
 * Script to update the most recently created event with Baithak image
 */

// Load environment variables from .env.local or .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEventImage() {
  try {
    console.log('🔍 Finding the most recently created event...');
    
    // Find the most recently created active event
    const event = await prisma.event.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one
      },
    });

    if (!event) {
      console.log('❌ No active events found');
      process.exit(1);
    }

    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);
    console.log(`   Current image: ${event.imageUrl || 'None'}`);
    console.log(`   New image: /baithak.jpeg`);

    // Update the event with the image URL
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        imageUrl: '/baithak.jpeg',
      },
    });

    console.log('✅ Event updated successfully!');
    console.log(`   Image URL: ${updatedEvent.imageUrl}`);
    
  } catch (error) {
    console.error('❌ Error updating event:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateEventImage();

