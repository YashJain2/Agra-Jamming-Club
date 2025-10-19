import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to check users and events
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking users and events...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`);
    });
    
    // Get all events
    const events = await prisma.event.findMany();
    console.log('Events found:', events.length);
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} - ID: ${event.id}`);
    });
    
    return NextResponse.json({
      success: true,
      users: users,
      events: events,
      userCount: users.length,
      eventCount: events.length
    });
    
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
