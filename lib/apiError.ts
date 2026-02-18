/**
 * Respostas de erro padronizadas para todas as APIs — SignFlow
 *
 * Garante que todos os endpoints retornem JSON no mesmo formato:
 * { error: string, code: string, details?: any, requestId?: string }
 */

import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'FILE_INVALID'
  | 'FILE_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'CONFLICT';

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  details?: unknown;
  requestId?: string;
}

/** Mensagens amigáveis padrão por código */
const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED:        'Você precisa estar logado para acessar este recurso.',
  FORBIDDEN:           'Você não tem permissão para realizar esta ação.',
  NOT_FOUND:           'O recurso solicitado não foi encontrado.',
  VALIDATION_ERROR:    'Os dados enviados são inválidos. Verifique e tente novamente.',
  RATE_LIMITED:        'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  FILE_INVALID:        'O arquivo enviado é inválido ou está corrompido.',
  FILE_TOO_LARGE:      'O arquivo é muito grande. Verifique o tamanho máximo permitido.',
  INTERNAL_ERROR:      'Ocorreu um erro interno. Tente novamente em instantes.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente novamente em breve.',
  CONFLICT:            'Conflito ao processar a solicitação. Verifique e tente novamente.',
};

/** Mapeamento código → HTTP status */
const STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED:        401,
  FORBIDDEN:           403,
  NOT_FOUND:           404,
  VALIDATION_ERROR:    400,
  RATE_LIMITED:        429,
  FILE_INVALID:        400,
  FILE_TOO_LARGE:      413,
  INTERNAL_ERROR:      500,
  SERVICE_UNAVAILABLE: 503,
  CONFLICT:            409,
};

/**
 * Cria uma resposta de erro padronizada.
 *
 * @param code     Código semântico do erro
 * @param message  Mensagem customizada (usa padrão se omitida)
 * @param details  Detalhes extras (ex: erros de validação do Zod)
 * @param requestId ID da requisição para rastreamento
 */
export function apiError(
  code: ApiErrorCode,
  message?: string,
  details?: unknown,
  requestId?: string
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: message ?? DEFAULT_MESSAGES[code],
    code,
    ...(details !== undefined && { details }),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(body, { status: STATUS_MAP[code] });
}

/** Atalhos por tipo de erro (uso mais limpo no código) */
export const unauthorized = (msg?: string, reqId?: string) =>
  apiError('UNAUTHORIZED', msg, undefined, reqId);

export const forbidden = (msg?: string, reqId?: string) =>
  apiError('FORBIDDEN', msg, undefined, reqId);

export const notFound = (resource = 'Recurso', reqId?: string) =>
  apiError('NOT_FOUND', `${resource} não encontrado.`, undefined, reqId);

export const validationError = (details: unknown, msg?: string, reqId?: string) =>
  apiError('VALIDATION_ERROR', msg, details, reqId);

export const rateLimited = (retryAfter?: number, reqId?: string) =>
  apiError(
    'RATE_LIMITED',
    retryAfter
      ? `Muitas tentativas. Tente novamente em ${retryAfter} segundos.`
      : undefined,
    undefined,
    reqId
  );

export const fileInvalid = (msg: string, reqId?: string) =>
  apiError('FILE_INVALID', msg, undefined, reqId);

export const fileTooLarge = (maxMB: number, actualMB?: number, reqId?: string) =>
  apiError(
    'FILE_TOO_LARGE',
    actualMB
      ? `Arquivo muito grande (${actualMB.toFixed(1)}MB). Máximo permitido: ${maxMB}MB.`
      : `Arquivo muito grande. Máximo permitido: ${maxMB}MB.`,
    undefined,
    reqId
  );

export const internalError = (msg?: string, reqId?: string) =>
  apiError('INTERNAL_ERROR', msg, undefined, reqId);

export const serviceUnavailable = (service?: string, reqId?: string) =>
  apiError(
    'SERVICE_UNAVAILABLE',
    service ? `Serviço "${service}" temporariamente indisponível.` : undefined,
    undefined,
    reqId
  );

/**
 * Captura erros não tratados e retorna resposta padronizada.
 * Use em blocos catch de API routes.
 *
 * @example
 * ```ts
 * } catch (e) {
 *   return handleUnexpectedError(e, reqId);
 * }
 * ```
 */
export function handleUnexpectedError(
  error: unknown,
  requestId?: string
): NextResponse<ApiErrorBody> {
  const message =
    error instanceof Error ? error.message : String(error);

  // Não expor stack traces em produção
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(
    JSON.stringify({
      event: 'unhandled_api_error',
      timestamp: new Date().toISOString(),
      requestId,
      error: message,
      stack: !isProduction && error instanceof Error ? error.stack : undefined,
    })
  );

  return apiError(
    'INTERNAL_ERROR',
    isProduction ? undefined : message,
    undefined,
    requestId
  );
}
