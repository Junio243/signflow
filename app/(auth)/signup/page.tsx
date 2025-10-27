'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPasswordError(null)
    setConfirmPasswordError(null)

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

    // valida senha (mantendo a lógica existente:contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1})
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

    // prepara metadados
    const metadata = {
      full_name: trimmedName,
      ...(contactType === 'cpf' ? { cpf: digits } : { phone: digits })
    }

    // cria o usuário com metadata
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setInfo('Cadastro criado! Confirme seu e-mail (se obrigatório) e faça login.')
    setTimeout(() => router.replace('/login'), 1200)
  }

  return supabaseClient ? (
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
        <input
          type="email"
          placeholder="seu@email.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Crie uma senha"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {passwordError && <span style={{ color: 'red', fontSize: 12 }}>{passwordError}</span>}
        <input
          type="password"
          placeholder="Confirme sua senha"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        {confirmPasswordError && <span style={{ color: 'red', fontSize: 12 }}>{confirmPasswordError}</span>}
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
        {/* caixa de consentimento LGPD/Termos */}
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
            <a href="/terms">Termos de Uso</a>, em conformidade com a Lei Geral de Proteção de Dados (LGPD)
            e a legislação vigente no Distrito Federal (DF).
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
  ) : (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h1>Cadastrar</h1>
      <p>Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
    </div>
  )
}
