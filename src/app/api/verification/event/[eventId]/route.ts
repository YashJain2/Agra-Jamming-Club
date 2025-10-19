import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireModerator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/verification/event/[eventId] - Get guest list for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');

    const where: any = {
      eventId: eventId,
    };

    if (verified !== null) {
      where.isVerified = verified === 'true';
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            venue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
    });

  } catch (error) {
    console.error('Error fetching guest list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest list' },
      { status: 500 }
    );
  }
}
