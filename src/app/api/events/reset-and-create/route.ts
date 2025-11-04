import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Reset all events, tickets, subscriptions and create new Raahein event
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get admin user ID for organizer
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    console.log('🗑️ Starting cleanup...');

    // Step 1: Delete all tickets (includes guest tickets)
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} tickets`);

    // Step 2: Delete all payments related to tickets/subscriptions
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    // Step 3: Delete all subscriptions
    const deletedSubscriptions = await prisma.subscription.deleteMany({});
    console.log(`✅ Deleted ${deletedSubscriptions.count} subscriptions`);

    // Step 4: Delete all events
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`✅ Deleted ${deletedEvents.count} events`);

    // Step 5: Create the new Raahein event
    console.log('🎵 Creating Raahein event...');

    // Parse the date: 9th November, 2025
    const eventDate = new Date('2025-11-09T18:00:00'); // 6:00 PM IST

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
        imageUrl: '/raahein-event.jpg',
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'RESET_AND_CREATE',
        entity: 'Event',
        entityId: newEvent.id,
        newValues: {
          deletedTickets: deletedTickets.count,
          deletedSubscriptions: deletedSubscriptions.count,
          deletedEvents: deletedEvents.count,
          newEvent: newEvent,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    console.log('✅ Raahein event created successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database reset and new event created successfully',
      data: {
        deleted: {
          tickets: deletedTickets.count,
          subscriptions: deletedSubscriptions.count,
          events: deletedEvents.count,
          payments: deletedPayments.count,
        },
        newEvent: {
          id: newEvent.id,
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          venue: newEvent.venue,
          price: newEvent.price,
          maxTickets: newEvent.maxTickets,
          status: newEvent.status,
        },
      },
    });

  } catch (error) {
    console.error('Error resetting and creating event:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reset and create event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

