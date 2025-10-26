'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name: string | null
  metadata: any | null
  validation_theme_snapshot?: any | null
  canceled_at?: string | null
}

type StatusMeta = {
  label: string
  badge: string
  description: string
}

const STATUS_META: Record<string, StatusMeta> = {
  signed: {
    label: 'Assinado',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    description: 'Documento válido e disponível para validação pública.'
  },
  draft: {
    label: 'Rascunho',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    description: 'Faltam etapas para finalizar a assinatura.'
  },
  canceled: {
    label: 'Cancelado',
    badge: 'bg-rose-100 text-rose-700 border border-rose-200',
    description: 'Documento cancelado. Mantido apenas para auditoria.'
  },
  expired: {
    label: 'Expirado',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    description: 'Prazo expirado. Gere um novo documento para assinatura.'
  }
}

function statusMeta(status: string | null | undefined): StatusMeta {
  const key = (status || '').toLowerCase()
  return STATUS_META[key] || {
    label: status || '—',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    description: 'Status não reconhecido.'
  }
}

export default function EditorDocumentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabaseClient = supabase
  const [doc, setDoc] = useState<Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = params.id
    if (!id) return
    let active = true
    ;(async () => {
      setLoading(true)
      if (!supabaseClient) {
        setError('Serviço de documentos indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }
      const { data, error } = await supabaseClient
        .from('documents')
        .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, metadata, validation_theme_snapshot, canceled_at')
        .eq('id', id)
        .maybeSingle()
      if (!active) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setDoc((data ?? null) as Doc | null)
      setLoading(false)
    })()
    return () => { active = false }
  }, [params.id, supabaseClient])

  const theme = useMemo(() => {
    const meta = doc?.metadata
    if (doc?.validation_theme_snapshot) return doc.validation_theme_snapshot
    if (meta && typeof meta === 'object') {
      if ((meta as any).validation_theme_snapshot) return (meta as any).validation_theme_snapshot
      if ((meta as any).theme) return (meta as any).theme
    }
    return null
  }, [doc])

  if (!supabaseClient) {
    return (
      <div className="mx-auto mt-10 max-w-3xl px-4 text-amber-600">
        Serviço de documentos indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </div>
    )
  }
  if (loading) return <div className="mx-auto mt-10 max-w-3xl px-4 text-slate-600">Carregando…</div>
  if (error) return <div className="mx-auto mt-10 max-w-3xl px-4 text-rose-600">Erro: {error}</div>
  if (!doc) return <div className="mx-auto mt-10 max-w-3xl px-4 text-slate-600">Documento não encontrado.</div>

  const meta = statusMeta(doc.status)
  const validateUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/validate/${doc.id}`
  const signedAt = doc.created_at ? new Date(doc.created_at).toLocaleString() : '—'

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-10">
        <div className="flex flex-col gap-1">
          <button className="self-start text-xs font-semibold uppercase tracking-wide text-slate-500" onClick={() => router.back()}>
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Documento #{doc.id}</h1>
          <p className="text-sm text-slate-500">Acompanhe o status, baixe o PDF e acesse o link público de validação.</p>
        </div>

        <div className={`flex items-start justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ${meta.badge}`}>
          <div>
            <div className="text-xs uppercase tracking-wide">Status</div>
            <div className="text-lg font-semibold">{meta.label}</div>
            <div className="text-xs text-slate-600/80">{meta.description}</div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-semibold text-slate-700">Assinado em</div>
            <div>{signedAt}</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Arquivos</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-medium">Original:</span>{' '}
                {doc.original_pdf_name ? doc.original_pdf_name : '—'}
              </li>
              <li>
                <span className="font-medium">PDF assinado:</span>{' '}
                {doc.signed_pdf_url ? (
                  <a href={doc.signed_pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Abrir PDF
                  </a>
                ) : 'Ainda não gerado'}
              </li>
              <li>
                <span className="font-medium">QR Code:</span>{' '}
                {doc.qr_code_url ? (
                  <a href={doc.qr_code_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Baixar QR
                  </a>
                ) : '—'}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Validação pública</h2>
            <p className="mt-2 break-all text-sm text-slate-600">
              <Link className="text-blue-600 underline" href={`/validate/${doc.id}`}>
                {validateUrl}
              </Link>
            </p>
            {doc.qr_code_url && (
              <img src={doc.qr_code_url} alt="QR code" className="mt-4 h-32 w-32 rounded-lg border border-slate-200 bg-white object-contain" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tema aplicado</h2>
          {theme ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {theme.logo_url && (
                <img src={theme.logo_url} alt="Logo" className="h-12 object-contain" />
              )}
              <div><span className="font-medium">Emitido por:</span> {theme.issuer || '—'}</div>
              <div><span className="font-medium">Registro:</span> {theme.reg || '—'}</div>
              <div><span className="font-medium">Rodapé:</span> {theme.footer || '—'}</div>
              <div><span className="font-medium">Cor:</span> {theme.color || '—'}</div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Nenhum tema personalizado vinculado a este documento.</p>
          )}
        </div>
      </div>
    </div>
  )
}
