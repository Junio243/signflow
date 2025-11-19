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

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
