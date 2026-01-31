'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building2, Phone, Save, ArrowLeft } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, loading, error, updateProfile } = useUserProfile()
  const [isLogged, setIsLogged] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Verificar autenticação
  useEffect(() => {
    if (!supabase) return

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data?.session ?? null
      setIsLogged(!!session)
      setUserEmail(session?.user?.email ?? null)

      if (!session) {
        router.push('/login?next=/profile')
      }
    }

    checkAuth()
  }, [])

  // Preencher formulário quando perfil carregar
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setCompanyName(profile.company_name || '')
      setCpfCnpj(profile.cpf_cnpj || '')
      setPhone(profile.phone || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  // Limpar feedback após 4 segundos
  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const updates = {
      full_name: fullName.trim() || null,
      company_name: companyName.trim() || null,
      cpf_cnpj: cpfCnpj.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    }

    const { error } = await updateProfile(updates)

    setSaving(false)

    if (error) {
      setFeedback(`❌ Erro ao salvar: ${error}`)
    } else {
      setFeedback('✅ Perfil atualizado com sucesso!')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">❌ Erro ao carregar perfil</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Meu Perfil</h1>
          <p className="mt-1 text-sm text-slate-600">Gerencie suas informações pessoais</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={[
          'rounded-lg border p-4 text-sm',
          feedback.includes('✅') 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        ].join(' ')}>
          {feedback}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Informações Básicas</h2>
          
          {/* Nome */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <User className="h-4 w-4" />
              Nome Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="input"
            />
          </div>

          {/* E-mail (somente leitura) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4" />
              E-mail
            </label>
            <input
              type="email"
              value={userEmail || ''}
              disabled
              className="input cursor-not-allowed bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500">O e-mail não pode ser alterado</p>
          </div>
        </div>

        {/* Informações Profissionais */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Informações Profissionais</h2>
          
          {/* Empresa */}
          <div className="space-y-2">
            <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4" />
              Empresa / Organização
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Nome da empresa (opcional)"
              className="input"
            />
          </div>

          {/* CPF/CNPJ */}
          <div className="space-y-2">
            <label htmlFor="cpfCnpj" className="text-sm font-medium text-slate-700">
              CPF / CNPJ
            </label>
            <input
              id="cpfCnpj"
              type="text"
              value={cpfCnpj}
              onChange={e => setCpfCnpj(e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="input"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone className="h-4 w-4" />
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="input"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-slate-700">
            Sobre você
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você... (opcional)"
            rows={4}
            className="input resize-none"
          />
        </div>

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  )
}
