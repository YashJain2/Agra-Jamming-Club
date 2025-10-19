import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export async function handleApiError(error: any, request: NextRequest): Promise<NextResponse> {
  console.error('API Error:', error);

  // Log error to database
  try {
    await prisma.auditLog.create({
      data: {
        action: 'ERROR',
        entity: 'API',
        entityId: undefined,
        oldValues: undefined,
        newValues: {
          error: error.message,
          stack: error.stack,
          url: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }

  // Handle different error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    return NextResponse.json(
      {
        error: 'Database error occurred',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details,
      },
      { status: 400 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS',
      { missing }
    );
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function rateLimitCheck(identifier: string, endpoint: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      const windowStart = new Date(Date.now() - windowMs);
      
      // Clean old entries
      await prisma.rateLimit.deleteMany({
        where: {
          windowStart: {
            lt: windowStart,
          },
        },
      });

      // Check current count
      const currentCount = await prisma.rateLimit.count({
        where: {
          identifier,
          endpoint,
          windowStart: {
            gte: windowStart,
          },
        },
      });

      if (currentCount >= limit) {
        resolve(false);
        return;
      }

      // Increment count
      await prisma.rateLimit.upsert({
        where: {
          identifier_endpoint_windowStart: {
            identifier,
            endpoint,
            windowStart: new Date(Math.floor(Date.now() / windowMs) * windowMs),
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          identifier,
          endpoint,
          count: 1,
          windowStart: new Date(Math.floor(Date.now() / windowMs) * windowMs),
        },
      });

      resolve(true);
    } catch (error) {
      console.error('Rate limit check error:', error);
      resolve(true); // Allow request if rate limiting fails
    }
  });
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    if (data.includes('@')) {
      // Email masking
      const [local, domain] = data.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }
    if (data.length > 10) {
      // Phone number masking
      return `${data.substring(0, 3)}***${data.substring(data.length - 3)}`;
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***';
      }
    }
    
    return masked;
  }
  
  return data;
}
