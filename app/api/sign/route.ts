// app/api/sign/route.ts
// Re-exporta do handler principal com rate limiting aplicado
export { runtime } from './process/route';

import { NextRequest, NextResponse } from 'next/server';
import { signRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit';

// Importa o handler original
let _handler: ((req: NextRequest) => Promise<NextResponse>) | null = null;

async function getHandler() {
  if (!_handler) {
    const mod = await import('./process/route');
    _handler = mod.POST;
  }
  return _handler;
}

const limiter = signRateLimiter('/api/sign');

export async function POST(req: NextRequest) {
  const rl = await limiter(req);
  if (!rl.allowed) return rl.response;

  const handler = await getHandler();
  const response = await handler(req);
  return addRateLimitHeaders(response as NextResponse, rl.headers);
}
