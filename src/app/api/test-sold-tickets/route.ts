import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to check sold tickets calculation
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing sold tickets calculation...');
    
    const eventId = 'cmgxkm7ao00012xearybs7e8d'; // Diwal Bash event
    
    // Test the raw SQL query used in events API
    const actualSoldTickets = await prisma.$queryRaw`
      SELECT COALESCE(SUM(quantity), 0) as "totalSold"
      FROM "Ticket" 
      WHERE "eventId" = ${eventId} 
      AND status IN ('CONFIRMED', 'PENDING', 'USED')
    `;
    
    console.log('Raw SQL result:', actualSoldTickets);
    
    // Also get tickets using Prisma ORM for comparison
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ['CONFIRMED', 'PENDING', 'USED']
        }
      },
      select: {
        quantity: true,
        status: true,
      }
    });
    
    const prismaSoldTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    
    console.log('Prisma ORM result:', prismaSoldTickets);
    console.log('Individual tickets:', tickets);
    
    return NextResponse.json({
      success: true,
      eventId: eventId,
      prismaResult: prismaSoldTickets,
      individualTickets: tickets,
      totalTickets: tickets.length,
      rawSqlTotalSold: parseInt(((actualSoldTickets as any[])[0] as any).totalSold.toString()),
    });
    
  } catch (error) {
    console.error('Error testing sold tickets:', error);
    return NextResponse.json(
      { error: 'Failed to test sold tickets', details: (error as Error).message },
      { status: 500 }
    );
  }
}
