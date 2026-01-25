'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'

interface DocumentStepProps {
  onNext: (data: { file: File; url: string }) => void
  initialData?: { file: File; url: string }
}

export default function DocumentStep({ onNext, initialData }: DocumentStepProps) {
  const [file, setFile] = useState<File | null>(initialData?.file || null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Apenas arquivos PDF são aceitos'
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return 'Arquivo muito grande. Máximo: 10 MB'
    }
    return null
  }

  const handleFile = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(file)
    setError('')
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleNext = () => {
    if (!file) {
      setError('Por favor, selecione um arquivo PDF')
      return
    }

    const url = URL.createObjectURL(file)
    onNext({ file, url })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Documento PDF</h2>
      <p className="text-gray-600 mb-6">Faça upload do documento que deseja assinar</p>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {file ? (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2 mx-auto"
            >
              <X size={16} />
              Remover arquivo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Arraste seu PDF aqui
              </p>
              <p className="text-sm text-gray-600">ou clique para escolher</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Escolher arquivo
            </label>
            <p className="text-xs text-gray-500">
              Formatos aceitos: PDF • Tamanho máximo: 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          disabled={!file}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próximo: Assinatura →
        </button>
      </div>
    </div>
  )
}
