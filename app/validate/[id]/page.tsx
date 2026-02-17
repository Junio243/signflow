'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, CheckCircle, XCircle, AlertTriangle, Download, FileText, ExternalLink } from 'lucide-react'

type Document = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name: string | null
  canceled_at?: string | null
}

type SigningEvent = {
  id: string
  signer_name: string
  signer_reg: string | null
  certificate_type: string | null
  certificate_issuer: string | null
  signer_email: string | null
  signed_at: string
  certificate_valid_until: string | null
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [doc, setDoc] = useState<Document | null>(null)
  const [events, setEvents] = useState<SigningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDocument = async () => {
      if (!isUuid(id)) {
        setError('ID de documento inválido')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/validate/${id}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Documento não encontrado')
          return
        }

        setDoc(data.document)
        setEvents(data.events || [])
      } catch (err) {
        setError('Erro ao carregar documento')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando documento...</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documento não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'Este documento não existe ou foi removido.'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    )
  }

  const status = (doc.status || '').toLowerCase()
  const isCanceled = status === 'canceled'
  const isExpired = status === 'expired'
  const isValid = !isCanceled && !isExpired

  const statusConfig = isValid
    ? { icon: CheckCircle, color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100', title: 'Documento Válido', subtitle: 'Assinado digitalmente com certificado ICP-Brasil' }
    : isCanceled
    ? { icon: XCircle, color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100', title: 'Documento Cancelado', subtitle: 'Este documento foi cancelado e não é mais válido' }
    : { icon: AlertTriangle, color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100', title: 'Documento Expirado', subtitle: 'A validade deste documento expirou' }

  const StatusIcon = statusConfig.icon
  const primarySigner = events.length > 0 ? events[0] : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Bandeira Institucional */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src="/seals/assinatura-qualificada.jpg"
            alt="Assinatura Eletrônica Qualificada - ICP-Brasil"
            className="w-full h-auto"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Status do Documento */}
        <div className={`${statusConfig.bg} ${statusConfig.border} border-2 rounded-2xl p-6`}>
          <div className="flex items-start gap-4">
            <div className={`${statusConfig.badge} rounded-full p-3`}>
              <StatusIcon className={`w-8 h-8 text-${statusConfig.color}-600`} />
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${statusConfig.text} mb-2`}>
                {statusConfig.title}
              </h1>
              <p className={`${statusConfig.text} opacity-90 mb-4`}>
                {statusConfig.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
                  <div className="font-semibold">{isValid ? 'Assinado' : isCanceled ? 'Cancelado' : 'Expirado'}</div>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Data</div>
                  <div className="font-semibold">{new Date(doc.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Documento</div>
                  <div className="font-semibold text-sm">{doc.original_pdf_name || 'documento.pdf'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Principais */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Relatório de Conformidade
          </h2>
          <p className="text-gray-600 mb-4">
            Gere um relatório técnico detalhado com todas as informações de validação, cadeia de certificados e conformidade legal.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/validate/${id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              <FileText className="w-5 h-5" />
              Gerar Relatório Técnico
              <ExternalLink className="w-4 h-4" />
            </a>
            {doc.signed_pdf_url && (
              <a
                href={doc.signed_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                <Download className="w-5 h-5" />
                Baixar Documento Assinado
              </a>
            )}
          </div>
        </div>

        {/* Informações do Signatário */}
        {primarySigner && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Informações do Signatário
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Nome do Signatário</div>
                <div className="font-semibold text-gray-900">{primarySigner.signer_name}</div>
              </div>
              {primarySigner.signer_reg && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">CPF/CNPJ</div>
                  <div className="font-semibold text-gray-900">{primarySigner.signer_reg}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 mb-1">Tipo de Certificado</div>
                <div className="font-semibold text-gray-900">{primarySigner.certificate_type || 'ICP-Brasil'}</div>
              </div>
              {primarySigner.certificate_valid_until && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Validade do Certificado</div>
                  <div className="font-semibold text-gray-900">{new Date(primarySigner.certificate_valid_until).toLocaleDateString('pt-BR')}</div>
                </div>
              )}
              {primarySigner.certificate_issuer && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Emissor do Certificado</div>
                  <div className="font-semibold text-gray-900">{primarySigner.certificate_issuer}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code de Validação */}
        {doc.qr_code_url && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Validação Rápida</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={doc.qr_code_url}
                alt="QR Code de Validação"
                className="w-48 h-48 border-2 border-gray-200 rounded-xl p-2"
              />
              <div className="flex-1">
                <p className="text-gray-700 mb-3">
                  Escaneie este QR Code com seu smartphone para validar a autenticidade do documento.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    URL de Validação:
                  </p>
                  <code className="text-xs text-blue-600 break-all">
                    {typeof window !== 'undefined' ? window.location.href : ''}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conformidade Legal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Conformidade Legal</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>ICP-Brasil:</strong> Documento assinado com certificado digital reconhecido pela Infraestrutura de Chaves Públicas Brasileira
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>MP 2.200-2/01:</strong> Assinatura digital com validade jurídica equivalente a assinatura manuscrita
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Lei 14.063/20:</strong> Documento eletrônico com assinatura qualificada
              </p>
            </div>
          </div>
        </div>

        {/* ID do Documento */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ID do Documento</h3>
          <code className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 block break-all font-mono">
            {doc.id}
          </code>
          <p className="text-xs text-gray-500 mt-3">
            Este identificador único permite validar a autenticidade do documento a qualquer momento.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-gray-500">
          <p>Documento assinado digitalmente via <strong>SignFlow</strong></p>
          <p className="mt-1">Validado em {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}
