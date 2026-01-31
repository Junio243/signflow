'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, MapPin, Shield, User, Briefcase } from 'lucide-react'

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-950/5">{children}</div>
      </div>
    </main>
  )
}

type FormData = {
  // Etapa 1 - Dados Pessoais
  fullName: string
  email: string
  phone: string
  cpf: string
  birthDate: string
  
  // Etapa 2 - Endereço
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  
  // Etapa 3 - Profissional (opcional)
  company: string
  position: string
  
  // Etapa 4 - Segurança
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

const INITIAL_DATA: FormData = {
  fullName: '',
  email: '',
  phone: '',
  cpf: '',
  birthDate: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  company: '',
  position: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

const STEPS = [
  { id: 1, name: 'Dados Pessoais', icon: User },
  { id: 2, name: 'Endereço', icon: MapPin },
  { id: 3, name: 'Profissional', icon: Briefcase },
  { id: 4, name: 'Segurança', icon: Shield },
]

export default function SignupPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

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

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateStep1 = (): string | null => {
    if (!formData.fullName.trim() || formData.fullName.trim().split(' ').length < 2) {
      return 'Por favor, informe seu nome completo (nome e sobrenome)'
    }
    if (!validateEmail(formData.email)) {
      return 'Por favor, informe um e-mail válido'
    }
    if (formData.phone.replace(/\D/g, '').length < 11) {
      return 'Por favor, informe um telefone válido com DDD'
    }
    if (!validateCPF(formData.cpf)) {
      return 'CPF inválido'
    }
    if (!formData.birthDate) {
      return 'Por favor, informe sua data de nascimento'
    }
    return null
  }

  const validateStep2 = (): string | null => {
    if (formData.cep.replace(/\D/g, '').length !== 8) {
      return 'CEP inválido'
    }
    if (!formData.street.trim()) {
      return 'Por favor, informe o endereço'
    }
    if (!formData.number.trim()) {
      return 'Por favor, informe o número'
    }
    if (!formData.neighborhood.trim()) {
      return 'Por favor, informe o bairro'
    }
    if (!formData.city.trim()) {
      return 'Por favor, informe a cidade'
    }
    if (!formData.state.trim()) {
      return 'Por favor, informe o estado'
    }
    return null
  }

  const validateStep3 = (): string | null => {
    // Etapa 3 é opcional
    return null
  }

  const validateStep4 = (): string | null => {
    if (formData.password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      return 'As senhas não coincidem'
    }
    if (!formData.acceptTerms) {
      return 'Você precisa aceitar os Termos de Uso'
    }
    return null
  }

  const validateCurrentStep = (): string | null => {
    switch (currentStep) {
      case 1: return validateStep1()
      case 2: return validateStep2()
      case 3: return validateStep3()
      case 4: return validateStep4()
      default: return null
    }
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
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleNext = () => {
    setError(null)
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setInfo(null)
    
    const validationError = validateStep4()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível.')
      setLoading(false)
      return
    }

    try {
      // Criar usuário
      const { data, error: signupError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // Criar perfil completo
      if (data.user) {
        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: formData.fullName.trim(),
            phone: formData.phone,
            cpf: formData.cpf.replace(/\D/g, ''),
            birth_date: formData.birthDate,
            cep: formData.cep.replace(/\D/g, ''),
            street: formData.street,
            number: formData.number,
            complement: formData.complement || null,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            company: formData.company || null,
            position: formData.position || null,
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }
      }

      setInfo('✅ Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.')
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (!supabaseClient) {
    return (
      <Wrapper>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cadastre-se</h1>
          <p className="text-sm text-slate-600">
            Serviço de autenticação indisponível. Configure as variáveis de ambiente.
          </p>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* Header */}
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Crie sua conta</h1>
          <p className="text-sm text-slate-600">Preencha seus dados para começar</p>
        </header>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    isCompleted ? 'border-emerald-600 bg-emerald-600 text-white' :
                    isActive ? 'border-brand-600 bg-brand-600 text-white' :
                    'border-slate-300 bg-white text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`hidden text-xs font-medium sm:block ${
                    isActive ? 'text-brand-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-brand-600 to-brand-700 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Forms */}
        <div className="min-h-[400px]">
          {/* Etapa 1 - Dados Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Nome Completo *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="João Silva Santos"
                  value={formData.fullName}
                  onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Telefone *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">
                    CPF *
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
                  Data de Nascimento *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Etapa 2 - Endereço */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label htmlFor="cep" className="block text-sm font-medium text-slate-700">
                  CEP *
                </label>
                <div className="relative">
                  <input
                    id="cep"
                    type="text"
                    required
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
                  Endereço *
                </label>
                <input
                  id="street"
                  type="text"
                  required
                  placeholder="Rua, Avenida, etc."
                  value={formData.street}
                  onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="number" className="block text-sm font-medium text-slate-700">
                    Número *
                  </label>
                  <input
                    id="number"
                    type="text"
                    required
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
                  Bairro *
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  required
                  placeholder="Centro"
                  value={formData.neighborhood}
                  onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                    Cidade *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                    Estado *
                  </label>
                  <input
                    id="state"
                    type="text"
                    required
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

          {/* Etapa 3 - Profissional */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-semibold">💡 Por que pedimos isso?</p>
                <p className="mt-1 text-blue-600">
                  Essas informações nos ajudam a personalizar sua experiência e oferecer recursos mais adequados ao seu perfil profissional.
                </p>
              </div>
            </div>
          )}

          {/* Etapa 4 - Segurança */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Senha *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirmar Senha *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={e => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                <label htmlFor="acceptTerms" className="text-sm text-slate-600">
                  Eu li e aceito os{' '}
                  <Link href="/terms" target="_blank" className="font-semibold text-brand-600 hover:text-brand-700">
                    Termos de Uso
                  </Link>
                  {' '}e a{' '}
                  <Link href="/privacy" target="_blank" className="font-semibold text-brand-600 hover:text-brand-700">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">🔒 Seus dados estão seguros</p>
                <p className="mt-1 text-emerald-600">
                  Utilizamos criptografia de ponta a ponta para proteger suas informações pessoais.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error/Info Messages */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Erro</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {info && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Sucesso</p>
              <p>{info}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando conta…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Criar conta
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Entre aqui
          </Link>
        </p>
      </div>
    </Wrapper>
  )
}
