'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Ban, CheckCircle2, Clock3, Copy, Download,
  ExternalLink, FileText, Link2, Loader2, Shield, Timer, Trash2,
  User, PenTool, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmModal'

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name: string | null
  canceled_at: string | null
  metadata: Record<string, any> | null
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

const STATUS_CONFIG = {
  signed:   { label: 'Assinado',  icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  draft:    { label: 'Rascunho',  icon: Clock3,       color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
  canceled: { label: 'Cancelado', icon: Ban,          color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200' },
  expired:  { label: 'Expirado',  icon: Timer,        color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  default:  { label: '—',         icon: FileText,     color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const supabaseClient = supabase

  const [doc,    setDoc]    = useState<Doc | null>(null)
  const [events, setEvents] = useState<SigningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [busy, setBusy]     = useState(false)

  const id = params.id

  const load = async () => {
    if (!isUuid(id)) { setError('ID inválido'); setLoading(false); return }
    if (!supabaseClient) { setError('Serviço indisponível'); setLoading(false); return }
    setLoading(true)
    try {
      const [docRes, eventsRes] = await Promise.all([
        supabaseClient.from('documents').select('*').eq('id', id).maybeSingle(),
        supabaseClient.from('document_signing_events').select('*').eq('document_id', id).order('signed_at', { ascending: false }),
      ])
      if (docRes.error) throw new Error(docRes.error.message)
      if (!docRes.data)  throw new Error('Documento não encontrado')
      setDoc(docRes.data as Doc)
      setEvents((eventsRes.data ?? []) as SigningEvent[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleCancel = async () => {
    if (!doc || !supabaseClient) return
    const ok = await confirm({
      title: 'Cancelar documento',
      message: 'Tem certeza? O documento será marcado como cancelado e não poderá mais ser usado.',
      confirmLabel: 'Sim, cancelar',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabaseClient.from('documents').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('id', id)
    setBusy(false)
    if (error) toast.error(error.message)
    else { toast.success('Documento cancelado'); load() }
  }

  const handleDelete = async () => {
    if (!doc) return
    const ok = await confirm({
      title: 'Deletar documento',
      message: 'Deletar permanentemente? Esta ação é irreversível.',
      confirmLabel: 'Deletar',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const res  = await fetch(`/api/documents/delete?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) toast.error(json.error)
      else { toast.success('Deletado'); router.push('/dashboard') }
    } catch (e) {
      toast.error('Erro ao deletar')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/validate/${id}`
    try { await navigator.clipboard.writeText(url); toast.success('Link copiado!') }
    catch { toast.error('Não foi possível copiar') }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-2xl mt-10 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold text-slate-900">Documento não encontrado</h1>
        <p className="text-slate-500">{error}</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  const statusKey = (doc.status ?? 'default').toLowerCase() as StatusKey
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.default
  const StatusIcon = cfg.icon
  const isDraft   = statusKey === 'draft'
  const isSigned  = statusKey === 'signed'
  const canDelete = ['draft', 'canceled', 'expired'].includes(statusKey)
  const canCancel = statusKey !== 'canceled'

  const meta = doc.metadata as any ?? {}
  const textAnnotationsCount = Array.isArray(meta.text_annotations) ? meta.text_annotations.length : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">

      {/* Botão voltar */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
        </Link>
      </div>

      {/* Card de status */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 bg-white border ${cfg.border}`}>
              <StatusIcon className={`h-7 w-7 ${cfg.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{doc.original_pdf_name ?? 'Documento sem nome'}</h1>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cfg.border} ${cfg.color} bg-white`}>{cfg.label}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">{doc.id}</p>
              <p className="mt-1 text-sm text-slate-500">Criado em {new Date(doc.created_at).toLocaleString('pt-BR')}</p>
              {doc.canceled_at && (
                <p className="text-sm text-rose-500">Cancelado em {new Date(doc.canceled_at).toLocaleString('pt-BR')}</p>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {isDraft && (
              <Link href="/editor" className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                <PenTool className="h-4 w-4" /> Continuar editando
              </Link>
            )}
            {doc.signed_pdf_url && (
              <a href={doc.signed_pdf_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Baixar PDF
              </a>
            )}
            <Link href={`/validate/${doc.id}`} target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" /> Validar
            </Link>
            <button onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Copy className="h-4 w-4" /> Copiar link
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Metadados */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" /> Detalhes do documento
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Status"       value={cfg.label} />
            <Row label="ID"           value={<code className="text-xs font-mono break-all">{doc.id}</code>} />
            <Row label="Criado em"    value={new Date(doc.created_at).toLocaleString('pt-BR')} />
            {doc.canceled_at && <Row label="Cancelado em" value={new Date(doc.canceled_at).toLocaleString('pt-BR')} />}
            <Row label="Textos inseridos" value={`${textAnnotationsCount} anotação${textAnnotationsCount !== 1 ? 'ões' : ''}`} />
            {meta.qr_position && <Row label="QR Code"   value={meta.qr_position} />}
            {meta.validation_requires_code && <Row label="Código de acesso" value="Exigido" />}
          </dl>
        </div>

        {/* QR Code */}
        {doc.qr_code_url && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center gap-4">
            <h2 className="text-base font-semibold text-slate-900 self-start">QR Code de Validação</h2>
            <img src={doc.qr_code_url} alt="QR Code" className="w-40 h-40 rounded-xl border border-slate-200 p-2" />
            <Link href={`/validate/${doc.id}`} target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Shield className="h-4 w-4" /> Ver página de validação
            </Link>
          </div>
        )}
      </div>

      {/* Signatários */}
      {events.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" /> Signatários ({events.length})
          </h2>
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  {ev.logo_url
                    ? <img src={ev.logo_url} alt="" className="h-10 w-10 rounded-full border object-contain p-1" />
                    : <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">{ev.signer_name[0]?.toUpperCase()}</div>
                  }
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-slate-900">{ev.signer_name}</p>
                    {ev.signer_reg  && <p className="text-xs text-slate-500">Registro: {ev.signer_reg}</p>}
                    {ev.signer_email && <p className="text-xs text-slate-500">✉️ {ev.signer_email}</p>}
                    {ev.certificate_type && <p className="text-xs text-slate-500">Certificado: {ev.certificate_type}</p>}
                    {ev.certificate_issuer && <p className="text-xs text-slate-500">Emissor: {ev.certificate_issuer}</p>}
                    {ev.certificate_valid_until && <p className="text-xs text-slate-500">Válido até: {new Date(ev.certificate_valid_until).toLocaleDateString('pt-BR')}</p>}
                    <p className="text-xs text-slate-400">Assinado em {new Date(ev.signed_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona de perigo */}
      {(canCancel || canDelete) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Zona de perigo
          </h2>
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <button onClick={handleCancel} disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                <Ban className="h-4 w-4" /> Cancelar documento
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> Deletar permanentemente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  )
}
