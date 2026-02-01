/**
 * Rate Limiting Middleware for SignFlow
 * 
 * Protects sensitive API endpoints against abuse, brute force, and DDoS attacks.
 * Uses in-memory cache with automatic cleanup.
 */

import { NextRequest, NextResponse } from 'next/server';

type RateLimitConfig = {
  /** Maximum number of requests allowed within the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom message for rate limit exceeded */
  message?: string;
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// In-memory store for rate limiting
// Key format: "endpoint:identifier"
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup expired entries from the rate limit store
 * This runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Extract client IP from request headers
 */
function getClientIp(req: NextRequest): string {
  // Try multiple headers in order of preference
  const ipHeader = 
    req.headers.get('x-forwarded-for') || 
    req.headers.get('x-real-ip') || 
    (req as any).ip;
  
  if (!ipHeader) {
    return '0.0.0.0';
  }
  
  // x-forwarded-for can be a comma-separated list
  const ip = (ipHeader as string).split(',')[0].trim();
  return ip || '0.0.0.0';
}

/**
 * Log rate limit violation
 */
function logRateLimitViolation(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig
) {
  const timestamp = new Date().toISOString();
  console.warn(
    JSON.stringify({
      event: 'rate_limit_exceeded',
      timestamp,
      endpoint,
      identifier,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
    })
  );
}

/**
 * Rate limit middleware factory
 * 
 * @param endpoint - Unique identifier for this endpoint (e.g., '/api/upload')
 * @param config - Rate limit configuration
 * @returns Middleware function that enforces rate limiting
 * 
 * @example
 * ```typescript
 * const rateLimiter = createRateLimiter('/api/upload', {
 *   maxRequests: 10,
 *   windowMs: 60 * 60 * 1000, // 1 hour
 * });
 * 
 * export async function POST(req: NextRequest) {
 *   const rateLimitResponse = await rateLimiter(req);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // ... your endpoint logic
 * }
 * ```
 */
export function createRateLimiter(
  endpoint: string,
  config: RateLimitConfig
) {
  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | null> {
    const identifier = getClientIp(req);
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }
    
    // Increment request count
    entry.count += 1;
    
    // Calculate remaining requests and time until reset
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
    
    // Prepare rate limit headers
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
    };
    
    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      logRateLimitViolation(endpoint, identifier, config);
      
      const message = config.message || 
        `Rate limit exceeded. Please try again in ${resetInSeconds} seconds.`;
      
      return NextResponse.json(
        { 
          error: message,
          retryAfter: resetInSeconds,
        },
        { 
          status: 429,
          headers: {
            ...headers,
            'Retry-After': resetInSeconds.toString(),
          },
        }
      );
    }
    
    // Rate limit not exceeded, add headers to the request for downstream use
    // Note: We can't directly add headers to the request, so we return null
    // and the calling code should add these headers to the response
    (req as any).rateLimitHeaders = headers;
    
    return null; // Continue to the actual handler
  };
}

/**
 * Helper to add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest
): NextResponse {
  const headers = (req as any).rateLimitHeaders;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });
  }
  return response;
}
