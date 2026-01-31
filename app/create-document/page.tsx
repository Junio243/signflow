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
import ConfirmationStep from '@/components/multi-step/steps/ConfirmationStep'
import ResultStep from '@/components/multi-step/steps/ResultStep'

const STEPS = [
  'Documento',
  'Assinatura',
  'Perfil',
  'Signatários',
  'QR Code',
  'Revisão',
  'Confirmação',
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
    validation: {
      requireCode: boolean
      validationCode?: string
    }
    signaturePositions?: Array<{
      page: number
      nx: number
      ny: number
      x: number
      y: number
      scale: number
      rotation: number
      page_width: number
      page_height: number
    }>
  }
}

export default function CreateDocumentPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    currentStep,
    direction,
    formData,
    goToNextStep,
    goToPreviousStep,
    reset,
    hasSavedData
  } = useMultiStep<DocumentData>(8, 'document-creation')

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
    console.log('\n🚀 [FRONTEND] Starting document submission...')
    console.log('📦 [FRONTEND] Form data:', {
      hasDocument: !!formData.document,
      hasSignature: !!formData.signature,
      hasProfile: !!formData.profile,
      hasSignatories: !!formData.signatories,
      hasQRConfig: !!formData.qrConfig,
      positionsCount: formData.qrConfig?.signaturePositions?.length || 0
    })

    setLoading(true)
    setError('')

    try {
      // Create FormData
      const formDataToSend = new FormData()
      console.log('\n📝 [FRONTEND] Creating FormData...')

      // Add PDF file
      if (!formData.document?.file) {
        throw new Error('Documento não encontrado')
      }
      formDataToSend.append('pdf', formData.document.file)
      console.log('✅ [FRONTEND] PDF added:', formData.document.file.name)

      // Add signature
      if (formData.signature) {
        formDataToSend.append('signature', JSON.stringify(formData.signature))
        console.log('✅ [FRONTEND] Signature added')
      }

      // Add profile
      if (formData.profile) {
        formDataToSend.append('profile', JSON.stringify(formData.profile))
        console.log('✅ [FRONTEND] Profile added')
      }

      // Add signatories
      if (formData.signatories) {
        formDataToSend.append('signatories', JSON.stringify(formData.signatories.list))
        console.log('✅ [FRONTEND] Signatories added:', formData.signatories.list.length)
      }

      // Add certificate
      if (formData.qrConfig?.certificate) {
        formDataToSend.append('certificate', JSON.stringify(formData.qrConfig.certificate))
        console.log('✅ [FRONTEND] Certificate added')
      }

      // Add QR code config
      if (formData.qrConfig?.qrCode) {
        formDataToSend.append('qrCodeConfig', JSON.stringify(formData.qrConfig.qrCode))
        console.log('✅ [FRONTEND] QR config added')
      }

      // Add validation config
      if (formData.qrConfig?.validation) {
        formDataToSend.append('validation', JSON.stringify(formData.qrConfig.validation))
        console.log('✅ [FRONTEND] Validation config added')
      }

      // Add signature positions
      if (formData.qrConfig?.signaturePositions) {
        formDataToSend.append('positions', JSON.stringify(formData.qrConfig.signaturePositions))
        console.log('✅ [FRONTEND] Signature positions added:', formData.qrConfig.signaturePositions.length)
        console.log('📍 [FRONTEND] Positions:', formData.qrConfig.signaturePositions)
      } else {
        console.warn('⚠️ [FRONTEND] No signature positions found!')
      }

      // Call API
      console.log('\n🌐 [FRONTEND] Calling /api/documents/sign...')
      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        body: formDataToSend
      })

      console.log('📡 [FRONTEND] Response status:', response.status, response.statusText)

      // Try to parse response
      let data
      try {
        const text = await response.text()
        console.log('📄 [FRONTEND] Response text length:', text.length)
        console.log('📄 [FRONTEND] Response preview:', text.substring(0, 200))
        data = JSON.parse(text)
        console.log('✅ [FRONTEND] Response parsed:', data)
      } catch (parseError) {
        console.error('❌ [FRONTEND] Failed to parse response:', parseError)
        throw new Error('Resposta inválida do servidor')
      }

      if (!response.ok) {
        console.error('❌ [FRONTEND] API returned error status:', response.status)
        console.error('❌ [FRONTEND] Error data:', data)
        throw new Error(data.error || data.details || 'Erro ao processar documento')
      }

      if (!data.success) {
        console.error('❌ [FRONTEND] API returned success=false')
        console.error('❌ [FRONTEND] Error data:', data)
        throw new Error(data.error || 'Erro desconhecido')
      }

      console.log('\n✅✅✅ [FRONTEND] Document signed successfully!')
      console.log('📋 [FRONTEND] Result:', data.document)

      // Success!
      const resultData = {
        documentId: data.document.id,
        hash: data.document.hash,
        validationUrl: data.document.validationUrl,
        signedPdfUrl: data.document.signedPdfUrl,
        qrCodeUrl: data.document.qrCodeUrl,
        fileName: formData.document.file.name
      }

      console.log('🎉 [FRONTEND] Setting result and moving to step 8')
      setResult(resultData)
      goToNextStep({})

      // Clear saved data after successful submission
      setTimeout(() => {
        console.log('🧹 [FRONTEND] Clearing saved form data')
        reset()
      }, 100)
      
    } catch (err) {
      console.error('\n❌❌❌ [FRONTEND] ERROR SUBMITTING DOCUMENT')
      console.error('❌ [FRONTEND] Error object:', err)
      console.error('❌ [FRONTEND] Error stack:', err instanceof Error ? err.stack : 'No stack')
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao processar documento'
      setError(errorMessage)
      
      alert(`❌ ERRO AO ASSINAR DOCUMENTO\n\n${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`)
    } finally {
      setLoading(false)
      console.log('🏁 [FRONTEND] Submission process finished, loading:', false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900">📝 Processando documento...</p>
          <p className="text-sm text-gray-600 mt-2">🔐 Gerando hash SHA-256</p>
          <p className="text-sm text-gray-600">📱 Criando QR Code</p>
          <p className="text-sm text-gray-600">💾 Inserindo no PDF</p>
          <p className="text-sm text-gray-600">☁️ Salvando no Supabase</p>
          <p className="text-xs text-gray-400 mt-4">Verifique o console (F12) para logs detalhados</p>
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">
              <span className="font-semibold">⚠️ Erro:</span> {error}
            </p>
            <p className="text-xs text-red-700 mt-2">
              Abra o console do navegador (F12) para ver detalhes completos do erro.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {currentStep < 8 && (
          <ProgressBar
            currentStep={currentStep}
            totalSteps={8}
            steps={STEPS}
          />
        )}

        {/* Steps */}
        <MultiStepContainer
          currentStep={currentStep}
          totalSteps={8}
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
              pdfUrl={formData.document?.url}
              pdfFile={formData.document?.file}
              signatureData={formData.signature}
            />
          )}

          {currentStep === 6 && (
            <ReviewStep
              data={formData as any}
              onBack={goToPreviousStep}
              onSubmit={() => goToNextStep({})}
            />
          )}

          {currentStep === 7 && (
            <ConfirmationStep
              onNext={handleSubmit}
              onBack={goToPreviousStep}
              documentName={formData.document?.file.name}
            />
          )}

          {currentStep === 8 && result && (
            <ResultStep result={result} />
          )}
        </MultiStepContainer>
      </div>
    </div>
  )
}
