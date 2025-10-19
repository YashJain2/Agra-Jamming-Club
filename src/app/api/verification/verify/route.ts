import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireModerator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import QRCode from 'qrcode';

const verifyTicketSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  action: z.enum(['verify', 'unverify']),
});

// POST /api/verification/verify - Verify/unverify ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = verifyTicketSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: validatedData.ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const isVerified = validatedData.action === 'verify';
    const verifiedAt = isVerified ? new Date() : null;

    const updatedTicket = await prisma.ticket.update({
      where: { id: validatedData.ticketId },
      data: {
        isVerified,
        verifiedAt,
        verifiedBy: isVerified ? session.user.id : null,
        status: isVerified ? 'USED' : 'CONFIRMED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: isVerified ? 'VERIFY_TICKET' : 'UNVERIFY_TICKET',
        entity: 'Ticket',
        entityId: validatedData.ticketId,
        oldValues: ticket,
        newValues: updatedTicket,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: isVerified ? 'Ticket verified successfully' : 'Ticket verification removed',
    });

  } catch (error) {
    console.error('Error verifying ticket:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify ticket' },
      { status: 500 }
    );
  }
}
