'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Image as ImageIcon, AlertCircle, Lock, Key, FileText } from 'lucide-react'
import PdfEditor from '@/components/PdfEditor'

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
  }) => void
  onBack: () => void
  initialData?: any
  pdfUrl?: string
  signatureData?: { data: string; type: 'draw' | 'text' | 'upload' }
  pdfFile?: File
}

type Pos = {
  page: number
  nx: number
  ny: number
  x?: number
  y?: number
  scale: number
  rotation: number
}

type PageSize = { width: number; height: number }

export default function QRConfigStep({ onNext, onBack, initialData, pdfUrl, signatureData, pdfFile }: QRConfigStepProps) {
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

  // PDF Editor states
  const [positions, setPositions] = useState<Pos[]>(initialData?.signaturePositions?.map((p: any) => ({
    page: p.page,
    nx: p.nx,
    ny: p.ny,
    scale: p.scale,
    rotation: p.rotation
  })) || [])
  const [activePage, setActivePage] = useState(1)
  const [pdfPageCount, setPdfPageCount] = useState(1)
  const [pageSizes, setPageSizes] = useState<PageSize[]>([])
  const [showPreview, setShowPreview] = useState(false)

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

  // Load PDF pages and dimensions
  useEffect(() => {
    if (!pdfFile) {
      setPdfPageCount(1)
      setPageSizes([])
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const ab = await pdfFile.arrayBuffer()
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf')

        try {
          (pdfjs as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        } catch (e) {
          console.warn('[QRConfigStep] Could not set PDF.js workerSrc', e)
        }

        const loadingTask = pdfjs.getDocument({ data: ab })
        const pdf = await loadingTask.promise

        if (cancelled) {
          try {
            pdf.destroy?.()
          } catch (err) {
            console.warn('[QRConfigStep] Failed to destroy cancelled PDF', err)
          }
          return
        }

        const sizes: PageSize[] = []
        const pageCount = pdf.numPages || 1
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          sizes.push({ width: viewport.width, height: viewport.height })
          try {
            page.cleanup?.()
          } catch (err) {
            console.warn('[QRConfigStep] Failed to cleanup page', err)
          }
        }

        setPageSizes(sizes)
        setPdfPageCount(sizes.length || 1)
        setActivePage(1)

        try {
          pdf.destroy?.()
        } catch (err) {
          console.warn('[QRConfigStep] Failed to destroy PDF', err)
        }
      } catch (err) {
        console.error('[QRConfigStep] Failed to read PDF', err)
        setPageSizes([])
        setPdfPageCount(1)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdfFile])

  const generateNewCode = () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase()
    setValidationCode(code)
  }

  const handlePositionsChange = useCallback((next: Pos[]) => {
    setPositions(next)
  }, [])

  const removePosition = (page: number) => {
    setPositions(current => current.filter(pos => pos.page !== page))
  }

  const handleGoToPosition = (page: number) => {
    setActivePage(Math.max(1, page))
  }

  const clearPositions = () => {
    setPositions([])
  }

  const computePositionsForApi = () => {
    if (!positions.length) return []

    return positions.map(pos => {
      const dims = pageSizes[pos.page - 1] ?? pageSizes[0] ?? { width: 595, height: 842 }
      const cw = dims.width
      const ch = dims.height
      const nx =
        typeof pos.nx === 'number' && Number.isFinite(pos.nx)
          ? Math.max(0, Math.min(1, pos.nx))
          : typeof pos.x === 'number' && Number.isFinite(pos.x)
            ? Math.max(0, Math.min(1, pos.x / cw))
            : 0.5
      const ny =
        typeof pos.ny === 'number' && Number.isFinite(pos.ny)
          ? Math.max(0, Math.min(1, pos.ny))
          : typeof pos.y === 'number' && Number.isFinite(pos.y)
            ? Math.max(0, Math.min(1, pos.y / ch))
            : 0.5

      return {
        page: pos.page,
        nx,
        ny,
        x: nx * cw,
        y: ny * ch,
        scale: typeof pos.scale === 'number' ? pos.scale : 1,
        rotation: typeof pos.rotation === 'number' ? pos.rotation : 0,
        page_width: cw,
        page_height: ch,
      }
    })
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

    if (positions.length === 0) {
      alert('❌ Posicione a assinatura em pelo menos uma página do documento!\n\nClique em "Posicionar Assinatura no PDF" e depois clique no documento para adicionar a assinatura.')
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
      },
      signaturePositions: computePositionsForApi()
    }

    onNext(data)
  }

  const getQrPositionLabel = () => {
    const labels = {
      'top-left': 'Superior Esquerda',
      'top-right': 'Superior Direita',
      'bottom-left': 'Inferior Esquerda',
      'bottom-right': 'Inferior Direita'
    }
    return labels[qrPosition as keyof typeof labels] || labels['bottom-right']
  }

  const getQrSizeLabel = () => {
    const labels = {
      small: 'Pequeno',
      medium: 'Médio',
      large: 'Grande'
    }
    return labels[qrSize as keyof typeof labels] || labels.medium
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações Finais</h2>
      <p className="text-gray-600 mb-6">Configure o certificado, QR Code e posicione a assinatura no documento</p>

      {/* Certificate Section */}
      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🔖 Configurações do Certificado
        </h3>

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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Validade do Certificado *
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {['1year', '2years', '5years', 'permanent'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValidityType(type as any)}
                className={`py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  validityType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {type === '1year' ? '1 ano' : type === '2years' ? '2 anos' : type === '5years' ? '5 anos' : 'Sem validade'}
              </button>
            ))}
          </div>

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

      {/* PDF Preview Section - NEW! */}
      <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              ✍️ Posicionar Assinatura no PDF *
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Clique no documento para adicionar a assinatura. Você pode posicionar em múltiplas páginas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            {showPreview ? '🙈 Ocultar Preview' : '👁️ Mostrar Preview'}
          </button>
        </div>

        {positions.length > 0 && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">
              ✅ Assinaturas posicionadas: {positions.length}
            </p>
            <ul className="space-y-2">
              {positions
                .slice()
                .sort((a, b) => a.page - b.page)
                .map(pos => (
                  <li
                    key={pos.page}
                    className="flex items-center justify-between text-xs bg-white rounded px-3 py-2 border border-green-200"
                  >
                    <div>
                      <span className="font-medium text-gray-900">Página {pos.page}</span>
                      <span className="ml-2 text-gray-600">
                        {(pos.nx * 100).toFixed(0)}% × {(pos.ny * 100).toFixed(0)}% · Escala {(pos.scale ?? 1).toFixed(1)}×
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleGoToPosition(pos.page)}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                      >
                        Ir
                      </button>
                      <button
                        type="button"
                        onClick={() => removePosition(pos.page)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              onClick={clearPositions}
              className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              🗑️ Limpar todas as posições
            </button>
          </div>
        )}

        {showPreview && pdfFile && signatureData && (
          <div className="mt-4">
            <PdfEditor
              file={pdfFile}
              signatureUrl={signatureData.data}
              signatureSize={{ width: 400, height: 180 }}
              positions={positions}
              onPositions={handlePositionsChange}
              page={activePage}
              onPageChange={setActivePage}
              onDocumentLoaded={({ pages }) => setPdfPageCount(pages)}
            />
          </div>
        )}

        {!pdfFile && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ PDF não encontrado. Volte para a etapa de documento.
          </div>
        )}

        {!signatureData && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Assinatura não encontrada. Volte para a etapa de assinatura.
          </div>
        )}
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
