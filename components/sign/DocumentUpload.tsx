'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'

interface DocumentUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  disabled?: boolean
}

export function DocumentUpload({ 
  onFileSelect, 
  onFileRemove, 
  selectedFile, 
  disabled 
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('Arquivo muito grande. Máximo: 10MB')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Tipo de arquivo inválido. Apenas PDF é permitido')
      } else {
        setError('Erro ao fazer upload do arquivo')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    disabled,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={[
            'rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer',
            isDragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-brand-100 p-4">
              <Upload className="h-8 w-8 text-brand-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Apenas PDF • Máximo 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="rounded-lg bg-emerald-100 p-2">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFileRemove}
              disabled={disabled}
              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
