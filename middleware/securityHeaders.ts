// middleware/securityHeaders.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Headers Middleware
 * 
 * Implementa headers de segurança recomendados para aplicações web:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Content Security Policy
  // Restringe recursos que podem ser carregados
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live", // unsafe-inline necessário para Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  headers.set('Content-Security-Policy', cspDirectives);

  // Previne clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Previne MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Força HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Controla informações do referrer
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (limita APIs do navegador)
  const permissionsPolicy = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', ');
  headers.set('Permissions-Policy', permissionsPolicy);

  // Remove headers que revelam informações sensíveis
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return response;
}

/**
 * Middleware function para Next.js
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// Config do middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
