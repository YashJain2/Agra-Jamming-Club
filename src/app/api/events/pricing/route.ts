import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEventPricingForUser } from '@/lib/subscription-utils';
import { z } from 'zod';

const pricingRequestSchema = z.object({
  eventDate: z.string().min(1, 'Event date is required'),
  eventPrice: z.number().min(0, 'Event price must be non-negative'),
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

    const { eventDate, eventPrice } = validatedData;
    const userId = session.user.id;

    // Calculate pricing for this specific event
    const pricing = await getEventPricingForUser(userId, new Date(eventDate), eventPrice);

    return NextResponse.json({
      success: true,
      data: pricing,
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
