'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loginComSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setInfo(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/dashboard')
  }

  const loginComLink = async () => {
    setError(null); setInfo(null); setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setInfo('Enviamos um link de acesso para o seu e-mail. Abra em até 10–60 minutos.')
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h1>Entrar</h1>
      <form onSubmit={loginComSenha} style={{ display: 'grid', gap: 8 }}>
        <input
          type="email" placeholder="seu@email.com" required
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password" placeholder="Sua senha" required
          value={password} onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar com senha'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button onClick={loginComLink} disabled={loading || !email}>
          {loading ? 'Enviando...' : 'Receber link mágico por e-mail'}
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        Não tem conta? <a href="/signup">Cadastre-se</a>
      </p>

      {error && <p style={{ color: 'red', marginTop: 12 }}>Erro: {error}</p>}
      {info && <p style={{ color: 'green', marginTop: 12 }}>{info}</p>}
    </div>
  )
}
