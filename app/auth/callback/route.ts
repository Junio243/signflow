import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Se houver erro na autenticação
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  // Se não houver code, redirecionar para login
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  }

  try {
    if (!supabase) {
      throw new Error('Supabase client não configurado')
    }

    // Trocar o code por uma sessão
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Falha na autenticação. Tente novamente.')}`,
          requestUrl.origin
        )
      )
    }

    // Sucesso! Redirecionar para a página de destino
    return NextResponse.redirect(new URL(redirect, requestUrl.origin))
  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('Erro ao processar autenticação. Tente novamente.')}`,
        requestUrl.origin
      )
    )
  }
}
