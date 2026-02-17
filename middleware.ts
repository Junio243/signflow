import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))
}

function hasSupabaseSession(request: NextRequest): boolean {
  // Supabase armazena cookies com padrão: sb-<project-ref>-auth-token
  // Vamos procurar por qualquer cookie que siga esse padrão
  const cookies = request.cookies.getAll()
  
  // Debug: listar todos os cookies (apenas em dev)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] All cookies:', cookies.map(c => c.name))
  }
  
  // Procurar por cookies de auth do Supabase
  const hasAuthToken = cookies.some(cookie => {
    const name = cookie.name
    // Supabase usa padrões como:
    // - sb-<ref>-auth-token
    // - sb-<ref>-auth-token-code-verifier
    return (
      name.includes('sb-') && 
      name.includes('-auth-token') &&
      !name.includes('code-verifier') &&
      cookie.value &&
      cookie.value.length > 0
    )
  })
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Has Supabase auth token:', hasAuthToken)
  }
  
  return hasAuthToken
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Pathname:', pathname)
  }

  // 1. Verificar autenticação para rotas protegidas
  if (isProtectedRoute(pathname) || isProtectedApiRoute(pathname)) {
    const hasAuth = hasSupabaseSession(request)

    if (!hasAuth) {
      console.log('[Middleware] No auth, redirecting to login')
      
      // Se for API, retornar 401
      if (isProtectedApiRoute(pathname)) {
        return NextResponse.json(
          { 
            error: 'Por favor, faça login para acessar este recurso.',
            code: 'UNAUTHORIZED',
            redirectTo: '/login'
          },
          { status: 401 }
        )
      }

      // Se for página, redirecionar para login com parâmetro de retorno
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Auth OK, allowing access')
    }
  }

  // 2. Forçar HTTPS em produção
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const isHttpRequest = forwardedProto === 'http' || request.nextUrl.protocol === 'http:'
  const hostname = request.nextUrl.hostname

  if (isHttpRequest && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  // 3. Criar resposta com security headers
  const response = NextResponse.next()

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' 'unsafe-inline' data: blob: https: http:",
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

  // Previne clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Previne MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Ativa proteção XSS do browser
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Strict Transport Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Política de Referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
