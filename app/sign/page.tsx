'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { DocumentUpload } from '@/components/sign/DocumentUpload'
import { CertificateSelector } from '@/components/sign/CertificateSelector'
import type { Certificate } from '@/types/certificates'

export default function SignPage() {
  const router = useRouter()
  
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loadingCerts, setLoadingCerts] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isLogged) {
      fetchCertificates()
    }
  }, [isLogged])

  const checkAuth = async () => {
    if (!supabase) {
      setError('Serviço indisponível')
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      router.push('/login?next=/sign')
      return
    }

    setIsLogged(true)
    setLoading(false)
  }

  const fetchCertificates = async () => {
    if (!supabase) return

    try {
      console.log('🔍 Buscando certificados...')
      
      // Buscar TODOS os certificados (não só ativos)
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erro ao buscar:', fetchError)
        throw fetchError
      }

      console.log('✅ Certificados encontrados:', data?.length || 0)
      console.log('Dados:', data)

      // Filtrar apenas válidos (não expirados)
      const validCerts = (data || []).filter(cert => {
        const expiresAt = new Date(cert.expires_at)
        return expiresAt > new Date()
      })

      console.log('✅ Certificados válidos:', validCerts.length)
      setCertificates(validCerts as Certificate[])
    } catch (err) {
      console.error('❌ Erro ao buscar certificados:', err)
      setError('Erro ao carregar certificados: ' + (err instanceof Error ? err.message : 'Desconhecido'))
    } finally {
      setLoadingCerts(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const handleValidateCertificate = async () => {
    if (!selectedCertificateId || !certificatePassword) return

    setValidating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase!.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const response = await fetch('/api/sign/validate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          certificate_id: selectedCertificateId,
          password: certificatePassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao validar certificado')
      }

      if (result.valid) {
        setValidated(true)
        setFeedback('✅ Certificado validado com sucesso!')
      } else {
        throw new Error('Senha incorreta')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar certificado')
    } finally {
      setValidating(false)
    }
  }

  const handleSign = async () => {
    if (!selectedFile || !selectedCertificateId || !certificatePassword || !validated) {
      setError('Preencha todos os campos e valide o certificado')
      return
    }

    setSigning(true)
    setError(null)
    setFeedback(null)

    try {
      const { data: { session } } = await supabase!.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const response = await fetch('/api/sign/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          certificate_id: selectedCertificateId,
          certificate_password: certificatePassword,
          document_name: selectedFile.name,
          document_base64: fileBase64,
          signature_type: 'both',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar assinatura')
      }

      setSigned(true)
      setSignedDocumentUrl(result.signed_document_url)
      setFeedback('✅ Documento assinado com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao assinar documento')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!isLogged) return null

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-2.5">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Assinar Documento</h1>
            <p className="text-sm text-slate-500">Assine digitalmente seus documentos PDF</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">1. Selecione o Documento</h2>
        <DocumentUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={selectedFile}
          disabled={signing || signed}
        />
      </section>

      {selectedFile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">2. Selecione o Certificado</h2>
            {certificates.length === 0 && !loadingCerts && (
              <Link
                href="/certificates/generate"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                + Gerar Certificado
              </Link>
            )}
          </div>
          {loadingCerts ? (
            <p className="text-sm text-slate-500">Carregando certificados...</p>
          ) : (
            <CertificateSelector
              certificates={certificates}
              selectedCertificateId={selectedCertificateId}
              onCertificateSelect={setSelectedCertificateId}
              password={certificatePassword}
              onPasswordChange={setCertificatePassword}
              onValidate={handleValidateCertificate}
              validating={validating}
              validated={validated}
              disabled={signing || signed}
            />
          )}
        </section>
      )}

      {selectedFile && validated && !signed && (
        <div className="flex justify-end rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <button
            onClick={handleSign}
            disabled={signing}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-50"
          >
            {signing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Assinando...
              </>
            ) : (
              <>
                <PenTool className="h-5 w-5" />
                Assinar Documento
              </>
            )}
          </button>
        </div>
      )}

      {signed && signedDocumentUrl && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Documento Assinado!</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Seu documento foi assinado digitalmente com sucesso.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={signedDocumentUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Baixar Documento Assinado
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Assinar Outro Documento
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
