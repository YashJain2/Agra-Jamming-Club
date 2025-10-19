import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // This endpoint will create the database tables and seed initial data
    console.log('Setting up database...');
    
    // Create a test admin user
    const adminEmail = 'admin@agrajammingclub.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          phone: '9999999999',
          role: 'SUPER_ADMIN',
          isActive: true,
        }
      });
      
      console.log('Admin user created successfully');
    }
    
    // Create a test regular user
    const userEmail = 'user@agrajammingclub.com';
    const userPassword = 'user123';
    
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: userEmail,
          password: hashedPassword,
          phone: '8888888888',
          role: 'USER',
          isActive: true,
        }
      });
      
      console.log('Test user created successfully');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      adminCredentials: {
        email: adminEmail,
        password: adminPassword
      },
      userCredentials: {
        email: userEmail,
        password: userPassword
      }
    });
    
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { 
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
