'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Mapeia mensagens de erro do Supabase para português
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado. Faça login para continuar.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Invalid email': 'Informe um e-mail válido.',
  'Email rate limit exceeded': 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.',
}

export default function SignUpPage() {
  const router = useRouter()
  const supabaseClient = supabase

  // campos principais
  const [fullName, setFullName] = useState('')
  const [contactType, setContactType] = useState<'cpf' | 'phone'>('cpf')
  const [contactValue, setContactValue] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // estados de interface
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)

  // formata CPF para 000.000.000‑00
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // formata telefone (ex.: (11) 91234-5678)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handleContactChange = (value: string) => {
    const formatted = contactType === 'cpf' ? formatCpf(value) : formatPhone(value)
    setContactValue(formatted)
  }

  // manipulador de envio
  const cadastrar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)

    // valida email
    if (!email.trim()) {
      setEmailError('Informe um e-mail.')
      return
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Informe um e-mail válido.')
      return
    }

    // valida senha mínima, força e confirmação
    if (!password) {
      setPasswordError('Crie uma senha.')
      return
    } else if (password.length < 8) {
      setPasswordError('Use ao menos 8 caracteres.')
      return
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError('A senha deve conter letras e números.')
      return
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.')
      return
    }

    // valida consentimento
    if (!consentGiven) {
      setError('Para criar sua conta é necessário aceitar a Política de Privacidade e os Termos de Uso, em conformidade com a LGPD e a legislação do DF.')
      return
    }

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    // valida nome
    const trimmedName = fullName.trim()
    if (trimmedName.length < 3) {
      setError('Informe seu nome completo.')
      return
    }

    // valida CPF/telefone
    const digits = contactValue.replace(/\D/g, '')
    if (contactType === 'cpf' && digits.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }
    if (contactType === 'phone' && (digits.length < 10 || digits.length > 11)) {
      setError('Informe um telefone válido com DDD.')
      return
    }

    setLoading(true)
    const metadata = {
      full_name: trimmedName,
      ...(contactType === 'cpf' ? { cpf: digits } : { phone: digits }),
    }

    const { error: supaError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })

    setLoading(false)

    if (supaError) {
      setError(SUPABASE_ERROR_MESSAGES[supaError.message] ?? supaError.message)
      return
    }

    setInfo('Cadastro criado! Confirme seu e-mail (se obrigatório) e faça login.')
    setTimeout(() => router.replace('/login'), 1200)
  }

  // Wrapper para layout com Tailwind
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-950/5">{children}</div>
      </div>
    </main>
  )

  if (!supabaseClient) {
    return (
      <Wrapper>
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cadastrar</h1>
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Crie sua conta</h1>
          <p className="text-sm text-slate-600">Cadastre-se para começar a enviar e gerenciar seus documentos com segurança.</p>
        </header>

        <form className="space-y-4" onSubmit={cadastrar} noValidate>
          {/* Nome completo */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Nome completo
            </label>
            <input
              id="fullName"
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
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-xs text-red-600">
                {emailError}
              </p>
            )}
            <p className="text-xs text-slate-500">Usaremos este endereço para confirmar seu cadastro.</p>
          </div>

          {/* Senha */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Crie uma senha segura"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(null)
              }}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error' : undefined}
            />
            {passwordError && (
              <p id="password-error" className="text-xs text-red-600">
                {passwordError}
              </p>
            )}
            <p className="text-xs text-slate-500">Mínimo de 8 caracteres, preferencialmente com letras e números.</p>
          </div>

          {/* Confirmação de senha */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirme a senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) setConfirmPasswordError(null)
              }}
              className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-invalid={Boolean(confirmPasswordError)}
              aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
            />
            {confirmPasswordError && (
              <p id="confirmPassword-error" className="text-xs text-red-600">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* Contato (CPF ou Telefone) */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-700">Contato</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contact-type"
                  value="cpf"
                  checked={contactType === 'cpf'}
                  onChange={() => {
                    setContactType('cpf')
                    setContactValue(prev => formatCpf(prev))
                  }}
                />
                <span className="text-sm">CPF</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contact-type"
                  value="phone"
                  checked={contactType === 'phone'}
                  onChange={() => {
                    setContactType('phone')
                    setContactValue(prev => formatPhone(prev))
                  }}
                />
                <span className="text-sm">Telefone com DDD</span>
              </label>
            </div>
            <input
              type="text"
              placeholder={contactType === 'cpf' ? '000.000.000-00' : '(11) 91234-5678'}
              required
              value={contactValue}
              onChange={e => handleContactChange(e.target.value)}
              className="input mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            />
          </div>

          {/* Consentimento LGPD/Termos */}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
              required
              className="mt-1"
            />
            <span className="text-slate-700">
              Estou ciente e concordo com a{' '}
              <Link href="/privacy" className="underline text-brand-600">
                Política de Privacidade
              </Link>{' '}
              e com os{' '}
              <Link href="/terms" className="underline text-brand-600">
                Termos de Uso
              </Link>
              , em conformidade com a Lei Geral de Proteção de Dados (LGPD) e a legislação vigente no Distrito Federal (DF).
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Cadastrando…' : 'Criar conta'}
          </button>
        </form>

        {/* Mensagens de erro ou informação */}
        <div className="space-y-3">
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
            Já tem conta?{' '}
            <Link
              href="/login"
              className="font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </Wrapper>
  )
}
