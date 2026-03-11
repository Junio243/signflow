'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Download,
  FileText, ExternalLink, Copy, Clock, User, Award,
} from 'lucide-react'

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
  logo_url: string | null
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

function formatDateTime(value: string) {
  try { return new Date(value).toLocaleString('pt-BR') } catch { return value }
}

function formatDate(value: string) {
  try { return new Date(value).toLocaleDateString('pt-BR') } catch { return value }
}

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [doc, setDoc]       = useState<Document | null>(null)
  const [events, setEvents] = useState<SigningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!isUuid(id)) { setError('ID inválido'); setLoading(false); return }
      try {
        const res  = await fetch(`/api/validate/${id}`)
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Documento não encontrado'); return }
        setDoc(data.document)
        setEvents(data.events || [])
      } catch { setError('Erro ao carregar documento') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-600">Validando documento…</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Documento não encontrado</h1>
          <p className="text-slate-500">{error ?? 'Este documento não existe ou foi removido.'}</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  const status     = (doc.status || '').toLowerCase()
  const isSigned   = status === 'signed' || status === 'downloaded'
  const isCanceled = status === 'canceled'
  // Só marca como expirado se vier explicitamente 'expired' — nunca por 'draft'
  const isExpired  = status === 'expired'
  const isDraft    = status === 'draft' || status === ''

  const statusCfg = isSigned
    ? { icon: CheckCircle,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-300', bg: 'bg-emerald-50',  title: 'Documento Válido',      sub: 'Assinatura digital verificada com sucesso.' }
    : isCanceled
    ? { icon: XCircle,       iconBg: 'bg-red-100',     iconColor: 'text-red-600',     border: 'border-red-300',     bg: 'bg-red-50',      title: 'Documento Cancelado',   sub: 'Este documento foi cancelado.' }
    : isExpired
    ? { icon: AlertTriangle, iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   border: 'border-amber-300',   bg: 'bg-amber-50',    title: 'Documento Expirado',    sub: 'A validade deste documento expirou.' }
    : isDraft
    ? { icon: AlertTriangle, iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    border: 'border-blue-200',    bg: 'bg-blue-50',     title: 'Assinatura em Andamento', sub: 'Este documento ainda não foi assinado digitalmente.' }
    : { icon: AlertTriangle, iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   border: 'border-slate-200',   bg: 'bg-slate-50',    title: 'Status Desconhecido',   sub: `Status atual: ${status}` }

  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Bandeira ICP */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <img src="/seals/assinatura-qualificada.jpg" alt="ICP-Brasil" className="w-full h-auto" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>

        {/* Status principal */}
        <div className={`rounded-2xl border-2 ${statusCfg.border} ${statusCfg.bg} p-6`}>
          <div className="flex items-start gap-4">
            <div className={`${statusCfg.iconBg} rounded-full p-3 shrink-0`}>
              <StatusIcon className={`h-8 w-8 ${statusCfg.iconColor}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{statusCfg.title}</h1>
              <p className="mt-1 text-slate-600">{statusCfg.sub}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <InfoChip icon={<Clock className="h-3.5 w-3.5" />}   label="Criado em"  value={formatDateTime(doc.created_at)} />
                <InfoChip icon={<FileText className="h-3.5 w-3.5" />} label="Arquivo"   value={doc.original_pdf_name ?? 'documento.pdf'} />
                <InfoChip icon={<Shield className="h-3.5 w-3.5" />}  label="ID"        value={doc.id.slice(0, 8) + '…'} mono />
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Ações</h2>
          <div className="flex flex-wrap gap-3">
            {doc.signed_pdf_url && (
              <a href={doc.signed_pdf_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow">
                <Download className="h-4 w-4" /> Baixar PDF assinado
              </a>
            )}
            <a href={`/api/validate/${id}/report`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FileText className="h-4 w-4" /> Relatório técnico <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Copy className="h-4 w-4" /> {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>

        {/* Signatários */}
        {events.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" /> Signatários
            </h2>
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                {ev.logo_url
                  ? <img src={ev.logo_url} alt="" className="h-12 w-12 rounded-full border object-contain p-1 bg-white" />
                  : <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{ev.signer_name[0]?.toUpperCase()}</div>
                }
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-slate-900">{ev.signer_name}</p>
                  {ev.signer_reg     && <p className="text-sm text-slate-500">📋 {ev.signer_reg}</p>}
                  {ev.signer_email   && <p className="text-sm text-slate-500">✉️ {ev.signer_email}</p>}
                  {ev.certificate_type && (
                    <p className="text-sm text-slate-500"><Award className="inline h-3.5 w-3.5 mr-1" />{ev.certificate_type}</p>
                  )}
                  {ev.certificate_issuer && <p className="text-sm text-slate-500">Emissor: {ev.certificate_issuer}</p>}
                  {ev.certificate_valid_until && <p className="text-sm text-slate-500">Válido até: {formatDate(ev.certificate_valid_until)}</p>}
                  <p className="text-xs text-slate-400">Assinado em {formatDateTime(ev.signed_at)}</p>
                </div>
                {isSigned && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        )}

        {/* QR Code */}
        {doc.qr_code_url && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Validação por QR Code</h2>
            <div className="flex flex-col md:flex-row items-center gap-5">
              <img src={doc.qr_code_url} alt="QR Code" className="h-40 w-40 rounded-xl border-2 border-slate-200 p-2" />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-600">Escaneie o código com seu celular para validar a autenticidade a qualquer momento.</p>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">URL de validação:</p>
                  <code className="text-xs text-blue-600 break-all">{typeof window !== 'undefined' ? window.location.href : ''}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conformidade */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm space-y-2">
          <h2 className="text-base font-semibold text-slate-900">Conformidade Legal</h2>
          {[
            { law: 'ICP-Brasil',     desc: 'Documento assinado com certificado digital reconhecido pela Infraestrutura de Chaves Públicas Brasileira.' },
            { law: 'MP 2.200-2/01', desc: 'Assinatura digital com validade jurídica equivalente a assinatura manuscrita.' },
            { law: 'Lei 14.063/20', desc: 'Documento eletrônico com assinatura qualificada.' },
          ].map(item => (
            <div key={item.law} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700"><strong>{item.law}:</strong> {item.desc}</p>
            </div>
          ))}
        </div>

        {/* ID do documento */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">ID do Documento</h3>
          <code className="block break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-600">{doc.id}</code>
          <p className="mt-2 text-xs text-slate-400">Este identificador único garante a rastreabilidade do documento.</p>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-sm text-slate-400">
          Documento assinado via <strong className="text-slate-600">SignFlow</strong> · validado em {formatDateTime(new Date().toISOString())}
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white bg-white/70 px-3 py-1.5 text-xs text-slate-600 shadow-sm">
      <span className="text-slate-400">{icon}</span>
      <span className="font-medium text-slate-500">{label}:</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  )
}
