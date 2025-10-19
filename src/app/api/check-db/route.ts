import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to check all users and tickets
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking all users and tickets...');
    
    // Get all users
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;
    
    console.log('Users found:', (users as any[]).length);
    (users as any[]).forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Get all tickets
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."createdAt",
        e.title as "eventTitle",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      LEFT JOIN "User" u ON t."userId" = u.id
      ORDER BY t."createdAt" DESC
    `;
    
    console.log('Tickets found:', (tickets as any[]).length);
    (tickets as any[]).forEach((ticket, index) => {
      console.log(`  ${index + 1}. ${ticket.eventTitle} - ${ticket.userName} (${ticket.status}) - ₹${ticket.totalPrice}`);
    });
    
    return NextResponse.json({
      success: true,
      users: users,
      tickets: tickets,
      userCount: (users as any[]).length,
      ticketCount: (tickets as any[]).length
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Database check failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
