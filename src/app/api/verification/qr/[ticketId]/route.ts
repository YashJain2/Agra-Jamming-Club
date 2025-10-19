import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

// GET /api/verification/qr/[ticketId] - Generate QR code for ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
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

    // Check if user owns the ticket or has admin privileges
    if (ticket.userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate QR code data
    const qrData = {
      ticketId: ticket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
      quantity: ticket.quantity,
      timestamp: Date.now(),
    };

    const qrCodeString = JSON.stringify(qrData);
    const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
      width: 200,
      margin: 2,
    });

    // Update ticket with QR code
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { qrCode: qrCodeString },
    });

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeImage,
        ticket: ticket,
      },
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
