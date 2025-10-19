import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Initializing database...');
    
    // Create admin user
    const adminEmail = 'admin@agrajammingclub.com';
    const userEmail = 'user@agrajammingclub.com';

    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          phone: '9876543210',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists:', adminUser.email);
    }

    let regularUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!regularUser) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      regularUser = await prisma.user.create({
        data: {
          name: 'Regular User',
          email: userEmail,
          password: hashedPassword,
          phone: '8077037849',
          role: 'USER',
          isActive: true,
        },
      });
      console.log('Regular user created:', regularUser.email);
    } else {
      console.log('Regular user already exists:', regularUser.email);
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      adminUser: { email: adminUser.email, role: adminUser.role },
      regularUser: { email: regularUser.email, role: regularUser.role },
      testCredentials: {
        admin: { email: 'admin@agrajammingclub.com', password: 'admin123' },
        user: { email: 'user@agrajammingclub.com', password: 'user123' }
      }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}
