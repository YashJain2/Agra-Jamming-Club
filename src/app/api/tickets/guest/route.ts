import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Build where clause for guest tickets
    const whereClause: any = {
      user: {
        password: null, // Guest users have no password
      }
    };

    if (email && phone) {
      whereClause.user.OR = [
        { email: email },
        { phone: phone }
      ];
    } else if (email) {
      whereClause.user.email = email;
    } else if (phone) {
      whereClause.user.phone = phone;
    }

    // Get tickets with event and user details
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        event: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      tickets: tickets,
      count: tickets.length
    });

  } catch (error) {
    console.error('Guest ticket lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup tickets', details: (error as Error).message },
      { status: 500 }
    );
  }
}
