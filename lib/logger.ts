// lib/logger.ts
/**
 * Sistema Centralizado de Logging para SignFlow
 * 
 * Prove logging estruturado e controlado por ambiente:
 * - Desenvolvimento: Logs detalhados no console
 * - Produção: Logs críticos com integração opcional (Sentry, etc)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error | string;
  stack?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Formata um log entry em JSON estruturado
 */
function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, context, error, stack } = entry;
  
  const logObject: any = {
    timestamp,
    level: level.toUpperCase(),
    message,
  };

  if (context) {
    logObject.context = context;
  }

  if (error) {
    if (error instanceof Error) {
      logObject.error = {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      };
    } else {
      logObject.error = error;
    }
  }

  if (stack && isDevelopment) {
    logObject.stack = stack;
  }

  return JSON.stringify(logObject);
}

/**
 * Envia log para serviço externo (Sentry, LogRocket, etc)
 */
async function sendToExternalService(entry: LogEntry): Promise<void> {
  // TODO: Integrar com Sentry ou serviço similar
  // if (process.env.SENTRY_DSN && entry.level === 'error') {
  //   Sentry.captureException(entry.error);
  // }
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error | string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error,
    stack: error instanceof Error ? error.stack : undefined,
  };

  const formattedLog = formatLog(entry);

  // Console output baseado no nível
  switch (level) {
    case 'debug':
      if (isDevelopment) {
        console.debug(formattedLog);
      }
      break;
    case 'info':
      if (isDevelopment) {
        console.info(formattedLog);
      }
      break;
    case 'warn':
      console.warn(formattedLog);
      break;
    case 'error':
    case 'critical':
      console.error(formattedLog);
      if (isProduction) {
        sendToExternalService(entry).catch(console.error);
      }
      break;
  }
}

/**
 * Biblioteca de Logging Exportada
 */
export const logger = {
  /**
   * Debug: apenas em desenvolvimento
   */
  debug(message: string, context?: Record<string, any>): void {
    log('debug', message, context);
  },

  /**
   * Info: logs informativos (apenas desenvolvimento)
   */
  info(message: string, context?: Record<string, any>): void {
    log('info', message, context);
  },

  /**
   * Warn: avisos (todos ambientes)
   */
  warn(message: string, context?: Record<string, any>): void {
    log('warn', message, context);
  },

  /**
   * Error: erros recuperáveis (todos ambientes)
   */
  error(message: string, error?: Error | string, context?: Record<string, any>): void {
    log('error', message, context, error);
  },

  /**
   * Critical: erros críticos (todos ambientes + alertas)
   */
  critical(message: string, error?: Error | string, context?: Record<string, any>): void {
    log('critical', message, context, error);
  },

  /**
   * Helper: log de requisição HTTP
   */
  request(method: string, path: string, statusCode: number, duration?: number, context?: Record<string, any>): void {
    const enrichedContext = {
      ...context,
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    };
    log('info', `HTTP ${method} ${path} - ${statusCode}`, enrichedContext);
  },

  /**
   * Helper: log de operação no banco de dados
   */
  database(operation: string, table: string, success: boolean, error?: Error | string, context?: Record<string, any>): void {
    const enrichedContext = {
      ...context,
      operation,
      table,
      success,
    };
    
    if (success) {
      log('info', `DB ${operation} on ${table} - SUCCESS`, enrichedContext);
    } else {
      log('error', `DB ${operation} on ${table} - FAILED`, enrichedContext, error);
    }
  },
};

/**
 * Helper para erros genéricos que não devem expor detalhes ao usuário
 */
export function sanitizeErrorForClient(error: any): string {
  if (isDevelopment) {
    return error?.message || String(error);
  }
  
  // Em produção, retornar mensagem genérica
  return 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
}

export default logger;
