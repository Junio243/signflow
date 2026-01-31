'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-950/5">{children}</div>
      </div>
    </main>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)

    // Validações
    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível.')
      setLoading(false)
      return
    }

    try {
      // Criar usuário com metadata
      const { data, error: signupError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // Se o usuário foi criado com sucesso, criar perfil
      if (data.user) {
        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: fullName.trim(),
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          // Não bloqueia o cadastro, perfil será criado pelo trigger
        }
      }

      setInfo('✅ Cadastro realizado! Verifique seu e-mail para confirmar.')
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (!supabaseClient) {
    return (
      <Wrapper>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cadastre-se</h1>
          <p className="text-sm text-slate-600">
            Serviço de autenticação indisponível. Configure as variáveis de ambiente.
          </p>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Crie sua conta</h1>
          <p className="text-sm text-slate-600">Preencha seus dados para começar</p>
        </header>

        <form className="space-y-4" onSubmit={handleSignup} noValidate>
          {/* Nome Completo */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Nome Completo *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Seu nome completo"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail *
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
              onChange={e => setEmail(e.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirmar Senha *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '⏳ Criando conta…' : '🚀 Criar conta'}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">⚠️ Erro</p>
            <p>{error}</p>
          </div>
        )}

        {info && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <p className="font-semibold">✅ Sucesso</p>
            <p>{info}</p>
          </div>
        )}

        <p className="text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Entre aqui
          </Link>
        </p>
      </div>
    </Wrapper>
  )
}
