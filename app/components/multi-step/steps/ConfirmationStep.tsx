'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Lock, Shield, FileCheck, AlertCircle } from 'lucide-react'

interface ConfirmationStepProps {
  onNext: () => void
  onBack: () => void
  documentName?: string
}

export default function ConfirmationStep({ onNext, onBack, documentName }: ConfirmationStepProps) {
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [understandChecked, setUnderstandChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!confirmChecked) {
      setError('Você precisa confirmar que revisou todos os dados')
      return
    }

    if (!understandChecked) {
      setError('Você precisa confirmar que entende a irrevogabilidade da assinatura')
      return
    }

    if (!password || password.length < 6) {
      setError('Por favor, digite sua senha para confirmar a assinatura')
      return
    }

    // Proceed to signing
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <Shield className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirmação de Assinatura
        </h2>
        <p className="text-gray-600">
          Última etapa antes de assinar o documento
        </p>
      </div>

      {/* Warning Box */}
      <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              ⚠️ Atenção: Assinatura Digital Irrevogável
            </h3>
            <p className="text-sm text-amber-800">
              Ao assinar este documento, você está criando uma <strong>assinatura digital criptográfica</strong> que é <strong>irreversível</strong>. 
              A assinatura terá <strong>validade jurídica</strong> e não poderá ser removida ou alterada após a criação.
            </p>
          </div>
        </div>
      </div>

      {/* Document Info */}
      {documentName && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-slate-600" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Documento a ser assinado:</p>
              <p className="text-sm text-slate-900 font-semibold">{documentName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <input
              type="checkbox"
              id="confirmReviewed"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <label htmlFor="confirmReviewed" className="flex-1 text-sm text-slate-700 cursor-pointer">
              <span className="font-semibold text-slate-900">✔️ Confirmo que revisei</span> todos os dados do documento, 
              incluindo signatários, posições de assinatura, configurações de QR Code e certificado digital.
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <input
              type="checkbox"
              id="understandIrrevocable"
              checked={understandChecked}
              onChange={(e) => setUnderstandChecked(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <label htmlFor="understandIrrevocable" className="flex-1 text-sm text-slate-700 cursor-pointer">
              <span className="font-semibold text-slate-900">🔒 Entendo que esta assinatura é irrevogável</span> e que o documento 
              assinado terá validade jurídica. A assinatura não poderá ser removida ou alterada.
            </label>
          </div>
        </div>

        {/* Password Confirmation */}
        <div className="space-y-2">
          <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Lock className="h-4 w-4" />
            Digite sua senha para confirmar *
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha de acesso"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
          <p className="text-xs text-slate-500">
            Por segurança, confirme sua identidade digitando sua senha
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Legal Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">📜 Sobre a Assinatura Digital</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Hash SHA-256 será gerado e vinculado ao documento</li>
                <li>• QR Code com certificado digital será inserido no PDF</li>
                <li>• Timestamp da assinatura será registrado</li>
                <li>• Documento poderá ser validado publicamente via QR Code</li>
                <li>• Certificado incluirá seus dados de identificação</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            ← Voltar e Revisar
          </button>
          
          <button
            type="submit"
            disabled={!confirmChecked || !understandChecked || !password}
            className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/30"
          >
            ✔️ Assinar Documento
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Ao clicar em "Assinar Documento", você concorda com nossos{' '}
          <a href="/terms" target="_blank" className="text-brand-600 hover:underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacy" target="_blank" className="text-brand-600 hover:underline">
            Política de Privacidade
          </a>
        </p>
      </form>
    </div>
  )
}
