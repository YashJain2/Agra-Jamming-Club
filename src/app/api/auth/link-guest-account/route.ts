import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for account linking
const linkAccountSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/auth/link-guest-account - Link guest purchases to new account
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Guest account linking started...');
    
    const body = await request.json();
    const validatedData = linkAccountSchema.parse(body);
    
    const { email, name, password } = validatedData;
    
    console.log('📋 Account linking details:', { email, name });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Find guest user with this email
    const guestUser = await prisma.user.findFirst({
      where: { 
        email: email,
        password: null, // Guest users have null password
      },
    });

    if (!guestUser) {
      return NextResponse.json(
        { error: 'No guest purchases found for this email' },
        { status: 404 }
      );
    }

    console.log('✅ Guest user found:', guestUser.id);

    // Hash the password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update guest user to regular user
    const updatedUser = await prisma.user.update({
      where: { id: guestUser.id },
      data: {
        name: name,
        password: hashedPassword,
        role: 'USER',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Guest user converted to regular user:', updatedUser.id);

    // Get all guest purchases (tickets and subscriptions)
    const guestTickets = await prisma.ticket.findMany({
      where: { userId: guestUser.id },
      include: {
        event: true,
      },
    });

    const guestSubscriptions = await prisma.subscription.findMany({
      where: { userId: guestUser.id },
      include: {
        plan: true,
      },
    });

    console.log('📋 Found guest purchases:', {
      tickets: guestTickets.length,
      subscriptions: guestSubscriptions.length,
    });

    // Log the account linking action
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'ACCOUNT_LINKED',
        entity: 'User',
        entityId: updatedUser.id,
        newValues: {
          email: email,
          name: name,
          ticketsLinked: guestTickets.length,
          subscriptionsLinked: guestSubscriptions.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        linkedPurchases: {
          tickets: guestTickets.map(ticket => ({
            id: ticket.id,
            event: ticket.event.title,
            date: ticket.event.date,
            quantity: ticket.quantity,
            totalPrice: ticket.totalPrice,
            status: ticket.status,
          })),
          subscriptions: guestSubscriptions.map(subscription => ({
            id: subscription.id,
            plan: subscription.plan.name,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            price: subscription.price,
          })),
        },
        message: 'Account successfully created and linked to your previous purchases!',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error linking guest account:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to link guest account' },
      { status: 500 }
    );
  }
}

// GET /api/auth/link-guest-account - Check if guest purchases exist for email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if guest user exists with purchases
    const guestUser = await prisma.user.findFirst({
      where: { 
        email: email,
        password: null, // Guest users have null password
      },
    });

    if (!guestUser) {
      return NextResponse.json({
        success: true,
        hasGuestPurchases: false,
        message: 'No guest purchases found for this email',
      });
    }

    // Get guest purchases count
    const [ticketsCount, subscriptionsCount] = await Promise.all([
      prisma.ticket.count({ where: { userId: guestUser.id } }),
      prisma.subscription.count({ where: { userId: guestUser.id } }),
    ]);

    return NextResponse.json({
      success: true,
      hasGuestPurchases: true,
      guestUser: {
        name: guestUser.name,
        email: guestUser.email,
      },
      purchases: {
        tickets: ticketsCount,
        subscriptions: subscriptionsCount,
      },
      message: `Found ${ticketsCount} tickets and ${subscriptionsCount} subscriptions for this email`,
    });

  } catch (error) {
    console.error('Error checking guest purchases:', error);
    return NextResponse.json(
      { error: 'Failed to check guest purchases' },
      { status: 500 }
    );
  }
}
