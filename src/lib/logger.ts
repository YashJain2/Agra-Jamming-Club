import { NextRequest } from 'next/server';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  static getInstance(logLevel?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(logLevel);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, userId, requestId, metadata, error } = entry;
    
    let logMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}]`;
    
    if (requestId) {
      logMessage += ` [${requestId}]`;
    }
    
    if (userId) {
      logMessage += ` [User: ${userId}]`;
    }
    
    logMessage += ` ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        logMessage += ` | Stack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedLog = this.formatLog(entry);
    
    // Write to console with appropriate level
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }

    // In production, you might want to send logs to external services
    // like DataDog, New Relic, or CloudWatch
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement external logging service integration here
    // Examples: DataDog, New Relic, CloudWatch, etc.
    try {
      // Example: Send to external API
      // await fetch(process.env.LOG_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  error(message: string, metadata?: Record<string, any>, error?: Error, userId?: string, requestId?: string): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      userId,
      requestId,
      metadata,
      error
    });
  }

  warn(message: string, metadata?: Record<string, any>, userId?: string, requestId?: string): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      userId,
      requestId,
      metadata
    });
  }

  info(message: string, metadata?: Record<string, any>, userId?: string, requestId?: string): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      userId,
      requestId,
      metadata
    });
  }

  debug(message: string, metadata?: Record<string, any>, userId?: string, requestId?: string): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      userId,
      requestId,
      metadata
    });
  }

  // Request-specific logging
  logRequest(request: NextRequest, userId?: string): string {
    const requestId = crypto.randomUUID();
    const metadata = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      referer: request.headers.get('referer')
    };

    this.info('Request received', metadata, userId, requestId);
    return requestId;
  }

  logResponse(requestId: string, statusCode: number, responseTime: number, userId?: string): void {
    this.info('Request completed', {
      statusCode,
      responseTime: `${responseTime}ms`
    }, userId, requestId);
  }
}

// Export singleton instance
export const logger = Logger.getInstance(
  process.env.LOG_LEVEL as LogLevel || LogLevel.INFO
);

// Request ID generator
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// Performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer ${label} was not started`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    logger.debug(`Timer ${label} completed`, { duration: `${duration}ms` });
    return duration;
  }

  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }
}
