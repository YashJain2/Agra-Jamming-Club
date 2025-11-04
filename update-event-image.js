/**
 * Script to update existing Raahein event with the image URL
 * Run with: node update-event-image.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEventImage() {
  try {
    console.log('🖼️  Updating Raahein event with image...');
    
    // Find the Raahein event
    const event = await prisma.event.findFirst({
      where: {
        title: {
          contains: 'Raahein',
        },
      },
    });

    if (!event) {
      console.log('❌ Raahein event not found');
      return;
    }

    console.log(`📅 Found event: ${event.title} (ID: ${event.id})`);

    // Update the event with the image URL
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        imageUrl: '/raahein-event.jpg',
      },
    });

    console.log('✅ Event updated successfully!');
    console.log(`   Image URL: ${updatedEvent.imageUrl}`);
    
  } catch (error) {
    console.error('❌ Error updating event:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEventImage();

