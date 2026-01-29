/**
 * Sistema de logging estruturado com suporte a diferentes níveis
 * e ambientes (development/production)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log informativo (apenas em development)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log de warning (apenas em development)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Log de erro (sempre registrado)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    };

    console.error(this.formatMessage('error', message, errorContext));

    // Em produção, enviar para sistema de monitoramento (Sentry já configurado)
    if (this.isProduction && error instanceof Error) {
      // Sentry já captura erros automaticamente
      // Mas podemos adicionar contexto adicional
      if (typeof window === 'undefined' && global.Sentry) {
        global.Sentry.captureException(error, { extra: context });
      }
    }
  }

  /**
   * Log de debug (apenas em development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log de API request (útil para debugging)
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context);
  }

  /**
   * Log de API response
   */
  apiResponse(method: string, path: string, status: number, duration?: number): void {
    const context = duration ? { duration: `${duration}ms` } : undefined;
    this.info(`API ${method} ${path} - ${status}`, context);
  }
}

// Exportar instância singleton
export const logger = new Logger();

// Declare global Sentry type
declare global {
  var Sentry: any;
}
