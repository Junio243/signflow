'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [contactType, setContactType] = useState<'cpf' | 'phone'>('cpf')
  const [contactValue, setContactValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

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

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setInfo(null); setLoading(true)
    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    const trimmedName = fullName.trim()
    if (trimmedName.length < 3) {
      setError('Informe seu nome completo.')
      setLoading(false)
      return
    }

    const digits = contactValue.replace(/\D/g, '')
    if (contactType === 'cpf' && digits.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      setLoading(false)
      return
    }

    if (contactType === 'phone' && (digits.length < 10 || digits.length > 11)) {
      setError('Informe um telefone válido com DDD.')
      setLoading(false)
      return
    }

    const metadata = {
      full_name: trimmedName,
      ...(contactType === 'cpf' ? { cpf: digits } : { phone: digits })
    }

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
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
        <input
          type="text"
          placeholder="Nome completo"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
        <input type="email" placeholder="seu@email.com" required
               value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Crie uma senha" required
               value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            CPF
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            Telefone com DDD
          </label>
        </div>
        <input
          type="text"
          placeholder={contactType === 'cpf' ? '000.000.000-00' : '(11) 91234-5678'}
          required
          value={contactValue}
          onChange={e => handleContactChange(e.target.value)}
        />
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
