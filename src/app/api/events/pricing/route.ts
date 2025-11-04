import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEventPricingForUser, hasUserUsedFreeAccessThisMonth } from '@/lib/subscription-utils';
import { z } from 'zod';

const pricingRequestSchema = z.object({
  eventDate: z.string().min(1, 'Event date is required'),
  eventPrice: z.number().min(0, 'Event price must be non-negative'),
  eventId: z.string().optional(), // Optional event ID to check free ticket usage
});

// POST /api/events/pricing - Get event pricing for a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = pricingRequestSchema.parse(body);

    const { eventDate, eventPrice, eventId } = validatedData;
    const userId = session.user.id;

    // Calculate pricing for this specific event
    const pricing = await getEventPricingForUser(userId, new Date(eventDate), eventPrice);

    // Check if user has already used free ticket for this specific event
    let hasUsedFreeTicket = false;
    if (eventId && pricing.subscriptionValid) {
      hasUsedFreeTicket = await hasUserUsedFreeAccessThisMonth(userId, eventId);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pricing,
        hasUsedFreeTicket, // Whether user has already used their free ticket for this event
        canGetFreeTicket: pricing.subscriptionValid && !hasUsedFreeTicket, // Can get 1 free ticket
      },
    });

  } catch (error) {
    console.error('Error calculating event pricing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate event pricing' },
      { status: 500 }
    );
  }
}
