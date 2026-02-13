'use client'

import { CheckCircle, Download, Link2, Mail, LayoutDashboard, QrCode, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ResultStepProps {
  result: {
    documentId: string
    hash: string
    validationUrl: string
    signedPdfUrl: string
    qrCodeUrl: string
    fileName: string
    signedAt?: string
  }
  onCreateNew?: () => void
}

export default function ResultStep({ result, onCreateNew }: ResultStepProps) {
  const router = useRouter()
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Erro ao copiar. Por favor, tente novamente.')
    }
  }

  const handleDownload = async () => {
    try {
      setDownloadLoading(true)
      console.log('📥 Downloading PDF from:', result.signedPdfUrl)
      
      // Buscar o PDF
      const response = await fetch(result.signedPdfUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Converter para blob
      const blob = await response.blob()
      console.log('✅ PDF blob created, size:', blob.size)
      
      // Criar URL local
      const url = window.URL.createObjectURL(blob)
      
      // Criar link de download
      const a = document.createElement('a')
      a.href = url
      a.download = result.fileName.replace('.pdf', '-assinado.pdf')
      document.body.appendChild(a)
      a.click()
      
      // Limpar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('✅ Download completed successfully')
    } catch (error) {
      console.error('❌ Download failed:', error)
      alert('❌ Erro ao baixar o PDF. Tente novamente ou use o link de validação.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleViewQRCode = () => {
    if (!result.qrCodeUrl) {
      alert('QR Code não disponível')
      return
    }
    
    // Abrir QR Code em nova janela
    const win = window.open('', '_blank', 'width=400,height=500')
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${result.fileName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: #f5f5f5;
            }
            h2 {
              margin: 0 0 20px 0;
              font-size: 18px;
              color: #333;
            }
            img {
              max-width: 100%;
              border: 2px solid #ddd;
              border-radius: 8px;
              background: white;
              padding: 10px;
            }
            p {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h2>QR Code de Validação</h2>
          <img src="${result.qrCodeUrl}" alt="QR Code" />
          <p>Escaneie para validar o documento</p>
        </body>
        </html>
      `)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
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
            <p className="text-gray-600 font-medium">Arquivo:</p>
            <p className="font-semibold text-gray-900">{result.fileName}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">ID do Documento:</p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-gray-900 break-all">{result.documentId}</p>
              <button
                onClick={() => copyToClipboard(result.documentId, 'id')}
                className="text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap"
              >
                {copied === 'id' ? '✅ Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Hash SHA-256:</p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-gray-900 break-all">{result.hash}</p>
              <button
                onClick={() => copyToClipboard(result.hash, 'hash')}
                className="text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap"
              >
                {copied === 'hash' ? '✅ Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Data de Assinatura:</p>
            <p className="font-semibold text-gray-900">
              {result.signedAt 
                ? new Date(result.signedAt).toLocaleString('pt-BR', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })
                : new Date().toLocaleString('pt-BR', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })
              }
            </p>
          </div>
        </div>
      </div>

      {/* Status Checklist */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-left">
        <p className="font-semibold text-green-900 mb-3">✅ Tudo pronto!</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm">Documento assinado digitalmente</span>
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
            <span className="text-sm">Armazenado com segurança na nuvem</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={handleDownload}
          disabled={downloadLoading}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {downloadLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Baixando...
            </>
          ) : (
            <>
              <Download size={20} />
              Baixar PDF
            </>
          )}
        </button>
        
        <button
          onClick={handleViewQRCode}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          <QrCode size={20} />
          Ver QR Code
        </button>
        
        <button
          onClick={() => copyToClipboard(result.validationUrl, 'url')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Link2 size={20} />
          {copied === 'url' ? '✅ Copiado!' : 'Copiar Link'}
        </button>
      </div>

      {/* Validation Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-900 font-medium mb-2">🔗 Link de Validação Pública:</p>
        <div className="flex items-center gap-2">
          <a
            href={result.validationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 underline break-all flex-1"
          >
            {result.validationUrl}
          </a>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          👁️ Qualquer pessoa pode usar este link para validar a autenticidade do documento
        </p>
      </div>

      {/* URLs diretas (para desenvolvimento/debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
          <p className="text-xs text-yellow-900 font-medium mb-2">👨‍💻 Debug Info:</p>
          <div className="space-y-1 text-xs">
            <p className="text-yellow-800"><strong>PDF:</strong> <a href={result.signedPdfUrl} target="_blank" className="underline">{result.signedPdfUrl.substring(0, 60)}...</a></p>
            <p className="text-yellow-800"><strong>QR:</strong> {result.qrCodeUrl ? '✅ Disponível' : '❌ Indisponível'}</p>
          </div>
        </div>
      )}

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
          onClick={onCreateNew || (() => window.location.reload())}
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText size={20} />
          Assinar Outro Documento
        </button>
      </div>

      {/* Share options */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Compartilhar via:</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              const subject = encodeURIComponent(`Documento Assinado: ${result.fileName}`)
              const body = encodeURIComponent(
                `Olá!\n\nCompartilho com você um documento assinado digitalmente via SignFlow:\n\n` +
                `📄 Arquivo: ${result.fileName}\n` +
                `🔗 Validação: ${result.validationUrl}\n\n` +
                `Clique no link acima para verificar a autenticidade do documento.\n\n` +
                `Atenciosamente`
              )
              window.open(`mailto:?subject=${subject}&body=${body}`)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Mail size={16} />
            E-mail
          </button>
        </div>
      </div>
    </div>
  )
}
