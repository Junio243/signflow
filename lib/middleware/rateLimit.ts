/**
 * Rate Limiting Middleware — SignFlow
 *
 * Protege endpoints da API contra abuso, força bruta e DDoS.
 * Usa cache em memória com limpeza automática (serverless-friendly).
 *
 * Limites pré-configurados por tipo de endpoint:
 * - AUTH (login/signup): 10 req / 15 min por IP
 * - UPLOAD: 10 req / hora por IP
 * - SIGN: 30 req / hora por IP
 * - API geral: 100 req / 15 min por IP
 */

import { NextRequest, NextResponse } from 'next/server';

export type RateLimitResult =
  | { allowed: true; headers: Record<string, string> }
  | { allowed: false; response: NextResponse };

export type RateLimitConfig = {
  /** Máximo de requisições na janela de tempo */
  maxRequests: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
  /** Mensagem customizada ao exceder o limite */
  message?: string;
  /** Identificar por IP + userId (true) ou só IP (false, padrão) */
  perUser?: boolean;
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Store em memória: key = "endpoint:identifier"
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

// ─────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) rateLimitStore.delete(key);
  }
}

/**
 * Extrai o IP real do cliente considerando proxies (Vercel/Cloudflare).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '0.0.0.0';
}

function logViolation(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig
) {
  console.warn(
    JSON.stringify({
      event: 'rate_limit_exceeded',
      timestamp: new Date().toISOString(),
      endpoint,
      identifier,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
    })
  );
}

// ─────────────────────────────────────────────────────────────────
// Factory principal
// ─────────────────────────────────────────────────────────────────

/**
 * Cria um middleware de rate limiting para um endpoint.
 *
 * @param endpoint  Identificador único do endpoint (ex: '/api/upload')
 * @param config    Configuração de limites
 * @returns Função middleware que retorna RateLimitResult
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter('/api/upload', { maxRequests: 10, windowMs: 3600_000 });
 *
 * export async function POST(req: NextRequest) {
 *   const rl = await limiter(req);
 *   if (!rl.allowed) return rl.response;
 *   // ...
 *   return addRateLimitHeaders(NextResponse.json({ ok: true }), rl.headers);
 * }
 * ```
 */
export function createRateLimiter(endpoint: string, config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<RateLimitResult> {
    const ip = getClientIp(req);
    const key = `${endpoint}:${ip}`;
    const now = Date.now();

    // Limpeza a cada 5 minutos
    if (now - lastCleanup > 5 * 60 * 1000) {
      cleanupExpiredEntries();
      lastCleanup = now;
    }

    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + config.windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
    };

    if (entry.count > config.maxRequests) {
      logViolation(endpoint, ip, config);

      const windowMin = Math.ceil(config.windowMs / 60_000);
      const message =
        config.message ??
        `Muitas tentativas. Limite: ${config.maxRequests} requisições a cada ${windowMin} minuto(s). Tente novamente em ${resetInSeconds}s.`;

      return {
        allowed: false,
        response: NextResponse.json(
          { error: message, retryAfter: resetInSeconds },
          {
            status: 429,
            headers: { ...headers, 'Retry-After': resetInSeconds.toString() },
          }
        ),
      };
    }

    return { allowed: true, headers };
  };
}

/**
 * Adiciona headers de rate limit à resposta.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// ─────────────────────────────────────────────────────────────────
// Limitadores pré-configurados (prontos para usar)
// ─────────────────────────────────────────────────────────────────

/**
 * Rate limiter para endpoints de autenticação (login / signup / reset-password).
 * Limite rigoroso: 10 tentativas a cada 15 minutos por IP.
 */
export const authRateLimiter = (endpoint: string) =>
  createRateLimiter(endpoint, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message:
      'Muitas tentativas de autenticação. Aguarde 15 minutos antes de tentar novamente.',
  });

/**
 * Rate limiter para upload de arquivos.
 * Limite: 10 uploads por hora por IP.
 */
export const uploadRateLimiter = (endpoint: string) =>
  createRateLimiter(endpoint, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Limite de upload excedido. Máximo de 10 uploads por hora.',
  });

/**
 * Rate limiter para endpoints de assinatura.
 * Limite: 30 assinaturas por hora por IP.
 */
export const signRateLimiter = (endpoint: string) =>
  createRateLimiter(endpoint, {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Limite de assinaturas excedido. Máximo de 30 assinaturas por hora.',
  });

/**
 * Rate limiter para APIs públicas de consulta.
 * Limite: 100 requisições a cada 15 minutos por IP.
 */
export const apiRateLimiter = (endpoint: string) =>
  createRateLimiter(endpoint, {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutos
  });
