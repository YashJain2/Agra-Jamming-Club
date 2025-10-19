import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  static getInstance(config?: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      if (!config) {
        throw new Error('RateLimiter must be initialized with config');
      }
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  async checkLimit(identifier: string, endpoint: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.windowMs);

    try {
      // Clean up old entries
      await prisma.rateLimit.deleteMany({
        where: {
          windowStart: {
            lt: windowStart
          }
        }
      });

      // Check current count
      const currentCount = await prisma.rateLimit.count({
        where: {
          identifier,
          endpoint,
          windowStart: {
            gte: windowStart
          }
        }
      });

      if (currentCount >= this.config.maxRequests) {
        return false;
      }

      // Increment counter
      await prisma.rateLimit.upsert({
        where: {
          identifier_endpoint_windowStart: {
            identifier,
            endpoint,
            windowStart: now
          }
        },
        update: {
          count: {
            increment: 1
          },
          updatedAt: now
        },
        create: {
          identifier,
          endpoint,
          count: 1,
          windowStart: now
        }
      });

      return true;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return true; // Fail open
    }
  }
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

export async function auditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  request?: NextRequest
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
        newValues: newValues ? JSON.stringify(newValues) : undefined,
        ipAddress: request ? getClientIP(request) : undefined,
        userAgent: request ? getUserAgent(request) : undefined,
      }
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYMENT' | 'EVENT' | 'SUBSCRIPTION' = 'INFO',
  metadata?: any
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      }
    });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimiter = RateLimiter.getInstance(config);
    const identifier = getClientIP(request);
    const endpoint = request.nextUrl.pathname;

    const isAllowed = await rateLimiter.checkLimit(identifier, endpoint);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    return handler(request);
  };
}

export function withAuditLog(
  handler: (request: NextRequest) => Promise<NextResponse>,
  action: string,
  entity: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    
    // Log the action
    await auditLog(
      null, // userId will be extracted from session if needed
      action,
      entity,
      undefined,
      undefined,
      undefined,
      request
    );

    return response;
  };
}

export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      // Log error to audit log
      await auditLog(
        null,
        'ERROR',
        'API',
        request.nextUrl.pathname,
        undefined,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        request
      );

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
