import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing basic SQL query...');
    
    // Test basic event query - get all events
    const eventResult = await prisma.$queryRaw`
      SELECT *
      FROM "Event"
      ORDER BY "createdAt" DESC
      LIMIT 3
    `;
    
    console.log('Event result:', eventResult);
    
    return NextResponse.json({
      success: true,
      data: eventResult,
    });
    
  } catch (error) {
    console.error('SQL Test Error:', error);
    return NextResponse.json(
      { error: 'SQL Test Failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
