import { NextResponse } from 'next/server';
import { checkDatabaseHealth, performanceMonitor, errorMonitor } from '@/lib/testing';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    const performance = performanceMonitor.getMetrics();
    const errors = errorMonitor.getErrorStats();

    const healthStatus = {
      status: dbHealth.isHealthy ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      performance: Object.keys(performance).length > 0 ? performance : 'No metrics yet',
      errors: errors.total > 0 ? errors : 'No errors',
      uptime: process.uptime(),
    };

    return NextResponse.json(healthStatus, {
      status: dbHealth.isHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
