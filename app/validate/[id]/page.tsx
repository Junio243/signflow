'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name: string | null
  validation_theme_snapshot: any | null
  metadata: any | null
  canceled_at?: string | null
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

function statusPt(status?: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'signed': return 'Assinado'
    case 'draft': return 'Rascunho'
    case 'canceled': return 'Cancelado'
    case 'expired': return 'Expirado'
    default: return status || '—'
  }
}

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [doc, setDoc] = useState<Doc | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (id === 'demo') { window.location.replace('/validate/demo'); return }
      if (!isUuid(id)) { setErrorMsg('ID inválido.'); return }

      const { data, error } = await supabase
        .from('documents')
        .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, validation_theme_snapshot, metadata, canceled_at')
        .eq('id', id).maybeSingle()

      if (error) { setErrorMsg(error.message); return }
      setDoc(data as Doc)
    })()
  }, [id])

  if (errorMsg) return <p style={{ padding:16 }}>Erro: {errorMsg}</p>
  if (!doc) return <p style={{ padding:16 }}>Carregando…</p>

  let snap = doc.validation_theme_snapshot || null
  if (!snap && doc.metadata && typeof doc.metadata === 'object') {
    const meta = doc.metadata as any
    snap = meta.validation_theme_snapshot || meta.theme || null
  }
  const theme = snap || {}
  const color = theme.color || '#2563eb'
  const issuer = theme.issuer || 'Instituição/Profissional'
  const reg = theme.reg || 'Registro'
  const footer = theme.footer || ''
  const logo = theme.logo_url || null
  const st = (doc.status || '').toLowerCase()
  const isCanceled = st === 'canceled'

  return (
    <div style={{ maxWidth: 900, margin:'24px auto', padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        {logo && <img src={logo} alt="logo" style={{ height:48, objectFit:'contain' }} />}
        <div>
          <h1 style={{ margin:0, fontSize:22 }}>Validação do Documento</h1>
          <div style={{ color:'#6b7280', fontSize:12 }}>ID: {doc.id}</div>
        </div>
      </div>

      {isCanceled && (
        <div style={{ marginBottom:12, padding:12, border:'1px solid #fecaca', background:'#fef2f2', borderRadius:8, color:'#7f1d1d' }}>
          Este documento foi <strong>cancelado</strong> em {doc.canceled_at ? new Date(doc.canceled_at).toLocaleString() : 'data não informada'}.
          O QR e o PDF abaixo são mantidos apenas para auditoria.
        </div>
      )}

      <div style={{ border:`2px solid ${color}`, borderRadius:12, padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{statusPt(doc.status)}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Assinado em</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{new Date(doc.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Assinatura emitida por</div>
          <div style={{ fontWeight:600 }}>{issuer}</div>
          <div style={{ fontSize:14 }}>{reg}</div>
        </div>

        <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>QR Code</div>
            {doc.qr_code_url ? (
              <img src={doc.qr_code_url} alt="QR Code" style={{ border:'1px solid #e5e7eb', borderRadius:8, width:160, height:160, objectFit:'contain', filter: isCanceled ? 'grayscale(1)' : 'none' }} />
            ) : <div style={{ color:'#6b7280' }}>Sem QR disponível.</div>}
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>PDF Assinado</div>
            {doc.signed_pdf_url ? (
              <a href={doc.signed_pdf_url} target="_blank" style={{ color:isCanceled ? '#7f1d1d' : color, textDecoration:'underline' }}>
                {isCanceled ? 'Baixar (cancelado)' : 'Baixar PDF'}
              </a>
            ) : <div style={{ color:'#6b7280' }}>Ainda não gerado.</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
