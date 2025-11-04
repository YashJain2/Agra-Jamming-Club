#!/usr/bin/env node

/**
 * Script to reset database and create Raahein event directly in database
 * Uses DATABASE_URL from environment
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (match) {
    process.env.DATABASE_URL = match[1];
  }
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting database reset and event creation...');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // Get admin user ID for organizer
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin user found:', adminUser.email);

    // Step 1: Delete all tickets
    console.log('🗑️ Deleting all tickets...');
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} tickets`);

    // Step 2: Delete all payments
    console.log('🗑️ Deleting all payments...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    // Step 3: Delete all subscriptions
    console.log('🗑️ Deleting all subscriptions...');
    const deletedSubscriptions = await prisma.subscription.deleteMany({});
    console.log(`✅ Deleted ${deletedSubscriptions.count} subscriptions`);

    // Step 4: Delete all events
    console.log('🗑️ Deleting all events...');
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`✅ Deleted ${deletedEvents.count} events`);

    // Step 5: Create the new Raahein event
    console.log('🎵 Creating Raahein event...');

    // Parse the date: 9th November, 2025 at 6:00 PM IST
    const eventDate = new Date('2025-11-09T18:00:00+05:30'); // 6:00 PM IST

    // Build description with all the content
    const description = `💛 About the Theme
Some songs heal, some hurt, and some simply help us feel.
This jam is for all the emotions we usually hide — the heartbreaks, the lessons, the quiet strength of living through it all.
Let's sing our stories, share our pain, and celebrate the beauty of being human.

🎤 What to Expect
• Collective sing-alongs on life-inspired melodies
• Open stage for emotional originals & expressive performances
• A safe space to feel, share, and connect through music

🎟️ Limited Spots Only!
Join us for an evening that promises truth, togetherness, and a few teardrops turned into tunes.
✨ Because even pain sounds beautiful when we sing it together.`;

    // Build requirements/cancellation policy with terms
    const termsAndConditions = `No refunds or adjustments once tickets are booked.
No alcohol, smoking, or substances allowed.
Kids are welcome, but parents must ensure they don't cause disturbance.
This is a No Judgement Zone — sing freely; perfection isn't the goal.
No Vulgar Songs or Language — keep lyrics and behavior respectful.
No Food Allowed during the session.
Pre-Approval Required for original compositions — all content must align with AJC's values.
Inclusive Vibes Only — everyone deserves to feel safe and accepted.
Cheer & Encourage — we rise together.
Be On Time and respect the schedule.
Seating will be on first come first serve basis.
Every individual who will attend the event should fill the form separately for verification. Anyone who fails to do so will be denied entry in the session.`;

    const newEvent = await prisma.event.create({
      data: {
        title: 'Raahein — Songs of Life & Pain',
        description: description,
        date: eventDate,
        time: '6:00 PM – 8:30 PM',
        venue: 'Two Saints',
        address: 'Fatehabad Road',
        city: 'Agra',
        state: 'Uttar Pradesh',
        country: 'India',
        price: 199,
        maxTickets: 250,
        soldTickets: 0,
        category: 'MUSIC',
        status: 'PUBLISHED',
        isActive: true,
        tags: ['life', 'emotions', 'healing', 'music', 'community'],
        requirements: termsAndConditions,
        cancellationPolicy: 'No refunds or adjustments once tickets are booked.',
        refundPolicy: 'No refunds or adjustments once tickets are booked.',
        organizerId: adminUser.id,
      },
    });

    console.log('✅ Raahein event created successfully!');
    console.log('\n📋 Event Details:');
    console.log(`   ID: ${newEvent.id}`);
    console.log(`   Title: ${newEvent.title}`);
    console.log(`   Date: ${newEvent.date.toLocaleString()}`);
    console.log(`   Time: ${newEvent.time}`);
    console.log(`   Venue: ${newEvent.venue}`);
    console.log(`   Price: ₹${newEvent.price}`);
    console.log(`   Max Tickets: ${newEvent.maxTickets}`);
    console.log(`   Status: ${newEvent.status}`);

    console.log('\n📊 Summary:');
    console.log(`   Deleted Events: ${deletedEvents.count}`);
    console.log(`   Deleted Tickets: ${deletedTickets.count}`);
    console.log(`   Deleted Subscriptions: ${deletedSubscriptions.count}`);
    console.log(`   Deleted Payments: ${deletedPayments.count}`);
    console.log(`   Created Event: 1 (Raahein)`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

