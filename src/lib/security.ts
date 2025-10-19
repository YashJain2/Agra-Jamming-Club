import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Input validation schemas
export const userValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
});

export const eventValidationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  venue: z.string().min(1, 'Venue is required').max(200, 'Venue name too long'),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').default('Agra'),
  state: z.string().max(100, 'State name too long').default('Uttar Pradesh'),
  country: z.string().max(100, 'Country name too long').default('India'),
  price: z.number().min(0, 'Price must be positive').max(10000, 'Price too high'),
  maxTickets: z.number().min(1, 'Max tickets must be at least 1').max(1000, 'Max tickets too high'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  gallery: z.array(z.string().url('Invalid gallery URL')).max(10, 'Too many gallery images').optional(),
  category: z.enum(['MUSIC', 'COMEDY', 'WORKSHOP', 'CONFERENCE', 'NETWORKING', 'OTHER']).default('MUSIC'),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags').optional(),
  requirements: z.string().max(1000, 'Requirements too long').optional(),
  cancellationPolicy: z.string().max(1000, 'Cancellation policy too long').optional(),
  refundPolicy: z.string().max(1000, 'Refund policy too long').optional(),
});

export const subscriptionValidationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  startDate: z.string().datetime('Invalid start date').optional(),
  autoRenew: z.boolean().default(true),
});

export const ticketValidationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per person'),
  specialRequests: z.string().max(500, 'Special requests too long').optional(),
});

// Security middleware
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): Promise<boolean> {
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
      return false;
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

    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow request if rate limiting fails
  }
}

// Input sanitization middleware
export function sanitizeRequestBody(body: any): any {
  if (typeof body === 'string') {
    return sanitizeInput(body);
  }
  
  if (typeof body === 'object' && body !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeRequestBody(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return body;
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// SQL injection prevention
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['"]/g, '') // Remove quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments start
    .replace(/\*\//g, ''); // Remove block comments end
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// CSRF token validation (for future implementation)
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Audit logging for security events
export async function logSecurityEvent(
  userId: string | null,
  event: string,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `SECURITY_${event}`,
        entity: 'Security',
        entityId: null,
        oldValues: null,
        newValues: details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Security logging error:', error);
  }
}
