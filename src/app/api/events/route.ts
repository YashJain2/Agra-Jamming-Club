import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().transform((val) => {
    // Convert various date formats to proper ISO string
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toISOString();
  }),
  time: z.string().min(1, 'Time is required'),
  venue: z.string().min(1, 'Venue is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  maxTickets: z.number().min(1, 'Max tickets must be at least 1'),
  imageUrl: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  category: z.enum(['MUSIC', 'COMEDY', 'WORKSHOP', 'CONFERENCE', 'NETWORKING', 'OTHER']).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  refundPolicy: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {
      isActive: true,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    // Calculate actual sold tickets for each event using Prisma ORM
    const eventsWithActualSoldTickets = await Promise.all(
      events.map(async (event) => {
        const tickets = await prisma.ticket.findMany({
          where: {
            eventId: event.id,
            status: {
              in: ['CONFIRMED', 'PENDING', 'USED']
            }
          },
          select: {
            quantity: true,
          }
        });
        
        const actualSoldTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
        
        return {
          ...event,
          soldTickets: actualSoldTickets,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: eventsWithActualSoldTickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Handle date conversion properly
    const eventData = {
      ...validatedData,
      organizerId: session.user.id,
      date: new Date(validatedData.date), // validatedData.date is now already an ISO string
    };

    const event = await prisma.event.create({
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Event',
        entityId: event.id,
        newValues: event,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: event,
    });

  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
