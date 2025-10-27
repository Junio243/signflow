'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setInfo(null)
    setPasswordError(null); setConfirmPasswordError(null)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (password.length < 8) {
      setPasswordError('Use ao menos 8 caracteres.')
      return
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError('A senha deve conter letras e números.')
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabaseClient.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setInfo('Cadastro criado! Confirme seu e-mail (se obrigatório) e faça login.')
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
        <input type="email" placeholder="seu@email.com" required
               value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Crie uma senha" required
               value={password} onChange={e => setPassword(e.target.value)} />
        {passwordError && <span style={{ color: 'red', fontSize: 12 }}>{passwordError}</span>}
        <input type="password" placeholder="Confirme sua senha" required
               value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        {confirmPasswordError && <span style={{ color: 'red', fontSize: 12 }}>{confirmPasswordError}</span>}
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
