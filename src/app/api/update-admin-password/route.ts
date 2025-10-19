import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Updating admin user password...');
    
    const adminEmail = 'admin@agrajammingclub.com';
    const adminPassword = 'admin123';
    
    // Update admin user password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        name: 'Admin User',
        phone: '9876543210',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    
    // Test the password
    const isValidPassword = await bcrypt.compare(adminPassword, adminUser.password!);
    
    return NextResponse.json({
      success: true,
      message: 'Admin user password updated successfully',
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
    console.error('Update admin password error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update admin password', 
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
