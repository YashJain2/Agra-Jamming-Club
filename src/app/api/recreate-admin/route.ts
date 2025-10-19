import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Recreating admin user with correct password...');
    
    const adminEmail = 'admin@agrajammingclub.com';
    const adminPassword = 'admin123';
    
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
      where: { email: adminEmail }
    });
    
    // Create new admin user with correct password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        phone: '9876543210',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    
    // Test the password
    const isValidPassword = await bcrypt.compare(adminPassword, adminUser.password!);
    
    return NextResponse.json({
      success: true,
      message: 'Admin user recreated successfully',
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive
      },
      passwordTest: {
        testPassword: adminPassword,
        isValidPassword: isValidPassword
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error('Recreate admin error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to recreate admin user', 
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
