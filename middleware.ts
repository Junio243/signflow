import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const isHttpRequest = forwardedProto === 'http' || request.nextUrl.protocol === 'http:'
  const hostname = request.nextUrl.hostname

  if (isHttpRequest && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const url = request.nextUrl.clone()
    url.protocol = 'https'

    return NextResponse.redirect(url, 308)
  }

  // Criar a resposta
  const response = NextResponse.next()

  // Content Security Policy
  // Permite recursos próprios, dados inline necessários para Next.js e PDFs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requer unsafe-eval e unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Permite estilos inline usados na aplicação
    "img-src 'self' data: blob:", // Permite imagens de dados e blob (para preview de PDFs e uploads)
    "font-src 'self' data:", // Permite fontes locais e data URIs
    "object-src 'none'", // Bloqueia plugins como Flash
    "base-uri 'self'", // Restringe a tag <base>
    "form-action 'self'", // Permite envio de formulários apenas para mesma origem
    "frame-ancestors 'none'", // Equivalente ao X-Frame-Options DENY
    "upgrade-insecure-requests", // Atualiza requisições HTTP para HTTPS
    "connect-src 'self'", // Permite conexões apenas para mesma origem
    "media-src 'self' blob:", // Permite mídia de blob (para PDFs)
    "worker-src 'self' blob:", // Permite workers de blob (pdf.js)
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  // Previne clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Previne MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Ativa proteção XSS do browser (legado, mas mantido para compatibilidade)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Strict Transport Security (HSTS) - força HTTPS por 1 ano
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Política de Referrer - protege privacidade
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: '/:path*',
}
