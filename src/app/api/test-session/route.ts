import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simple test endpoint to check session
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing session detection...');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'No session found', session: null },
        { status: 401 }
      );
    }
    
    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role
    });
    
    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      }
    });
    
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json(
      { error: 'Session test failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
