'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle, Briefcase, Check, Key, Loader2, MapPin, Save, User as UserIcon } from 'lucide-react'
import Link from 'next/link'

type ProfileData = {
  full_name: string
  phone: string
  cpf: string
  birth_date: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  company: string
  position: string
}

const INITIAL_DATA: ProfileData = {
  full_name: '',
  phone: '',
  cpf: '',
  birth_date: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  company: '',
  position: '',
}

const TABS = [
  { id: 'personal', name: 'Dados Pessoais', icon: UserIcon },
  { id: 'address', name: 'Endereço', icon: MapPin },
  { id: 'professional', name: 'Profissional', icon: Briefcase },
]

export default function ProfilePage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<ProfileData>(INITIAL_DATA)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Máscaras
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
  }

  // Validações
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(numbers.charAt(i)) * (10 - i)
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(numbers.charAt(i)) * (11 - i)
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(10))) return false
    
    return true
  }

  // Buscar CEP
  const fetchCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    } finally {
      setLoadingCep(false)
    }
  }

  // Carregar perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (!supabaseClient) {
        setError('Serviço de autenticação indisponível')
        setLoading(false)
        return
      }

      try {
        // Buscar usuário autenticado
        const { data: { user } } = await supabaseClient.auth.getUser()
        
        if (!user) {
          router.push('/login?next=/profile')
          return
        }

        setUserId(user.id)
        setUserEmail(user.email || null)

        // Buscar perfil
        const { data: profile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError)
          // Se não existe perfil, cria um básico
          if (profileError.code === 'PGRST116') {
            await supabaseClient
              .from('user_profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || 'Usuário',
              })
          }
        } else if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone ? maskPhone(profile.phone) : '',
            cpf: profile.cpf ? maskCPF(profile.cpf) : '',
            birth_date: profile.birth_date || '',
            cep: profile.cep ? maskCEP(profile.cep) : '',
            street: profile.street || '',
            number: profile.number || '',
            complement: profile.complement || '',
            neighborhood: profile.neighborhood || '',
            city: profile.city || '',
            state: profile.state || '',
            company: profile.company || '',
            position: profile.position || '',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabaseClient])

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    // Validações
    if (!formData.full_name.trim() || formData.full_name.trim().split(' ').length < 2) {
      setError('Por favor, informe seu nome completo (nome e sobrenome)')
      return
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      setError('CPF inválido')
      return
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 11) {
      setError('Telefone inválido')
      return
    }

    setSaving(true)

    try {
      if (!supabaseClient || !userId) {
        setError('Erro ao salvar: usuário não autenticado')
        return
      }

      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
          birth_date: formData.birth_date || null,
          cep: formData.cep ? formData.cep.replace(/\D/g, '') : null,
          street: formData.street || null,
          number: formData.number || null,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
          company: formData.company || null,
          position: formData.position || null,
        })
        .eq('id', userId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('✅ Perfil atualizado com sucesso!')
      
      // Limpar mensagem após 3s
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!supabaseClient) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h1 className="text-xl font-semibold">Perfil indisponível</h1>
          <p className="mt-2">Serviço de autenticação indisponível.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-slate-600">Carregando perfil…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Meu Perfil</h1>
          <p className="text-sm text-slate-600">
            {userEmail && `Logado como: ${userEmail}`}
          </p>
        </header>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setError(null)
                  }}
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition ${
                    isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Dados Pessoais */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Nome Completo *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="João Silva Santos"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail (não editável)
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={userEmail || ''}
                  className="input bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">Para alterar o e-mail, entre em contato com o suporte</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">
                    CPF
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
                  Data de Nascimento
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birth_date}
                  onChange={e => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  className="input"
                />
              </div>

              {/* Botão de alteração de senha */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Key className="mt-0.5 h-5 w-5 text-slate-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Alterar Senha</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Para alterar sua senha, acesse as configurações de segurança
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Configurações
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Endereço */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="cep" className="block text-sm font-medium text-slate-700">
                  CEP
                </label>
                <div className="relative">
                  <input
                    id="cep"
                    type="text"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={e => {
                      const masked = maskCEP(e.target.value)
                      setFormData(prev => ({ ...prev, cep: masked }))
                      if (masked.replace(/\D/g, '').length === 8) {
                        fetchCEP(masked)
                      }
                    }}
                    className="input"
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500">Digite o CEP para preencher automaticamente</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="street" className="block text-sm font-medium text-slate-700">
                  Endereço
                </label>
                <input
                  id="street"
                  type="text"
                  placeholder="Rua, Avenida, etc."
                  value={formData.street}
                  onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="number" className="block text-sm font-medium text-slate-700">
                    Número
                  </label>
                  <input
                    id="number"
                    type="text"
                    placeholder="123"
                    value={formData.number}
                    onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="complement" className="block text-sm font-medium text-slate-700">
                    Complemento
                  </label>
                  <input
                    id="complement"
                    type="text"
                    placeholder="Apt, Bloco, etc."
                    value={formData.complement}
                    onChange={e => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="neighborhood" className="block text-sm font-medium text-slate-700">
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  placeholder="Centro"
                  value={formData.neighborhood}
                  onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                    Cidade
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <input
                    id="state"
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Profissional */}
          {activeTab === 'professional' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Informações profissionais (opcional)</p>
              
              <div className="space-y-1">
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  Empresa
                </label>
                <input
                  id="company"
                  type="text"
                  placeholder="Nome da empresa"
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="position" className="block text-sm font-medium text-slate-700">
                  Cargo
                </label>
                <input
                  id="position"
                  type="text"
                  placeholder="Seu cargo na empresa"
                  value={formData.position}
                  onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mensagens */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Erro</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
