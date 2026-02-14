'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatErrorForDisplay } from '@/lib/errorMessages'

// Mover Wrapper para fora do componente principal
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-950/5">{children}</div>
      </div>
    </main>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/dashboard'
  
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loginComSenha = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Por favor, tente novamente mais tarde.')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabaseClient.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (authError) {
        console.error('Auth error:', authError)
        setError(formatErrorForDisplay(authError))
        return
      }

      if (data.session) {
        // Login bem-sucedido!
        console.log('Login successful, redirecting to:', redirectTo)
        
        // Pequeno delay para garantir que a sessão foi salva
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Forçar reload da página para atualizar autenticação
        window.location.href = redirectTo
      } else {
        setError('Login realizado, mas sessão não foi criada. Tente novamente.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(formatErrorForDisplay(err))
    } finally {
      // Garantir que loading seja resetado
      setTimeout(() => setLoading(false), 1000)
    }
  }

  const loginComLink = async () => {
    setError(null)
    setInfo(null)
    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Por favor, tente novamente mais tarde.')
      setLoading(false)
      return
    }

    if (!email || !email.includes('@')) {
      setError('Por favor, digite um e-mail válido.')
      setLoading(false)
      return
    }

    try {
      const { error: authError } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` 
        },
      })

      if (authError) {
        setError(formatErrorForDisplay(authError))
        return
      }

      setInfo('✅ Link de acesso enviado! Verifique sua caixa de entrada e spam. O link é válido por 1 hora.')
    } catch (err) {
      setError(formatErrorForDisplay(err))
    } finally {
      setLoading(false)
    }
  }

  if (!supabaseClient) {
    return (
      <Wrapper>
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
            <p className="text-sm text-slate-600">
              ⚠️ Serviço temporáriamente indisponível. Por favor, tente novamente em alguns minutos.
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Acesse sua conta
          </h1>
          <p className="text-sm text-slate-600">
            Entre para gerenciar seus documentos e acompanhar suas assinaturas.
          </p>
        </header>

        <form className="space-y-4" onSubmit={loginComSenha} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              disabled={loading}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={event => setPassword(event.target.value)}
              disabled={loading}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando…
              </>
            ) : (
              'Entrar com senha'
            )}
          </button>
        </form>

        <div className="space-y-3">
          <button
            type="button"
            onClick={loginComLink}
            disabled={loading || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando…' : '🚀 Receber link mágico por e-mail'}
          </button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm" role="alert" aria-live="assertive">
              <p className="font-semibold text-red-900">⚠️ Erro ao fazer login</p>
              <p className="mt-1 text-red-700">{error}</p>
            </div>
          )}

          {info && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm" role="status" aria-live="polite">
              <p className="font-semibold text-green-900">✅ E-mail enviado!</p>
              <p className="mt-1 text-green-700">{info}</p>
            </div>
          )}

          <p className="text-center text-sm text-slate-600">
            Não tem conta?{' '}
            <Link
              href="/signup"
              className="font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>

          <p className="text-center text-xs text-slate-500">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/terms" className="underline hover:text-slate-700">
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link href="/privacy" className="underline hover:text-slate-700">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </Wrapper>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Wrapper>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Carregando...</p>
        </div>
      </Wrapper>
    }>
      <LoginContent />
    </Suspense>
  )
}
