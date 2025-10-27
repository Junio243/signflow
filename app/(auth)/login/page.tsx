'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-950/5">{children}</div>
      </div>
    </main>
  )

  const loginComSenha = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.replace('/dashboard')
  }

  const loginComLink = async () => {
    setError(null)
    setInfo(null)
    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setInfo('Enviamos um link de acesso para o seu e-mail. Abra em até 10–60 minutos.')
  }

  if (!supabaseClient) {
    return (
      <Wrapper>
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
            <p className="text-sm text-slate-600">
              Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Acesse sua conta</h1>
          <p className="text-sm text-slate-600">Entre para gerenciar seus documentos e acompanhar seus envios.</p>
        </header>

        <form className="space-y-4" onSubmit={loginComSenha} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar com senha'}
          </button>
        </form>

        <div className="space-y-3">
          <button
            type="button"
            onClick={loginComLink}
            disabled={loading || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Receber link mágico por e-mail'}
          </button>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert" aria-live="assertive">
              Erro: {error}
            </p>
          )}

          {info && (
            <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700" role="status" aria-live="polite">
              {info}
            </p>
          )}

          <p className="text-center text-sm text-slate-600">
            Não tem conta?{' '}
            <Link
              href="/signup"
              className="font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </Wrapper>
  )
}
