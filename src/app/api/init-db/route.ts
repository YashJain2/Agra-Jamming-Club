import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Initializing database...');
    
    // First, try to create tables if they don't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          id TEXT NOT NULL PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          "emailVerified" TIMESTAMP,
          image TEXT,
          password TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'USER',
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Event" (
          id TEXT NOT NULL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          date TIMESTAMP NOT NULL,
          time TEXT NOT NULL,
          venue TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          country TEXT NOT NULL,
          price REAL NOT NULL,
          "maxTickets" INTEGER NOT NULL,
          "soldTickets" INTEGER NOT NULL DEFAULT 0,
          "imageUrl" TEXT,
          gallery TEXT[],
          category TEXT NOT NULL,
          tags TEXT[],
          requirements TEXT,
          "cancellationPolicy" TEXT,
          "refundPolicy" TEXT,
          status TEXT NOT NULL DEFAULT 'PUBLISHED',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
          id TEXT NOT NULL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          price REAL NOT NULL,
          duration INTEGER NOT NULL,
          benefits TEXT[],
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Subscription" (
          id TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "planId" TEXT NOT NULL,
          "startDate" TIMESTAMP NOT NULL,
          "endDate" TIMESTAMP NOT NULL,
          price REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          "autoRenew" BOOLEAN NOT NULL DEFAULT TRUE,
          "cancelledAt" TIMESTAMP,
          "cancellationReason" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE CASCADE,
          FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" (id)
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Ticket" (
          id TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT,
          "eventId" TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          "totalPrice" REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
          "verifiedAt" TIMESTAMP,
          "verifiedBy" TEXT,
          "qrCode" TEXT,
          "seatNumbers" TEXT[],
          "specialRequests" TEXT,
          "guestName" TEXT,
          "guestEmail" TEXT,
          "guestPhone" TEXT,
          "isGuestTicket" BOOLEAN NOT NULL DEFAULT FALSE,
          "isFreeAccess" BOOLEAN NOT NULL DEFAULT FALSE,
          "subscriptionId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE CASCADE,
          FOREIGN KEY ("eventId") REFERENCES "Event" (id) ON DELETE CASCADE,
          FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" (id)
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Payment" (
          id TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT,
          "ticketId" TEXT,
          "subscriptionId" TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          method TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          "transactionId" TEXT,
          "paymentDetails" JSONB,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE CASCADE,
          FOREIGN KEY ("ticketId") REFERENCES "Ticket" (id) ON DELETE CASCADE,
          FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" (id)
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "AuditLog" (
          id TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT,
          action TEXT NOT NULL,
          entity TEXT,
          "entityId" TEXT,
          "oldValues" JSONB,
          "newValues" JSONB,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE SET NULL
        );
      `;
      
      console.log('Database tables created successfully');
    } catch (tableError) {
      console.log('Tables might already exist or error creating them:', tableError);
    }
    
    // Create admin user using environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agrajammingclub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';

    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          phone: adminPhone,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

        // Fix event sold tickets to match actual ticket data
        const events = await prisma.$queryRaw`
          SELECT 
            e.id,
            e.title,
            e."soldTickets",
            COUNT(t.id) as "actualTicketCount",
            COALESCE(SUM(t.quantity), 0) as "actualGuestCount"
          FROM "Event" e
          LEFT JOIN "Ticket" t ON e.id = t."eventId" AND t.status IN ('CONFIRMED', 'PENDING', 'USED')
          GROUP BY e.id, e.title, e."soldTickets"
        `;

        console.log('Events before sync:', events);

        // Update event sold tickets to match actual data
        const updates = [];
        for (const event of events as any[]) {
          const actualCount = parseInt(event.actualGuestCount);
          if (event.soldTickets !== actualCount) {
            console.log(`Updating ${event.title}: ${event.soldTickets} -> ${actualCount}`);
            await prisma.$executeRaw`
              UPDATE "Event" 
              SET "soldTickets" = ${actualCount}
              WHERE id = ${event.id}
            `;
            updates.push({
              eventId: event.id,
              title: event.title,
              oldCount: event.soldTickets,
              newCount: actualCount
            });
          }
        }

        console.log('Updates made:', updates);

        return NextResponse.json({
          success: true,
          message: 'Database initialized successfully!',
          adminUser: { email: adminUser.email, role: adminUser.role },
          eventsFixed: (events as any[]).length,
          ticketSyncUpdates: updates
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
