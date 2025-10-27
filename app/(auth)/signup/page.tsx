'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado. Faça login para continuar.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Invalid email': 'Informe um e-mail válido.',
  'Email rate limit exceeded': 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.',
}

export default function SignUpPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validarFormulario = () => {
    let valido = true

    if (!email.trim()) {
      setEmailError('Informe um e-mail.')
      valido = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Informe um e-mail válido.')
      valido = false
    }

    if (!password) {
      setPasswordError('Crie uma senha.')
      valido = false
    } else if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.')
      valido = false
    }

    return valido
  }

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setEmailError(null)
    setPasswordError(null)

    if (!validarFormulario()) {
      return
    }

    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    const { error } = await supabaseClient.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(SUPABASE_ERROR_MESSAGES[error.message] ?? 'Não foi possível completar o cadastro. Tente novamente em instantes.')
      return
    }
    setInfo('Cadastro criado! Enviamos um e-mail de confirmação que pode levar alguns minutos para chegar.')
    setTimeout(() => router.replace('/login'), 1200)
  }

  if (!supabaseClient) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
        <h1>Cadastrar</h1>
        <p>Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h1>Cadastrar</h1>
      <form onSubmit={cadastrar} style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              if (emailError) setEmailError(null)
            }}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <span id="email-error" style={{ color: 'red', fontSize: 12 }}>
              {emailError}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <input
            type="password"
            placeholder="Crie uma senha"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError(null)
            }}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          {passwordError && (
            <span id="password-error" style={{ color: 'red', fontSize: 12 }}>
              {passwordError}
            </span>
          )}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Criar conta'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Já tem conta? <a href="/login">Entrar</a>
      </p>
      {error && <p style={{ color: 'red', marginTop: 12 }}>Erro: {error}</p>}
      {info && <p style={{ color: 'green', marginTop: 12 }}>{info}</p>}
    </div>
  )
}
