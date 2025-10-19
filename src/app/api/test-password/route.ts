import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@agrajammingclub.com' }
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    
    // Test password comparison
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password!);
    
    return NextResponse.json({
      success: true,
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
        hasPassword: !!adminUser.password
      },
      passwordTest: {
        testPassword: testPassword,
        isValidPassword: isValidPassword,
        passwordHash: adminUser.password?.substring(0, 20) + '...'
      }
    });

  } catch (error) {
    console.error('Password test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test password', 
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
