import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Updating admin user password...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agrajammingclub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';
    
    // Update admin user password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        name: 'Admin User',
        phone: adminPhone,
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
        isValidPassword: isValidPassword
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
