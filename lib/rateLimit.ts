// lib/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit?: number;      // Max requests per window (default: 10)
  windowMs?: number;   // Time window in milliseconds (default: 60000 = 1 minute)
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Rate limiting middleware for API routes
 * 
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimit = checkRateLimit(req, { limit: 5, windowMs: 60000 });
 *   if (!rateLimit.allowed) {
 *     return NextResponse.json(
 *       { error: 'Muitas requisições. Tente novamente em breve.' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'Retry-After': rateLimit.retryAfter?.toString() || '60',
 *           'X-RateLimit-Limit': rateLimit.limit.toString(),
 *           'X-RateLimit-Remaining': rateLimit.remaining.toString(),
 *           'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
 *         }
 *       }
 *     );
 *   }
 *   // ... rest of your code
 * }
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): RateLimitResult {
  const limit = config.limit || 10;
  const windowMs = config.windowMs || 60000; // 1 minute default
  
  // Generate unique key for this client
  const key = config.keyGenerator
    ? config.keyGenerator(req)
    : getClientKey(req);

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No record or expired - create new
  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  // Limit exceeded
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  // Increment counter
  record.count++;
  
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Generate client identifier from request
 */
function getClientKey(req: NextRequest): string {
  // Try to get real IP (considering proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'unknown';
  
  // Include user agent for additional uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return response;
}
