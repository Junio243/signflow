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
}

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [doc, setDoc] = useState<Doc | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, validation_theme_snapshot')
        .eq('id', id).maybeSingle()
      if (error) { setErrorMsg(error.message); return }
      setDoc(data as Doc)
    })()
  }, [id])

  if (errorMsg) return <p style={{ padding:16 }}>Erro: {errorMsg}</p>
  if (!doc) return <p style={{ padding:16 }}>Carregando…</p>

  const snap = doc.validation_theme_snapshot || {}
  const color = snap.color || '#2563eb'
  const issuer = snap.issuer || 'Instituição/Profissional'
  const reg = snap.reg || 'Registro'
  const footer = snap.footer || 'Documento assinado digitalmente via SignFlow.'
  const logo = snap.logo_url || null

  return (
    <div style={{ maxWidth: 900, margin:'24px auto', padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        {logo && <img src={logo} alt="logo" style={{ height:48, objectFit:'contain' }} />}
        <div>
          <h1 style={{ margin:0, fontSize:22 }}>Validação do Documento</h1>
          <div style={{ color:'#6b7280', fontSize:12 }}>ID: {doc.id}</div>
        </div>
      </div>

      <div style={{ border:`2px solid ${color}`, borderRadius:12, padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{doc.status ?? '—'}</div>
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
              <img src={doc.qr_code_url} alt="QR Code" style={{ border:'1px solid #e5e7eb', borderRadius:8, width:160, height:160, objectFit:'contain' }} />
            ) : <div style={{ color:'#6b7280' }}>Sem QR disponível.</div>}
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>PDF Assinado</div>
            {doc.signed_pdf_url ? (
              <a href={doc.signed_pdf_url} target="_blank" style={{ color:color, textDecoration:'underline' }}>Baixar PDF</a>
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
