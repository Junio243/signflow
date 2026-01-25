'use client'

import { useState, useEffect } from 'react'
import { Calendar, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface QRConfigStepProps {
  onNext: (data: {
    certificate: {
      issuer: string
      validFrom: Date
      validUntil: Date | null
      logoUrl?: string
    }
    qrCode: {
      position: string
      size: string
    }
  }) => void
  onBack: () => void
  initialData?: any
}

export default function QRConfigStep({ onNext, onBack, initialData }: QRConfigStepProps) {
  const [issuer, setIssuer] = useState(initialData?.certificate?.issuer || 'SignFlow - Assinaturas Digitais')
  const [validityType, setValidityType] = useState<'1year' | '2years' | '5years' | 'permanent' | 'custom'>(
    initialData?.validityType || '1year'
  )
  const [validFrom, setValidFrom] = useState<string>(
    initialData?.certificate?.validFrom ? new Date(initialData.certificate.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [validUntil, setValidUntil] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState(initialData?.certificate?.logoUrl || '')
  const [logoPreview, setLogoPreview] = useState('')
  const [qrPosition, setQrPosition] = useState(initialData?.qrCode?.position || 'bottom-right')
  const [qrSize, setQrSize] = useState(initialData?.qrCode?.size || 'medium')

  useEffect(() => {
    const from = new Date(validFrom)
    let until: Date | null = null

    if (validityType === '1year') {
      until = new Date(from)
      until.setFullYear(until.getFullYear() + 1)
    } else if (validityType === '2years') {
      until = new Date(from)
      until.setFullYear(until.getFullYear() + 2)
    } else if (validityType === '5years') {
      until = new Date(from)
      until.setFullYear(until.getFullYear() + 5)
    }

    if (until) {
      setValidUntil(until.toISOString().split('T')[0])
    } else {
      setValidUntil('')
    }
  }, [validityType, validFrom])

  useEffect(() => {
    if (logoUrl && logoUrl.startsWith('http')) {
      setLogoPreview(logoUrl)
    }
  }, [logoUrl])

  const handleNext = () => {
    if (!issuer) {
      alert('Emissor do certificado é obrigatório')
      return
    }

    const data = {
      certificate: {
        issuer,
        validFrom: new Date(validFrom),
        validUntil: validityType === 'permanent' ? null : new Date(validUntil),
        logoUrl: logoUrl || undefined
      },
      qrCode: {
        position: qrPosition,
        size: qrSize
      }
    }

    onNext(data)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do QR Code</h2>
      <p className="text-gray-600 mb-6">Configure o certificado e o QR Code de validação</p>

      {/* Certificate Section */}
      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🔖 Configurações do Certificado
        </h3>

        {/* Issuer */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emissor do Certificado *
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: SignFlow - Assinaturas Digitais"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Nome da organização que está emitindo o certificado
          </p>
        </div>

        {/* Validity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Validade do Certificado *
          </label>
          
          {/* Quick Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => setValidityType('1year')}
              className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                validityType === '1year'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              1 ano
            </button>
            <button
              onClick={() => setValidityType('2years')}
              className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                validityType === '2years'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              2 anos
            </button>
            <button
              onClick={() => setValidityType('5years')}
              className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                validityType === '5years'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              5 anos
            </button>
            <button
              onClick={() => setValidityType('permanent')}
              className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                validityType === 'permanent'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Sem validade
            </button>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data Início</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data Fim</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => {
                  setValidUntil(e.target.value)
                  setValidityType('custom')
                }}
                disabled={validityType === 'permanent'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {validityType === 'permanent' && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 flex items-center gap-2">
              <AlertCircle size={14} />
              Certificado sem data de expiração (permanente)
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo do Certificado (URL opcional)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://exemplo.com/logo.png"
          />
          {logoPreview && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">Preview:</p>
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-24 h-24 object-contain border border-gray-300 rounded p-2"
                onError={() => setLogoPreview('')}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Formatos aceitos: PNG, JPG, SVG (máx 1MB). Deixe em branco para usar logo padrão.
          </p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📱 Posição do QR Code
        </h3>

        {/* Position */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Posição no documento
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'top-left', label: 'Superior esquerda' },
              { value: 'top-right', label: 'Superior direita' },
              { value: 'bottom-left', label: 'Inferior esquerda' },
              { value: 'bottom-right', label: 'Inferior direita ⭐' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setQrPosition(option.value)}
                className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  qrPosition === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamanho do QR Code
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'small', label: 'Pequeno' },
              { value: 'medium', label: 'Médio' },
              { value: 'large', label: 'Grande' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setQrSize(option.value)}
                className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  qrSize === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-1">O QR Code incluirá automaticamente:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>✓ Nome do assinante</li>
            <li>✓ CPF/CNPJ</li>
            <li>✓ Emissor do certificado</li>
            <li>✓ Validade</li>
            <li>✓ Data e hora da assinatura</li>
            <li>✓ Link de validação pública</li>
            <li>✓ Hash SHA-256 do documento</li>
          </ul>
        </div>
      </div>

      {/* Preview Placeholder */}
      <div className="mb-8 p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-sm text-gray-600 mb-2">Preview do Documento</p>
        <div className="relative w-full h-64 bg-white rounded border border-gray-300 flex items-center justify-center">
          <div className={`absolute ${
            qrPosition === 'top-left' ? 'top-4 left-4' :
            qrPosition === 'top-right' ? 'top-4 right-4' :
            qrPosition === 'bottom-left' ? 'bottom-4 left-4' :
            'bottom-4 right-4'
          }`}>
            <div className={`bg-gray-300 ${
              qrSize === 'small' ? 'w-12 h-12' :
              qrSize === 'medium' ? 'w-16 h-16' :
              'w-20 h-20'
            } flex items-center justify-center text-xs text-gray-600`}>
              QR
            </div>
          </div>
          <p className="text-gray-400">Seu documento com QR Code</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Próximo: Revisar →
        </button>
      </div>
    </div>
  )
}
