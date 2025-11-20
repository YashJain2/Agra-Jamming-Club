/**
 * Script to update an event's image URL
 * Usage: node update-event-image-url.js <eventTitle> <imageUrl>
 * Example: node update-event-image-url.js "Event-2" "https://i.imgur.com/example.jpg"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEventImage() {
  try {
    // Get arguments from command line
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node update-event-image-url.js <eventTitle> <imageUrl>');
      console.log('   Example: node update-event-image-url.js "Event-2" "https://i.imgur.com/example.jpg"');
      process.exit(1);
    }

    const eventTitle = args[0];
    const imageUrl = args[1];

    console.log(`🔍 Searching for event: "${eventTitle}"...`);
    
    // Find the event by title (case-insensitive, partial match)
    const event = await prisma.event.findFirst({
      where: {
        title: {
          contains: eventTitle,
          mode: 'insensitive',
        },
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one
      },
    });

    if (!event) {
      console.log(`❌ Event not found with title containing: "${eventTitle}"`);
      console.log('💡 Available events:');
      const allEvents = await prisma.event.findMany({
        where: { isActive: true },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      allEvents.forEach(e => {
        console.log(`   - ${e.title} (ID: ${e.id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);
    console.log(`   Current image: ${event.imageUrl || 'None'}`);
    console.log(`   New image: ${imageUrl}`);

    // Update the event with the image URL
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        imageUrl: imageUrl,
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

