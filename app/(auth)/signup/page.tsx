'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatErrorForDisplay } from '@/lib/errorMessages'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, User, Briefcase, Shield, Info } from 'lucide-react'

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
  // Etapa 1 - Dados Básicos (obrigatórios)
  fullName: string
  email: string
  phone: string
  
  // Etapa 2 - Dados Complementares (opcionais)
  cpf: string // OPCIONAL - será solicitado apenas para planos pagos
  birthDate: string
  company: string
  position: string
  
  // Etapa 3 - Segurança
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
  company: '',
  position: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

const STEPS = [
  { id: 1, name: 'Dados Básicos', icon: User },
  { id: 2, name: 'Complementares', icon: Briefcase },
  { id: 3, name: 'Segurança', icon: Shield },
]

export default function SignupPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
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
    return null
  }

  const validateStep2 = (): string | null => {
    // CPF é opcional, mas se preenchido deve ser válido
    if (formData.cpf && !validateCPF(formData.cpf)) {
      return 'CPF inválido. Deixe em branco se preferir preencher depois.'
    }
    return null
  }

  const validateStep3 = (): string | null => {
    if (formData.password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      return 'As senhas não coincidem'
    }
    if (!formData.acceptTerms) {
      return 'Você precisa aceitar os Termos de Uso e a Política de Privacidade'
    }
    return null
  }

  const validateCurrentStep = (): string | null => {
    switch (currentStep) {
      case 1: return validateStep1()
      case 2: return validateStep2()
      case 3: return validateStep3()
      default: return null
    }
  }

  const handleNext = () => {
    setError(null)
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }
    if (currentStep < 3) {
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
    
    const validationError = validateStep3()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    if (!supabaseClient) {
      setError('Serviço de autenticação indisponível. Por favor, tente novamente mais tarde.')
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
        setError(formatErrorForDisplay(signupError))
        setLoading(false)
        return
      }

      // Criar perfil completo (apenas campos preenchidos)
      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          full_name: formData.fullName.trim(),
          phone: formData.phone,
        }

        // Adicionar campos opcionais apenas se preenchidos
        if (formData.cpf) profileData.cpf = formData.cpf.replace(/\D/g, '')
        if (formData.birthDate) profileData.birth_date = formData.birthDate
        if (formData.company) profileData.company = formData.company
        if (formData.position) profileData.position = formData.position

        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          // Não bloquear cadastro por erro no perfil
        }
      }

      setInfo('✅ Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.')
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(formatErrorForDisplay(err))
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
            ⚠️ Serviço temporáriamente indisponível. Por favor, tente novamente em alguns minutos.
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Crie sua conta grátis
          </h1>
          <p className="text-sm text-slate-600">
            Comece a assinar documentos digitalmente em menos de 2 minutos
          </p>
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
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Forms */}
        <div className="min-h-[420px]">
          {/* Etapa 1 - Dados Básicos */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                  <div className="text-blue-700">
                    <p className="font-semibold">🚀 Cadastro simplificado</p>
                    <p className="mt-1 text-blue-600">
                      Precisamos apenas de informações básicas para começar. Dados adicionais podem ser preenchidos depois.
                    </p>
                  </div>
                </div>
              </div>

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
                <p className="text-xs text-slate-500">
                  Usado para identificar suas assinaturas digitais
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                />
                <p className="text-xs text-slate-500">
                  Para login e notificações de documentos
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Telefone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                  className="input"
                />
                <p className="text-xs text-slate-500">
                  Para contato e verificação de segurança
                </p>
              </div>
            </div>
          )}

          {/* Etapa 2 - Dados Complementares (OPCIONAIS) */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div className="text-amber-700">
                    <p className="font-semibold">✨ Campos opcionais</p>
                    <p className="mt-1 text-amber-600">
                      Estas informações ajudam a personalizar sua experiência, mas podem ser preenchidas depois nas configurações.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">
                  CPF <span className="text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                  className="input"
                />
                <p className="text-xs text-slate-500">
                  🔒 Necessário apenas para emitir certificados ICP-Brasil e planos pagos
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
                  Data de Nascimento <span className="text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  Empresa <span className="text-xs font-normal text-slate-500">(opcional)</span>
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
                  Cargo <span className="text-xs font-normal text-slate-500">(opcional)</span>
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

          {/* Etapa 3 - Segurança */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Senha *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={e => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                <label htmlFor="acceptTerms" className="text-sm text-slate-700">
                  Li e aceito os{' '}
                  <Link 
                    href="/terms" 
                    target="_blank" 
                    className="font-semibold text-brand-600 underline hover:text-brand-700"
                  >
                    Termos de Uso
                  </Link>
                  {' '}e a{' '}
                  <Link 
                    href="/privacy" 
                    target="_blank" 
                    className="font-semibold text-brand-600 underline hover:text-brand-700"
                  >
                    Política de Privacidade
                  </Link>
                  {' '}*
                </label>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div className="flex gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                  <div className="text-emerald-700">
                    <p className="font-semibold">🔒 Seus dados estão seguros</p>
                    <p className="mt-1 text-emerald-600">
                      Utilizamos criptografia de ponta para proteger suas informações. 
                      Seus dados pessoais nunca são compartilhados sem seu consentimento.
                    </p>
                    <Link 
                      href="/privacy" 
                      target="_blank"
                      className="mt-2 inline-block text-emerald-700 underline hover:text-emerald-800"
                    >
                      Leia nossa política completa →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error/Info Messages */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <div className="text-red-700">
              <p className="font-semibold">⚠️ Erro</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {info && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <div className="text-emerald-700">
              <p className="font-semibold">✅ Sucesso!</p>
              <p className="mt-1">{info}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          
          {currentStep < 3 ? (
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
                  Criar conta gratuita
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
