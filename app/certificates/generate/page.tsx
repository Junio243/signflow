'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  User,
  Building2,
  GraduationCap,
  Scale,
  Briefcase,
  Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useProfiles } from '@/hooks/useProfiles'
import { 
  PROFILE_TYPE_OPTIONS, 
  VALIDITY_OPTIONS, 
  KEY_STRENGTH_OPTIONS,
  type ProfileType,
  type KeyStrength 
} from '@/types/certificates'

const PROFILE_ICONS = {
  professional: Briefcase,
  personal: User,
  student: GraduationCap,
  legal_representative: Scale,
  corporate: Building2,
}

export default function GenerateCertificatePage() {
  const router = useRouter()
  const { profiles, loading: loadingProfiles, createProfile, refetch } = useProfiles()
  
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1: Perfil
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [newProfile, setNewProfile] = useState({
    profile_name: '',
    profile_type: 'personal' as ProfileType,
    cpf_cnpj: '',
    organization: '',
    registration_number: '',
  })
  
  // Step 2: Dados do Certificado
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [certificateName, setCertificateName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keyStrength, setKeyStrength] = useState<KeyStrength>(2048)
  const [validityYears, setValidityYears] = useState(5)
  
  // Dados customizados do titular
  const [commonName, setCommonName] = useState('')
  const [locality, setLocality] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!feedback && !error) return
    const timeout = setTimeout(() => {
      setFeedback(null)
      setError(null)
    }, 6000)
    return () => clearTimeout(timeout)
  }, [feedback, error])

  const checkAuth = async () => {
    if (!supabase) {
      setError('Serviço de autenticação indisponível')
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      router.push('/login?next=/certificates/generate')
      return
    }

    setIsLogged(true)
    setLoading(false)
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingProfile(true)
    setError(null)

    try {
      await createProfile({
        profile_name: newProfile.profile_name,
        profile_type: newProfile.profile_type,
        cpf_cnpj: newProfile.cpf_cnpj || undefined,
        organization: newProfile.organization || undefined,
        registration_number: newProfile.registration_number || undefined,
        is_default: profiles.length === 0,
      })

      setFeedback('✅ Perfil criado com sucesso!')
      setShowCreateProfile(false)
      setNewProfile({
        profile_name: '',
        profile_type: 'personal',
        cpf_cnpj: '',
        organization: '',
        registration_number: '',
      })
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar perfil')
    } finally {
      setCreatingProfile(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFeedback(null)

    if (!selectedProfileId) {
      setError('Selecione um perfil')
      return
    }

    if (!certificateName.trim()) {
      setError('Informe um nome para o certificado')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!supabase) {
      setError('Supabase não configurado')
      return
    }

    setGenerating(true)

    try {
      // Pegar token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada')
      }

      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profile_id: selectedProfileId,
          certificate_name: certificateName.trim(),
          password,
          key_strength: keyStrength,
          validity_years: validityYears,
          subject_data: {
            commonName: commonName || undefined,
            locality: locality || undefined,
            state: state || undefined,
            country: 'BR',
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar certificado')
      }

      setFeedback('✅ Certificado gerado com sucesso! Redirecionando...')
      
      setTimeout(() => {
        router.push('/certificates')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar certificado')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!isLogged) return null

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-2.5">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Gerar Certificado</h1>
              <p className="text-sm text-slate-500">Crie um certificado digital auto-assinado</p>
            </div>
          </div>
        </div>
        <Link
          href="/certificates"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      {/* Feedback/Error */}
      {feedback && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{feedback}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Etapa 1: Selecionar Perfil */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">1. Selecione o Perfil</h2>
          <button
            type="button"
            onClick={() => setShowCreateProfile(!showCreateProfile)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {showCreateProfile ? 'Cancelar' : '+ Criar Novo Perfil'}
          </button>
        </div>

        {showCreateProfile ? (
          <form onSubmit={handleCreateProfile} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome do Perfil *
                </label>
                <input
                  type="text"
                  value={newProfile.profile_name}
                  onChange={(e) => setNewProfile({ ...newProfile, profile_name: e.target.value })}
                  placeholder="Ex: Dr. João Silva - CRM 12345"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Tipo *</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PROFILE_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={[
                        'flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition',
                        newProfile.profile_type === opt.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="profile_type"
                        value={opt.value}
                        checked={newProfile.profile_type === opt.value}
                        onChange={(e) => setNewProfile({ ...newProfile, profile_type: e.target.value as ProfileType })}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{opt.icon} {opt.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">CPF/CNPJ</label>
                <input
                  type="text"
                  value={newProfile.cpf_cnpj}
                  onChange={(e) => setNewProfile({ ...newProfile, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nº Registro (CRM, OAB, etc.)</label>
                <input
                  type="text"
                  value={newProfile.registration_number}
                  onChange={(e) => setNewProfile({ ...newProfile, registration_number: e.target.value })}
                  placeholder="CRM/SP 12345"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Organização</label>
                <input
                  type="text"
                  value={newProfile.organization}
                  onChange={(e) => setNewProfile({ ...newProfile, organization: e.target.value })}
                  placeholder="Hospital São Lucas"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {creatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {creatingProfile ? 'Criando...' : 'Criar Perfil'}
            </button>
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {loadingProfiles ? (
              <p className="text-sm text-slate-500">Carregando perfis...</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum perfil criado. Clique em "+ Criar Novo Perfil"</p>
            ) : (
              profiles.map((profile) => {
                const Icon = PROFILE_ICONS[profile.profile_type] || User
                return (
                  <label
                    key={profile.id}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                      selectedProfileId === profile.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={profile.id}
                      checked={selectedProfileId === profile.id}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{profile.profile_name}</p>
                          <p className="text-xs text-slate-500">
                            {PROFILE_TYPE_OPTIONS.find(o => o.value === profile.profile_type)?.label}
                          </p>
                          {profile.organization && (
                            <p className="text-xs text-slate-400">{profile.organization}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* Etapa 2: Dados do Certificado */}
      <form onSubmit={handleGenerate}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">2. Dados do Certificado</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nome do Certificado *</label>
              <input
                type="text"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                placeholder="Ex: Certificado Dr. João Silva 2026"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Senha *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirmar Senha *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Força da Chave</label>
                <select
                  value={keyStrength}
                  onChange={(e) => setKeyStrength(Number(e.target.value) as KeyStrength)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                >
                  {KEY_STRENGTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Validade</label>
                <select
                  value={validityYears}
                  onChange={(e) => setValidityYears(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                >
                  {VALIDITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-medium text-slate-700">Dados Opcionais do Titular</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Cidade"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Estado (SP, RJ, etc.)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Certificado Auto-Assinado</p>
              <p className="text-xs text-amber-700">
                Este certificado será criado internamente e funcionará para assinaturas dentro da plataforma.
                Para validade legal externa, considere usar um certificado ICP-Brasil.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={generating || !selectedProfileId}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
