'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useMultiStep } from '@/hooks/useMultiStep'
import MultiStepContainer from '@/components/multi-step/MultiStepContainer'
import ProgressBar from '@/components/multi-step/ProgressBar'
import DocumentStep from '@/components/multi-step/steps/DocumentStep'
import SignatureStep from '@/components/multi-step/steps/SignatureStep'
import ProfileStep from '@/components/multi-step/steps/ProfileStep'
import SignatoriesStep from '@/components/multi-step/steps/SignatoriesStep'
import QRConfigStep from '@/components/multi-step/steps/QRConfigStep'
import ReviewStep from '@/components/multi-step/steps/ReviewStep'
import ResultStep from '@/components/multi-step/steps/ResultStep'

const STEPS = [
  'Documento',
  'Assinatura',
  'Perfil',
  'Signatários',
  'QR Code',
  'Revisão',
  'Resultado'
]

interface DocumentData {
  document?: { file: File; url: string }
  signature?: { data: string; type: 'draw' | 'text' | 'upload' }
  profile?: { type: 'personal' | 'professional' | 'institutional'; data: any }
  signatories?: { list: any[]; order: 'sequential' | 'parallel' }
  qrConfig?: {
    certificate: {
      issuer: string
      validFrom: Date
      validUntil: Date | null
      logoUrl?: string
    }
    qrCode: { position: string; size: string }
  }
}

export default function CreateDocumentPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const {
    currentStep,
    direction,
    formData,
    goToNextStep,
    goToPreviousStep,
    reset,
    hasSavedData
  } = useMultiStep<DocumentData>(7, 'document-creation')

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        router.push('/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || 'usuario@email.com')
    }

    checkAuth()

    // Ask to resume if there's saved data
    if (hasSavedData() && currentStep === 1) {
      const resume = confirm('Você tem um documento em andamento. Deseja continuar?')
      if (!resume) {
        reset()
      }
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Simulate document processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate result
      const documentId = `DOC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const validationUrl = `${window.location.origin}/validate/${documentId}`

      const resultData = {
        documentId,
        hash,
        validationUrl,
        fileName: formData.document?.file.name || 'documento.pdf'
      }

      setResult(resultData)
      goToNextStep({})

      // Clear saved data after successful submission
      setTimeout(() => reset(), 100)
    } catch (error) {
      console.error('Error submitting document:', error)
      alert('Erro ao processar documento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900">Processando documento...</p>
          <p className="text-sm text-gray-600 mt-2">Gerando QR Code e certificado digital</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Documento</h1>
          <p className="text-gray-600">Siga as etapas para criar e assinar seu documento</p>
        </div>

        {/* Progress Bar */}
        {currentStep < 7 && (
          <ProgressBar
            currentStep={currentStep}
            totalSteps={7}
            steps={STEPS}
          />
        )}

        {/* Steps */}
        <MultiStepContainer
          currentStep={currentStep}
          totalSteps={7}
          direction={direction}
        >
          {currentStep === 1 && (
            <DocumentStep
              onNext={(data) => goToNextStep({ document: data })}
              initialData={formData.document}
            />
          )}

          {currentStep === 2 && (
            <SignatureStep
              onNext={(data) => goToNextStep({ signature: data })}
              onBack={goToPreviousStep}
              initialData={formData.signature}
            />
          )}

          {currentStep === 3 && (
            <ProfileStep
              onNext={(data) => goToNextStep({ profile: data })}
              onBack={goToPreviousStep}
              initialData={formData.profile}
            />
          )}

          {currentStep === 4 && (
            <SignatoriesStep
              onNext={(data) => goToNextStep({ signatories: data })}
              onBack={goToPreviousStep}
              initialData={formData.signatories}
              currentUserEmail={userEmail}
            />
          )}

          {currentStep === 5 && (
            <QRConfigStep
              onNext={(data) => goToNextStep({ qrConfig: data })}
              onBack={goToPreviousStep}
              initialData={formData.qrConfig}
            />
          )}

          {currentStep === 6 && (
            <ReviewStep
              data={formData as any}
              onBack={goToPreviousStep}
              onSubmit={handleSubmit}
            />
          )}

          {currentStep === 7 && result && (
            <ResultStep result={result} />
          )}
        </MultiStepContainer>
      </div>
    </div>
  )
}
