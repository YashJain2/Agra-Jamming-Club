import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Test data generators
export const testData = {
  createTestUser: async (overrides: any = {}) => {
    return await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'password123',
        role: 'USER',
        isActive: true,
        ...overrides,
      },
    });
  },

  createTestEvent: async (organizerId: string, overrides: any = {}) => {
    return await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'A test event for testing purposes',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        time: '19:00',
        venue: 'Test Venue',
        address: 'Test Address',
        city: 'Agra',
        state: 'Uttar Pradesh',
        country: 'India',
        price: 299,
        maxTickets: 50,
        category: 'MUSIC',
        status: 'PUBLISHED',
        organizerId,
        isActive: true,
        ...overrides,
      },
    });
  },

  createTestSubscription: async (userId: string, planId: string, overrides: any = {}) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        price: 999,
        status: 'ACTIVE',
        autoRenew: true,
        ...overrides,
      },
    });
  },

  createTestTicket: async (userId: string, eventId: string, overrides: any = {}) => {
    return await prisma.ticket.create({
      data: {
        userId,
        eventId,
        quantity: 1,
        totalPrice: 299,
        status: 'CONFIRMED',
        isVerified: false,
        ...overrides,
      },
    });
  },
};

// API testing utilities
export class APITester {
  private baseUrl: string;
  private session: any = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async authenticate(email: string, password: string) {
    // This would need to be implemented based on your auth system
    // For now, we'll simulate authentication
    this.session = { user: { email, role: 'USER' } };
  }

  async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; data: any }> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();
      return {
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      return {
        status: 500,
        data: { error: 'Network error' },
      };
    }
  }

  async testEventCRUD() {
    console.log('Testing Event CRUD operations...');
    
    // Test creating an event
    const createResponse = await this.makeRequest('POST', '/api/events', {
      title: 'Test Event',
      description: 'Test Description',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      time: '19:00',
      venue: 'Test Venue',
      price: 299,
      maxTickets: 50,
    });

    console.log('Create Event:', createResponse.status === 200 ? '✅' : '❌');

    if (createResponse.status === 200) {
      const eventId = createResponse.data.data.id;
      
      // Test getting the event
      const getResponse = await this.makeRequest('GET', `/api/events/${eventId}`);
      console.log('Get Event:', getResponse.status === 200 ? '✅' : '❌');

      // Test updating the event
      const updateResponse = await this.makeRequest('PUT', `/api/events/${eventId}`, {
        title: 'Updated Test Event',
      });
      console.log('Update Event:', updateResponse.status === 200 ? '✅' : '❌');
    }
  }

  async testSubscriptionCRUD() {
    console.log('Testing Subscription operations...');
    
    const getPlansResponse = await this.makeRequest('GET', '/api/subscription-plans');
    console.log('Get Subscription Plans:', getPlansResponse.status === 200 ? '✅' : '❌');

    const getSubscriptionsResponse = await this.makeRequest('GET', '/api/subscriptions');
    console.log('Get Subscriptions:', getSubscriptionsResponse.status === 200 ? '✅' : '❌');
  }

  async testVerificationSystem() {
    console.log('Testing Verification system...');
    
    const verifyResponse = await this.makeRequest('POST', '/api/verification/verify', {
      ticketId: 'test-ticket-id',
      action: 'verify',
    });
    console.log('Verify Ticket:', verifyResponse.status === 200 ? '✅' : '❌');
  }

  async runAllTests() {
    console.log('🧪 Running API Tests...\n');
    
    await this.testEventCRUD();
    await this.testSubscriptionCRUD();
    await this.testVerificationSystem();
    
    console.log('\n✅ All tests completed!');
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  details: any;
}> {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check table counts
    const counts = {
      users: await prisma.user.count(),
      events: await prisma.event.count(),
      subscriptions: await prisma.subscription.count(),
      tickets: await prisma.ticket.count(),
      payments: await prisma.payment.count(),
    };

    return {
      isHealthy: true,
      details: {
        connection: 'OK',
        counts,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      isHealthy: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      this.metrics.get(operation)!.push(duration);
    };
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [operation, durations] of this.metrics.entries()) {
      result[operation] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    }
    
    return result;
  }

  reset() {
    this.metrics.clear();
  }
}

// Error monitoring
export class ErrorMonitor {
  private errors: Array<{
    timestamp: Date;
    error: Error;
    context: any;
  }> = [];

  logError(error: Error, context: any = {}) {
    this.errors.push({
      timestamp: new Date(),
      error,
      context,
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  getErrors() {
    return this.errors;
  }

  getErrorStats() {
    const errorTypes = new Map<string, number>();
    
    for (const error of this.errors) {
      const type = error.error.constructor.name;
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    }
    
    return {
      total: this.errors.length,
      byType: Object.fromEntries(errorTypes),
      recent: this.errors.slice(-10),
    };
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const errorMonitor = new ErrorMonitor();

// Health check endpoint
export async function healthCheck(): Promise<NextResponse> {
  const dbHealth = await checkDatabaseHealth();
  const performance = performanceMonitor.getMetrics();
  const errors = errorMonitor.getErrorStats();

  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    performance,
    errors,
  });
}
