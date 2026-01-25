'use client'

import { CheckCircle, Download, Link2, Mail, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResultStepProps {
  result: {
    documentId: string
    hash: string
    validationUrl: string
    fileName: string
  }
}

export default function ResultStep({ result }: ResultStepProps) {
  const router = useRouter()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado para área de transferência!')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={48} className="text-green-600" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        🎉 Documento Assinado!
      </h2>
      <p className="text-gray-600 mb-8">Seu documento foi assinado e registrado com sucesso</p>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-left">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600">ID do Documento:</p>
            <p className="font-mono font-semibold text-gray-900">{result.documentId}</p>
          </div>
          <div>
            <p className="text-gray-600">Hash SHA-256:</p>
            <p className="font-mono text-xs text-gray-900 break-all">{result.hash}</p>
          </div>
          <div>
            <p className="text-gray-600">Data:</p>
            <p className="font-semibold text-gray-900">{new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Status Checklist */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm">Seu documento foi assinado</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm">QR Code inserido e ativo</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm">Link de validação pública gerado</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm">Certificado digital emitido</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => alert('Download iniciado!')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={20} />
          Baixar PDF Assinado
        </button>
        <button
          onClick={() => copyToClipboard(result.validationUrl)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Link2 size={20} />
          Copiar Link de Validação
        </button>
      </div>

      {/* Validation Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-900 font-medium mb-2">Validação Pública:</p>
        <a
          href={result.validationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
        >
          {result.validationUrl}
        </a>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
        >
          <LayoutDashboard size={20} />
          Ir para Dashboard
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Assinar Outro Documento
        </button>
      </div>
    </div>
  )
}
