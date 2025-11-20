/**
 * Script to upload an image to Imgur and update an event
 * Usage: node upload-and-update-event-image.js <imagePath> <eventTitle>
 * Example: node upload-and-update-event-image.js "/home/yajain/Pictures/event-2.jpeg" "Event-2"
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function uploadToImgur(imagePath) {
  try {
    console.log('📤 Uploading image to Imgur...');
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Imgur anonymous upload endpoint
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7', // Imgur's public client ID
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.data?.error || 'Failed to upload to Imgur');
    }

    console.log('✅ Image uploaded successfully!');
    console.log(`   URL: ${data.data.link}`);
    
    return data.data.link;
  } catch (error) {
    console.error('❌ Error uploading to Imgur:', error.message);
    throw error;
  }
}

async function updateEventImage() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node upload-and-update-event-image.js <imagePath> <eventTitle>');
      console.log('   Example: node upload-and-update-event-image.js "/home/yajain/Pictures/event-2.jpeg" "Event-2"');
      process.exit(1);
    }

    const imagePath = args[0];
    const eventTitle = args[1];

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image file not found: ${imagePath}`);
      process.exit(1);
    }

    // Upload to Imgur
    const imageUrl = await uploadToImgur(imagePath);

    // Find the event
    console.log(`\n🔍 Searching for event: "${eventTitle}"...`);
    
    const event = await prisma.event.findFirst({
      where: {
        title: {
          contains: eventTitle,
          mode: 'insensitive',
        },
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
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
      console.log(`\n✅ Image uploaded successfully! URL: ${imageUrl}`);
      console.log('   You can manually add this URL to your event.');
      process.exit(1);
    }

    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);
    console.log(`   Current image: ${event.imageUrl || 'None'}`);

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        imageUrl: imageUrl,
      },
    });

    console.log('\n✅ Event updated successfully!');
    console.log(`   Image URL: ${updatedEvent.imageUrl}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateEventImage();

