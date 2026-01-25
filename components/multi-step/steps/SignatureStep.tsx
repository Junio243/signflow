'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Type, Upload as UploadIcon, Trash2 } from 'lucide-react'

interface SignatureStepProps {
  onNext: (data: { data: string; type: 'draw' | 'text' | 'upload' }) => void
  onBack: () => void
  initialData?: { data: string; type: 'draw' | 'text' | 'upload' }
}

export default function SignatureStep({ onNext, onBack, initialData }: SignatureStepProps) {
  const [signatureType, setSignatureType] = useState<'draw' | 'text' | 'upload'>(
    initialData?.type || 'draw'
  )
  const [signatureData, setSignatureData] = useState(initialData?.data || '')
  const [textSignature, setTextSignature] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (signatureType === 'draw' && initialData?.data && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
      img.src = initialData.data
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL())
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData('')
  }

  const generateTextSignature = () => {
    if (!textSignature) return

    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.font = '36px "Brush Script MT", cursive'
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(textSignature, 200, 50)

    setSignatureData(canvas.toDataURL())
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSignatureData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleNext = () => {
    if (!signatureData) {
      alert('Por favor, crie sua assinatura')
      return
    }

    onNext({ data: signatureData, type: signatureType })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Assinatura</h2>
      <p className="text-gray-600 mb-6">Escolha como deseja criar sua assinatura</p>

      {/* Type Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSignatureType('draw')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
            signatureType === 'draw'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Pencil className="inline mr-2" size={18} />
          Desenhar
        </button>
        <button
          onClick={() => setSignatureType('text')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
            signatureType === 'text'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Type className="inline mr-2" size={18} />
          Texto
        </button>
        <button
          onClick={() => setSignatureType('upload')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
            signatureType === 'upload'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <UploadIcon className="inline mr-2" size={18} />
          Upload
        </button>
      </div>

      {/* Draw Canvas */}
      {signatureType === 'draw' && (
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
          />
          <button
            onClick={clearCanvas}
            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2"
          >
            <Trash2 size={16} />
            Limpar
          </button>
        </div>
      )}

      {/* Text Input */}
      {signatureType === 'text' && (
        <div className="space-y-4">
          <input
            type="text"
            value={textSignature}
            onChange={(e) => setTextSignature(e.target.value)}
            onBlur={generateTextSignature}
            placeholder="Digite seu nome"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {signatureData && (
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <img src={signatureData} alt="Assinatura" className="max-w-full h-auto" />
            </div>
          )}
        </div>
      )}

      {/* File Upload */}
      {signatureType === 'upload' && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full"
          />
          {signatureData && (
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <img src={signatureData} alt="Assinatura" className="max-w-full h-auto" />
            </div>
          )}
        </div>
      )}

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
          disabled={!signatureData}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próximo: Perfil →
        </button>
      </div>
    </div>
  )
}
