'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Download } from 'lucide-react'

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

  const theme = useMemo(() => {
    let snap = doc.validation_theme_snapshot || null
    if (!snap && doc.metadata && typeof doc.metadata === 'object') {
      const meta = doc.metadata as any
      snap = meta.validation_theme_snapshot || meta.theme || null
    }

    if (snap && typeof snap === 'object') {
      return snap as Record<string, unknown>
    }

    return {}
  }, [doc])

  const color = typeof theme.color === 'string' && theme.color.trim() ? theme.color : '#2563eb'
  const issuer = typeof theme.issuer === 'string' && theme.issuer.trim() ? theme.issuer : 'Instituição/Profissional'
  const reg = typeof theme.reg === 'string' && theme.reg.trim() ? theme.reg : 'Registro'
  const footer = typeof theme.footer === 'string' ? theme.footer : ''
  const logo = typeof theme.logo_url === 'string' ? theme.logo_url : null
  const certificateType = typeof theme.certificate_type === 'string' && theme.certificate_type.trim()
    ? theme.certificate_type
    : 'Certificado digital (modelo padrão)'
  const certificateValidUntilRaw = theme.certificate_valid_until as string | null | undefined
  const certificateValidUntilValue = typeof certificateValidUntilRaw === 'string'
    ? certificateValidUntilRaw
    : certificateValidUntilRaw != null
      ? String(certificateValidUntilRaw)
      : null

  const certificateValidUntil = useMemo(() => {
    if (!certificateValidUntilValue) return null
    const asDate = new Date(certificateValidUntilValue)
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleDateString()
    }
    return certificateValidUntilValue
  }, [certificateValidUntilValue])
  const st = (doc.status || '').toLowerCase()
  const isCanceled = st === 'canceled'
  const isExpired = st === 'expired'
  const accentColor = isCanceled
    ? '#b91c1c'
    : isExpired
      ? '#b45309'
      : color
  const headerPalette = isCanceled
    ? {
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        icon: '#b91c1c',
        badge: 'rgba(185, 28, 28, 0.1)',
        message: 'Documento cancelado',
        subtitle: doc.canceled_at
          ? `Cancelado em ${new Date(doc.canceled_at).toLocaleString()}`
          : 'Documento não é mais válido.'
      }
    : isExpired
      ? {
          bg: '#fffbeb',
          border: '#fef08a',
          text: '#92400e',
          icon: '#b45309',
          badge: 'rgba(180, 83, 9, 0.12)',
          message: 'Documento expirado',
          subtitle: 'A assinatura não é mais válida após o vencimento.'
        }
      : {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#047857',
          icon: '#059669',
          badge: 'rgba(5, 150, 105, 0.1)',
          message: 'Documento válido e assinado digitalmente',
          subtitle: 'Emitido com certificados reconhecidos pela ICP-Brasil.'
        }

  const documentName = doc.original_pdf_name || 'Documento assinado'
  const signedAt = useMemo(() => {
    const createdAt = doc.created_at ? new Date(doc.created_at) : null
    return createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString()
      : 'Data não informada'
  }, [doc.created_at])

  const handleDownload = () => {
    if (!doc.signed_pdf_url) return
    window.open(doc.signed_pdf_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ maxWidth: 900, margin:'24px auto', padding:16 }}>
      <div
        style={{
          border: `1px solid ${headerPalette.border}`,
          background: headerPalette.bg,
          color: headerPalette.text,
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: headerPalette.badge,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={28} color={headerPalette.icon} strokeWidth={2.5} />
          </div>
          <div style={{ flex: '1 1 auto', minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{headerPalette.message}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{headerPalette.subtitle}</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minWidth: 200,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>
              Selos oficiais
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src="/seals/icp-brasil.svg"
                alt="Selo ICP-Brasil"
                style={{ height: 42, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#fff' }}
              />
              <img
                src="/seals/dataprev.svg"
                alt="Selo Dataprev / gov.br"
                style={{ height: 42, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#fff' }}
              />
            </div>
          </div>
        </div>
      </div>

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
      {isExpired && (
        <div style={{ marginBottom:12, padding:12, border:'1px solid #fde68a', background:'#fffbeb', borderRadius:8, color:'#92400e' }}>
          Este documento está <strong>expirado</strong> e não deve ser considerado válido.
        </div>
      )}

      <div style={{ border:`2px solid ${accentColor}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{statusPt(doc.status)}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Assinado em</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{signedAt}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Nome do arquivo</div>
            <div style={{ fontSize:14 }}>{documentName}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>ID do documento</div>
            <div style={{ fontFamily:'monospace', fontSize:13, wordBreak:'break-all' }}>{doc.id}</div>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          {doc.signed_pdf_url ? (
            <button
              type="button"
              onClick={handleDownload}
              aria-label={isCanceled ? 'Baixar documento cancelado' : 'Baixar documento assinado'}
              style={{
                display:'inline-flex',
                alignItems:'center',
                gap:8,
                backgroundColor: isCanceled ? '#7f1d1d' : color,
                color:'#fff',
                border:'none',
                borderRadius:9999,
                padding:'10px 18px',
                fontWeight:600,
                cursor:'pointer',
                boxShadow:'0 10px 25px rgba(37,99,235,0.15)'
              }}
            >
              <Download size={18} />
              {isCanceled ? 'Baixar documento (cancelado)' : 'Baixar documento assinado'}
            </button>
          ) : (
            <div style={{ color:'#6b7280', fontSize:14 }}>PDF assinado ainda não gerado.</div>
          )}
        </div>
      </div>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Signatário</h2>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
          {logo && (
            <img
              src={logo}
              alt="Logo do emissor"
              style={{ height:56, objectFit:'contain', maxWidth:'100%' }}
            />
          )}
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Assinatura emitida por</div>
            <div style={{ fontWeight:600 }}>{issuer}</div>
            <div style={{ fontSize:14 }}>{reg}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginTop:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Tipo de certificado</div>
            <div style={{ fontSize:14 }}>{certificateType}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Válido até</div>
            <div style={{ fontSize:14 }}>{certificateValidUntil ?? 'Validade não informada'}</div>
          </div>
        </div>
      </section>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Validação rápida</h2>
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', alignItems:'start' }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>QR Code</div>
            {doc.qr_code_url ? (
              <img
                src={doc.qr_code_url}
                alt="QR Code"
                style={{
                  border:'1px solid #e5e7eb',
                  borderRadius:8,
                  width:160,
                  height:160,
                  objectFit:'contain',
                  filter: isCanceled || isExpired ? 'grayscale(1)' : 'none'
                }}
              />
            ) : <div style={{ color:'#6b7280' }}>Sem QR disponível.</div>}
            <p style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>
              Aponte sua câmera ou aplicativo leitor de QR Code para validar este documento diretamente.
            </p>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>PDF Assinado</div>
            {doc.signed_pdf_url ? (
              <a href={doc.signed_pdf_url} target="_blank" rel="noopener noreferrer" style={{ color:isCanceled ? '#7f1d1d' : isExpired ? '#b45309' : color, textDecoration:'underline' }}>
                {isCanceled ? 'Baixar (cancelado)' : isExpired ? 'Baixar (expirado)' : 'Baixar PDF'}
              </a>
            ) : <div style={{ color:'#6b7280' }}>Ainda não gerado.</div>}
            <div style={{ fontSize:12, color:'#6b7280', marginTop:12 }}>
              O documento foi emitido em <strong>{signedAt}</strong> e permanece com status <strong>{statusPt(doc.status)}</strong>.
            </div>
            {isCanceled && (
              <div style={{ color:'#7f1d1d', fontSize:14, marginTop:8 }}>
                Atenção: este documento foi cancelado. Utilize o QR apenas para auditoria.
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
