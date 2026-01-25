'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, Image as ImageIcon, AlertCircle, Lock, Key } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Configurar worker do PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

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
    validation: {
      requireCode: boolean
      validationCode?: string
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
  const [requireValidationCode, setRequireValidationCode] = useState(initialData?.validation?.requireCode || false)
  const [validationCode, setValidationCode] = useState(initialData?.validation?.validationCode || '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)

  // Carregar PDF do localStorage e renderizar preview
  useEffect(() => {
    const loadPdfPreview = async () => {
      try {
        const savedData = localStorage.getItem('document-creation')
        if (!savedData) return

        const data = JSON.parse(savedData)
        const pdfUrl = data.document?.url
        if (!pdfUrl || !canvasRef.current) return

        // Carregar PDF
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        // Configurar canvas
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        const viewport = page.getViewport({ scale: 1 })
        const scale = Math.min(
          canvas.parentElement!.clientWidth / viewport.width,
          300 / viewport.height
        )
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        // Renderizar PDF
        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise

        setPdfLoaded(true)
      } catch (error) {
        console.error('Erro ao carregar preview:', error)
      }
    }

    loadPdfPreview()
  }, [])

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

  useEffect(() => {
    if (requireValidationCode && !validationCode) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase()
      setValidationCode(code)
    }
  }, [requireValidationCode])

  const generateNewCode = () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase()
    setValidationCode(code)
  }

  const handleNext = () => {
    if (!issuer) {
      alert('Emissor do certificado é obrigatório')
      return
    }

    if (requireValidationCode && !validationCode) {
      alert('Código de validação é obrigatório quando a opção está ativada')
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
      },
      validation: {
        requireCode: requireValidationCode,
        validationCode: requireValidationCode ? validationCode : undefined
      }
    }

    onNext(data)
  }

  // Calcular posição do QR Code no preview
  const getQrPosition = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    }
    return positions[qrPosition as keyof typeof positions] || positions['bottom-right']
  }

  const getQrSizeClass = () => {
    const sizes = {
      small: 'w-12 h-12',
      medium: 'w-16 h-16',
      large: 'w-20 h-20'
    }
    return sizes[qrSize as keyof typeof sizes] || sizes.medium
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
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
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
                type="button"
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
                type="button"
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

      {/* Validation Code Section */}
      <div className="mb-8 p-6 bg-purple-50 border-2 border-purple-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Segurança Adicional</h3>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <button
            type="button"
            onClick={() => setRequireValidationCode(!requireValidationCode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              requireValidationCode ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                requireValidationCode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Exigir código de validação (opcional)
            </label>
            <p className="text-xs text-gray-600">
              Ao ativar, o link público pedirá um código antes de mostrar os detalhes do documento. Ideal para documentos confidenciais.
            </p>
          </div>
        </div>

        {requireValidationCode && (
          <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-purple-600" />
              <label className="text-sm font-medium text-gray-900">
                Código de Validação
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-lg font-bold tracking-wider"
                placeholder="ABC12XYZ"
                maxLength={10}
              />
              <button
                type="button"
                onClick={generateNewCode}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Gerar Novo
              </button>
            </div>
            <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              Guarde este código em local seguro. Será necessário para validar o documento.
            </p>
          </div>
        )}
      </div>

      {/* Preview REAL DO PDF */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            🔍 Preview em Tempo Real
            {pdfLoaded && <span className="text-xs text-green-600 font-normal">• Documento carregado</span>}
          </p>
          <p className="text-xs text-gray-600">Posição: {qrPosition.replace('-', ' ')} | Tamanho: {qrSize}</p>
        </div>
        <div className="relative w-full bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
          />
          {!pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <p className="text-gray-400">Carregando preview...</p>
            </div>
          )}
          {/* QR Code Overlay */}
          <div className={`absolute ${getQrPosition()}`}>
            <div className={`${getQrSizeClass()} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs rounded shadow-lg relative animate-pulse`}>
              QR
              {requireValidationCode && (
                <Lock className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 drop-shadow" />
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          ✨ Este é o preview do seu documento com o QR Code na posição selecionada
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Próximo: Revisar →
        </button>
      </div>
    </div>
  )
}
