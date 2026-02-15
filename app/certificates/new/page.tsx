'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import CertificateTypeSelector from '@/components/certificates/CertificateTypeSelector'
import ECPFForm from '@/components/certificates/ECPFForm'
import ECNPJForm from '@/components/certificates/ECNPJForm'
import type { CertificateType, ECPFFormData, ECNPJFormData, CertificateFormData } from '@/types/certificate'
import { CERTIFICATE_VALIDITY_DAYS, isECPFFormData, isECNPJFormData } from '@/types/certificate'

type Step = 'type' | 'form' | 'review' | 'result'

export default function NewCertificatePage() {
  const router = useRouter()
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<Step>('type')
  const [certificateType, setCertificateType] = useState<CertificateType | null>(null)
  const [formData, setFormData] = useState<CertificateFormData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

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
      router.push('/login?next=/certificates/new')
      return
    }

    setIsLogged(true)
    setLoading(false)
  }

  const handleTypeSelect = (type: CertificateType) => {
    setCertificateType(type)
    setCurrentStep('form')
  }

  const handleFormSubmit = (data: CertificateFormData) => {
    setFormData(data)
    setCurrentStep('review')
  }

  const handleBackToForm = () => {
    setCurrentStep('form')
  }

  const handleBackToType = () => {
    setCurrentStep('type')
    setCertificateType(null)
    setFormData(null)
  }

  const handleGenerate = async () => {
    if (!formData || !certificateType || !supabase) return

    setGenerating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada')
      }

      // Prepare subject_data based on certificate type
      let subjectData: any = {}
      
      if (isECPFFormData(formData)) {
        subjectData = {
          type: 'e-CPF',
          fullName: formData.fullName,
          cpf: formData.cpf,
          rg: formData.rg,
          birthDate: formData.birthDate,
          email: formData.email,
          phone: formData.phone,
          mobile: formData.mobile,
          address: formData.address,
          profession: formData.profession,
          professionalRegistry: formData.professionalRegistry,
          council: formData.council,
        }
      } else if (isECNPJFormData(formData)) {
        subjectData = {
          type: 'e-CNPJ',
          companyName: formData.companyName,
          tradeName: formData.tradeName,
          cnpj: formData.cnpj,
          stateRegistration: formData.stateRegistration,
          municipalRegistration: formData.municipalRegistration,
          legalRepresentative: formData.legalRepresentative,
          address: formData.address,
          businessPhone: formData.businessPhone,
          businessEmail: formData.businessEmail,
        }
      }

      // Calculate validity in years
      const validityYears = formData.validity === '1year' ? 1 : formData.validity === '3years' ? 3 : 5
      
      // Call generation API
      const response = await fetch('/api/certificates/generate-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          certificate_type: certificateType,
          certificate_name: isECPFFormData(formData) 
            ? `e-CPF - ${formData.fullName}` 
            : `e-CNPJ - ${formData.companyName}`,
          password: formData.password,
          algorithm: formData.algorithm,
          validity_years: validityYears,
          subject_data: subjectData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar certificado')
      }

      setGeneratedCertId(result.certificate.id)
      setCurrentStep('result')
      setFeedback('✅ Certificado gerado com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar certificado')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadCertificate = async () => {
    if (!generatedCertId || !supabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada')
        return
      }

      const response = await fetch(`/api/certificates/${generatedCertId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao baixar certificado')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado_${certificateType}.p12`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setFeedback('✅ Certificado baixado com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar')
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-2.5">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Gerar Novo Certificado</h1>
            <p className="text-sm text-slate-500">
              Crie seu certificado digital {certificateType ? `${certificateType}` : 'auto-assinado'}
            </p>
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

      {/* Progress Steps */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          {[
            { id: 'type', label: 'Tipo', step: 1 },
            { id: 'form', label: 'Dados', step: 2 },
            { id: 'review', label: 'Revisar', step: 3 },
            { id: 'result', label: 'Concluído', step: 4 },
          ].map((item, index, array) => (
            <div key={item.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full font-semibold',
                    currentStep === item.id || (item.id === 'type' && currentStep !== 'type') || (item.id === 'form' && ['review', 'result'].includes(currentStep)) || (item.id === 'review' && currentStep === 'result')
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  {item.step}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600">{item.label}</p>
              </div>
              {index < array.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 bg-slate-200" />
              )}
            </div>
          ))}
        </div>
      </div>

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

      {/* Step Content */}
      {currentStep === 'type' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Escolha o Tipo de Certificado</h2>
          <CertificateTypeSelector
            selectedType={certificateType}
            onSelect={handleTypeSelect}
          />
        </section>
      )}

      {currentStep === 'form' && certificateType && (
        <>
          {certificateType === 'e-CPF' ? (
            <ECPFForm
              onSubmit={handleFormSubmit}
              onBack={handleBackToType}
              initialData={isECPFFormData(formData || {}) ? formData : undefined}
            />
          ) : (
            <ECNPJForm
              onSubmit={handleFormSubmit}
              onBack={handleBackToType}
              initialData={isECNPJFormData(formData || {}) ? formData : undefined}
            />
          )}
        </>
      )}

      {currentStep === 'review' && formData && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Revisar Dados</h2>
            
            <div className="space-y-4">
              {isECPFFormData(formData) && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Nome Completo</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">CPF</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.cpf}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">E-mail</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Telefone</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Endereço</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formData.address.street}, {formData.address.number}
                      {formData.address.complement && ` - ${formData.address.complement}`}
                      {' - '}{formData.address.neighborhood}, {formData.address.city}/{formData.address.state}
                      {' - CEP '}{formData.address.cep}
                    </p>
                  </div>
                  {formData.profession && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Profissão</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {formData.profession}
                        {formData.professionalRegistry && ` - ${formData.professionalRegistry}`}
                        {formData.council && ` (${formData.council})`}
                      </p>
                    </div>
                  )}
                </>
              )}

              {isECNPJFormData(formData) && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Razão Social</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">CNPJ</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.cnpj}</p>
                    </div>
                    {formData.tradeName && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Nome Fantasia</p>
                        <p className="mt-1 text-sm text-slate-900">{formData.tradeName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500">E-mail Comercial</p>
                      <p className="mt-1 text-sm text-slate-900">{formData.businessEmail}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Representante Legal</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formData.legalRepresentative.fullName} - {formData.legalRepresentative.cpf}
                      {' ('}{formData.legalRepresentative.role}{')'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Endereço</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formData.address.street}, {formData.address.number}
                      {formData.address.complement && ` - ${formData.address.complement}`}
                      {' - '}{formData.address.neighborhood}, {formData.address.city}/{formData.address.state}
                      {' - CEP '}{formData.address.cep}
                    </p>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-200 pt-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Validade</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formData.validity === '1year' ? '1 ano' : formData.validity === '3years' ? '3 anos' : '5 anos'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Algoritmo</p>
                  <p className="mt-1 text-sm text-slate-900">{formData.algorithm}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToForm}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Voltar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Certificado
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {currentStep === 'result' && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">Certificado Gerado com Sucesso!</h2>
          <p className="mb-6 text-sm text-emerald-700">
            Seu certificado digital foi criado e está pronto para uso.
          </p>
          
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleDownloadCertificate}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
            >
              <Download className="h-4 w-4" />
              Baixar Certificado (.p12)
            </button>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Ver Meus Certificados
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
            <p className="text-sm font-semibold text-blue-900">📋 Próximos Passos</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• Baixe o certificado .p12 e guarde em local seguro</li>
              <li>• Use o certificado para assinar documentos na plataforma</li>
              <li>• Importe o certificado em outros aplicativos se necessário</li>
              <li>• Mantenha sua senha em local seguro</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
