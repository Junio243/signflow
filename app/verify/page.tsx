'use client'

import { useState } from 'react'
import { ShieldCheck, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface VerificationResult {
  isValid: boolean
  isSigned: boolean
  signatureData?: {
    signerName: string
    signerEmail: string
    certificateIssuer: string
    timestamp: string
    signatureAlgorithm: string
    documentHash: string
  }
  error?: string
}

export default function VerifyPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setResult(null)
      setError(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  })

  const handleVerify = async () => {
    if (!selectedFile) return

    setVerifying(true)
    setError(null)
    setResult(null)

    try {
      // Converter para base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const response = await fetch('/api/verify/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_base64: fileBase64,
          document_name: selectedFile.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar documento')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar documento')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Verificar Assinatura</h1>
            <p className="text-sm text-slate-500">Valide a autenticidade de documentos assinados</p>
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

      {/* Upload */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={[
            'rounded-2xl border-2 border-dashed p-12 text-center transition cursor-pointer',
            isDragActive
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-6">
              <Upload className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900 mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
              </p>
              <p className="text-sm text-slate-500">
                Envie o documento assinado para verificar sua autenticidade
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setResult(null)
                setError(null)
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Remover
            </button>
          </div>

          {!result && !error && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Verificar Assinatura
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900 mb-1">Erro na Verificação</h3>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div
          className={[
            'rounded-2xl border p-6',
            result.isValid
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50',
          ].join(' ')}
        >
          <div className="flex items-start gap-3 mb-4">
            {result.isValid ? (
              <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <h3
                className={[
                  'text-lg font-semibold mb-1',
                  result.isValid ? 'text-emerald-900' : 'text-amber-900',
                ].join(' ')}
              >
                {result.isValid
                  ? '✅ Assinatura Válida'
                  : result.isSigned
                  ? '⚠️ Documento Assinado (verificação parcial)'
                  : '❌ Documento Não Assinado'}
              </h3>
              <p
                className={[
                  'text-sm',
                  result.isValid ? 'text-emerald-700' : 'text-amber-700',
                ].join(' ')}
              >
                {result.isValid
                  ? 'Este documento possui uma assinatura digital válida e não foi modificado.'
                  : result.isSigned
                  ? 'Este documento possui marca de assinatura, mas não foi possível validar completamente.'
                  : 'Este documento não contém assinatura digital.'}
              </p>
            </div>
          </div>

          {result.signatureData && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                Informações da Assinatura:
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Assinante:</span>
                  <p className="font-medium text-slate-900">{result.signatureData.signerName}</p>
                </div>

                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-medium text-slate-900">{result.signatureData.signerEmail}</p>
                </div>

                <div>
                  <span className="text-slate-500">Data/Hora:</span>
                  <p className="font-medium text-slate-900">
                    {format(
                      new Date(result.signatureData.timestamp),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500">Algoritmo:</span>
                  <p className="font-medium text-slate-900">
                    {result.signatureData.signatureAlgorithm}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500">Emissor do Certificado:</span>
                  <p className="font-medium text-slate-900">
                    {result.signatureData.certificateIssuer}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500">Hash do Documento:</span>
                  <p className="font-mono text-xs text-slate-900 break-all">
                    {result.signatureData.documentHash}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium mb-2">🛈 Como funciona a verificação?</p>
        <ul className="space-y-1 text-xs">
          <li>• Verifica se o documento contém assinatura visual do SignFlow</li>
          <li>• Valida o hash do documento contra a assinatura digital</li>
          <li>• Confirma que o documento não foi modificado após a assinatura</li>
          <li>• Exibe informações do certificado usado na assinatura</li>
        </ul>
      </div>
    </div>
  )
}
