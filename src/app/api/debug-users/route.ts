import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get all users to debug
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password
      }))
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users', 
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
