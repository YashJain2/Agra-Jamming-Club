import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update all events with missing imageUrl to use the raahein-event.jpg image
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

    // Find all events without imageUrl or with null imageUrl
    const eventsToUpdate = await prisma.event.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' },
        ],
      },
    });

    if (eventsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No events need updating',
        updated: 0,
      });
    }

    // Update all events to use the raahein-event.jpg image
    const updated = await prisma.event.updateMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' },
        ],
      },
      data: {
        imageUrl: '/raahein-event.jpg',
      },
    });

    // Also update the Raahein event specifically if it exists
    const raaheinEvent = await prisma.event.findFirst({
      where: {
        title: {
          contains: 'Raahein',
        },
      },
    });

    if (raaheinEvent) {
      await prisma.event.update({
        where: { id: raaheinEvent.id },
        data: {
          imageUrl: '/raahein-event.jpg',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Events updated successfully',
      updated: updated.count,
    });

  } catch (error) {
    console.error('Error updating event images:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update event images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

