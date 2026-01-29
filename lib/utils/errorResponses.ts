// lib/utils/errorResponses.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Standardized error responses for API routes
 * Provides consistent error format and logging
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Create a sanitized error response
 * Logs detailed error internally, returns safe message to client
 */
export function createErrorResponse(
  message: string,
  status: number,
  error?: Error | unknown,
  context?: Record<string, any>
): NextResponse {
  // Log detailed error server-side
  if (error) {
    logger.error(message, error, context);
  } else if (status >= 500) {
    logger.error(message, undefined, context);
  }

  // Return sanitized message to client
  return NextResponse.json(
    { error: message } as ApiError,
    { status }
  );
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: () => 
    NextResponse.json(
      { error: 'Não autorizado. Faça login para continuar.' },
      { status: 401 }
    ),

  forbidden: () => 
    NextResponse.json(
      { error: 'Acesso negado.' },
      { status: 403 }
    ),

  notFound: (resource = 'Recurso') => 
    NextResponse.json(
      { error: `${resource} não encontrado.` },
      { status: 404 }
    ),

  badRequest: (message = 'Requisição inválida.') => 
    NextResponse.json(
      { error: message },
      { status: 400 }
    ),

  conflict: (message = 'Conflito ao processar requisição.') => 
    NextResponse.json(
      { error: message },
      { status: 409 }
    ),

  tooManyRequests: (retryAfter?: number) => {
    const response = NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em breve.' },
      { status: 429 }
    );
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
    
    return response;
  },

  internalError: (error?: Error | unknown, context?: Record<string, any>) => 
    createErrorResponse(
      'Erro interno do servidor.',
      500,
      error,
      context
    ),

  serviceUnavailable: (service = 'Serviço') => 
    NextResponse.json(
      { error: `${service} temporariamente indisponível.` },
      { status: 503 }
    ),
};

/**
 * Create success response with consistent format
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse {
  return NextResponse.json(data, { status });
}
