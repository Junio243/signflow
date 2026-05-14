import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas que NÃO precisam de autenticação
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/validate',
  '/verify',
  '/about',
  '/faq',
  '/contato',
  '/contact',
  '/privacy',
  '/terms',
  '/status',
  '/docs',
  '/pricing',
  '/api/validate',
  '/api/webhooks',
  '/api/health',
]

// Rotas que EXIGEM autenticação
const PROTECTED_ROUTES = [
  '/dashboard',
  '/editor',
  '/create-document',
  '/profile',
  '/settings',
  '/security',
  '/appearance',
  '/history',
  '/orgs',
  '/certificates',
  '/sign',
]

// APIs que EXIGEM autenticação (gravação)
const PROTECTED_API_ROUTES = [
  '/api/documents/sign',
  '/api/upload',
  '/api/sign',
  '/api/batch-sign',
  '/api/cleanup',
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Forçar HTTPS em produção ANTES de qualquer outra verificação
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const isHttpRequest = forwardedProto === 'http' || request.nextUrl.protocol === 'http:'
  const hostname = request.nextUrl.hostname

  if (isHttpRequest && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  // 2. Verificar autenticação para rotas protegidas usando validação real do Supabase
  if (isProtectedRoute(pathname) || isProtectedApiRoute(pathname)) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Variáveis Supabase ausentes')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Criar response mutável para que o Supabase possa atualizar cookies
    const response = NextResponse.next()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // Validação real do token — não apenas presença do cookie
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Sessão inválida ou ausente, redirecionando para login')
      }

      if (isProtectedApiRoute(pathname)) {
        return NextResponse.json(
          {
            error: 'Por favor, faça login para acessar este recurso.',
            code: 'UNAUTHORIZED',
            redirectTo: '/login',
          },
          { status: 401 },
        )
      }

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Sessão válida — aplicar security headers e retornar
    applySecurityHeaders(response)
    return response
  }

  // 3. Rotas públicas — apenas security headers
  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
}

function applySecurityHeaders(response: NextResponse) {
  // Content Security Policy — sem unsafe-eval
  // Nonce seria ideal, mas requer integração com next/headers; esta config é segura para a maioria dos casos
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",  // unsafe-inline necessário para o theme-init inline no layout
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "connect-src 'self' data: blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
