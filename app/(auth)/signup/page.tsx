'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!consentGiven) {
      setError('Para criar sua conta é necessário aceitar a Política de Privacidade e os Termos de Uso, em conformidade com a LGPD e a legislação do DF.')
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
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={e => setConsentGiven(e.target.checked)}
            required
          />
          <span>
            Estou ciente e concordo com a{' '}
            <a href="/privacy">Política de Privacidade</a> e com os{' '}
            <a href="/terms">Termos de Uso</a>, em conformidade com a Lei Geral de Proteção de Dados (LGPD) e a legislação vigente no Distrito Federal (DF).
          </span>
        </label>
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
