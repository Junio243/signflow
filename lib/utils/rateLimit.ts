import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Sistema de rate limiting simples baseado em memória
 * Para produção, considere usar Redis para rate limiting distribuído
 */
class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpar registros expirados a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.records.entries()) {
      if (now > record.resetAt) {
        this.records.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} expired records`);
    }
  }

  /**
   * Verifica se a requisição está dentro do limite
   * 
   * @param req - NextRequest
   * @param limit - Número máximo de requisições
   * @param windowMs - Janela de tempo em milissegundos
   * @returns Resultado da verificação
   */
  check(
    req: NextRequest,
    limit = 100,
    windowMs = 60000
  ): { allowed: boolean; retryAfter?: number } {
    const identifier = this.getIdentifier(req);
    const now = Date.now();
    const record = this.records.get(identifier);

    // Primeiro acesso ou janela expirada
    if (!record || now > record.resetAt) {
      this.records.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    // Limite excedido
    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      logger.warn('Rate limit exceeded', {
        identifier,
        count: record.count,
        limit,
        retryAfter,
      });
      return { allowed: false, retryAfter };
    }

    // Incrementar contador
    record.count++;
    return { allowed: true };
  }

  /**
   * Extrai identificador único da requisição (IP ou user ID)
   */
  private getIdentifier(req: NextRequest): string {
    // Tentar pegar IP real
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown';

    // Em produção, você pode querer usar user ID ao invés de IP
    // para usuários autenticados
    return ip;
  }

  /**
   * Reseta o limite para um identificador específico
   */
  reset(req: NextRequest): void {
    const identifier = this.getIdentifier(req);
    this.records.delete(identifier);
  }

  /**
   * Limpa todos os registros
   */
  clear(): void {
    this.records.clear();
  }
}

// Instância singleton
export const rateLimiter = new RateLimiter();

/**
 * Middleware helper para aplicar rate limiting
 */
export function withRateLimit(
  limit = 100,
  windowMs = 60000
) {
  return (req: NextRequest) => {
    const result = rateLimiter.check(req, limit, windowMs);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: result.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter || 60) * 1000).toISOString(),
          },
        }
      );
    }

    return null; // Permitido
  };
}
