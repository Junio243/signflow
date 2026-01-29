// lib/logger.ts

/**
 * Controlled logging system
 * - Development: logs to console
 * - Production: only errors to console (can be extended to Sentry)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

const isDevelopment = process.env.NODE_ENV === 'development';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  /**
   * Info messages - only in development
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Warning messages - only in development
   */
  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Error messages - always logged
   * In production, these should be sent to error tracking service (Sentry)
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };

    console.error(formatMessage('error', message, errorContext));

    // TODO: Send to Sentry in production
    // if (!isDevelopment && typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  },

  /**
   * Debug messages - only in development
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.debug(formatMessage('debug', message, context));
    }
  },
};

/**
 * API route logger with request context
 */
export function createApiLogger(route: string) {
  return {
    info: (message: string, context?: LogContext) => 
      logger.info(`[${route}] ${message}`, context),
    warn: (message: string, context?: LogContext) => 
      logger.warn(`[${route}] ${message}`, context),
    error: (message: string, error?: Error | unknown, context?: LogContext) => 
      logger.error(`[${route}] ${message}`, error, context),
    debug: (message: string, context?: LogContext) => 
      logger.debug(`[${route}] ${message}`, context),
  };
}
