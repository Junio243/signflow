'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Download, FileText } from 'lucide-react'

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

type SigningEvent = {
  id: string
  document_id: string
  signer_name: string
  signer_reg: string | null
  certificate_type: string | null
  certificate_issuer: string | null
  signer_email: string | null
  signed_at: string
  certificate_valid_until: string | null
  logo_url: string | null
  metadata: any | null
}

type ValidateApiResponse = {
  requires_code: boolean
  document?: Doc
  events?: SigningEvent[]
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
  const [events, setEvents] = useState<SigningEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [requiresCode, setRequiresCode] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [icpImageError, setIcpImageError] = useState(false)
  const [itiImageError, setItiImageError] = useState(false)

  useEffect(() => {
    (async () => {
      if (id === 'demo') { window.location.replace('/validate/demo'); return }
      if (!isUuid(id)) { setErrorMsg('ID inválido.'); return }
      setErrorMsg(null)
      setEventsError(null)
      setEvents([])
      setEventsLoading(true)

      try {
        const response = await fetch(`/api/validate/${id}`)
        const payload = (await response.json()) as ValidateApiResponse
        if (!response.ok) {
          setErrorMsg((payload as any)?.error || 'Erro ao carregar validação.')
          return
        }

        if (payload.requires_code) {
          setRequiresCode(true)
          setEventsLoading(false)
          return
        }

        setRequiresCode(false)
        setDoc(payload.document ?? null)
        setEvents(payload.events ?? [])
      } catch (error) {
        console.error('[Validate] Falha ao carregar validação', error)
        setErrorMsg('Não foi possível carregar a validação.')
      } finally {
        setEventsLoading(false)
      }
    })()
  }, [id])

  const theme = useMemo<Record<string, unknown>>(() => {
    const currentDoc = doc
    if (!currentDoc) return {} as Record<string, unknown>

    let snap: unknown = currentDoc.validation_theme_snapshot ?? null

    if (
      (!snap || typeof snap !== 'object' || Array.isArray(snap)) &&
      currentDoc.metadata &&
      typeof currentDoc.metadata === 'object' &&
      !Array.isArray(currentDoc.metadata)
    ) {
      const meta = currentDoc.metadata as Record<string, unknown>
      const fallbackSnap = (meta.validation_theme_snapshot ?? meta.theme) as unknown
      if (fallbackSnap && typeof fallbackSnap === 'object' && !Array.isArray(fallbackSnap)) {
        snap = fallbackSnap
      }
    }

    if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
      return snap as Record<string, unknown>
    }

    return {} as Record<string, unknown>
  }, [doc])

  const safeTrim = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

  const readThemeString = (snapshot: Record<string, unknown>, key: string, fallback = '') => {
    const raw = snapshot[key]
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed) return trimmed
    }
    return fallback
  }

  const color = readThemeString(theme, 'color', '#2563eb')
  const primarySigner = useMemo(() => (events.length ? events[events.length - 1] : null), [events])

  const issuerFromTheme = readThemeString(theme, 'issuer', 'Instituição/Profissional')
  const regFromTheme = readThemeString(theme, 'reg', 'Registro')
  const issuer = safeTrim(primarySigner?.signer_name) || issuerFromTheme
  const reg = safeTrim(primarySigner?.signer_reg) || regFromTheme
  const footer = typeof theme.footer === 'string' ? theme.footer : ''
  const primaryLogo = safeTrim(primarySigner?.logo_url)
  const themeLogo = readThemeString(theme, 'logo_url')
  const logo = primaryLogo
    ? primaryLogo
    : themeLogo
      ? themeLogo
      : null
  const certificateTypeFromTheme = readThemeString(theme, 'certificate_type', 'Certificado digital (modelo padrão)')
  const certificateType = safeTrim(primarySigner?.certificate_type) || certificateTypeFromTheme
  const certificateIssuerFromTheme = readThemeString(theme, 'certificate_issuer')
  const certificateIssuer = safeTrim(primarySigner?.certificate_issuer) || certificateIssuerFromTheme || null
  const certificateValidUntilFromTheme = readThemeString(theme, 'certificate_valid_until')
  const certificateValidUntilValue = safeTrim(primarySigner?.certificate_valid_until) || certificateValidUntilFromTheme

  const certificateValidUntil = useMemo(() => {
    if (!certificateValidUntilValue) return null
    const asDate = new Date(certificateValidUntilValue)
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleDateString()
    }
    return certificateValidUntilValue
  }, [certificateValidUntilValue])
  const canceledSubtitle = useMemo(() => {
    const canceledAtRaw = doc?.canceled_at
    if (!canceledAtRaw) return 'Documento não é mais válido.'

    const canceledAtDate = new Date(canceledAtRaw)
    if (!Number.isNaN(canceledAtDate.getTime())) {
      return `Cancelado em ${canceledAtDate.toLocaleString()}`
    }

    return 'Documento não é mais válido.'
  }, [doc?.canceled_at])

  const st = (doc?.status || '').toLowerCase()
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
        subtitle: canceledSubtitle
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

  const documentName = doc?.original_pdf_name || 'Documento assinado'
  const signedAt = useMemo(() => {
    const createdAtRaw = doc?.created_at
    if (!createdAtRaw) return 'Data não informada'

    const createdAt = new Date(createdAtRaw)
    return !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString()
      : 'Data não informada'
  }, [doc?.created_at])

  const handleGenerateReport = async () => {
    if (!doc) return
    
    setGeneratingReport(true)
    try {
      // Abre o relatório em uma nova janela
      const reportUrl = `/api/validate/${id}/report`
      window.open(reportUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('[Validate] Erro ao gerar relatório:', error)
      alert('Não foi possível gerar o relatório. Por favor, tente novamente.')
    } finally {
      // Aguarda um pouco para dar tempo de abrir a janela
      setTimeout(() => setGeneratingReport(false), 500)
    }
  }

  if (errorMsg) return <p style={{ padding:16 }}>Erro: {errorMsg}</p>
  if (eventsLoading) return <p style={{ padding:16 }}>Carregando…</p>

  if (requiresCode && !doc) {
    const handleValidateAccess = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setAccessError(null)
      setEventsLoading(true)

      try {
        const response = await fetch(`/api/validate/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: accessCode.trim() }),
        })
        const payload = (await response.json()) as ValidateApiResponse & { error?: string }
        if (!response.ok) {
          setAccessError(payload.error || 'Código inválido.')
          return
        }

        setDoc(payload.document ?? null)
        setEvents(payload.events ?? [])
        setRequiresCode(false)
      } catch (error) {
        console.error('[Validate] Falha ao validar código', error)
        setAccessError('Não foi possível validar o código.')
      } finally {
        setEventsLoading(false)
      }
    }

    return (
      <div style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Validação protegida</h1>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>
            Este documento exige um código de validação para exibir os detalhes.
          </p>
          <form onSubmit={handleValidateAccess} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280' }}>
              Código de validação
            </label>
            <input
              value={accessCode}
              onChange={event => setAccessCode(event.target.value.toUpperCase())}
              placeholder="Informe o código"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 16,
              }}
            />
            {accessError && (
              <div style={{ color: '#b91c1c', fontSize: 13 }}>
                {accessError}
              </div>
            )}
            <button
              type="submit"
              disabled={eventsLoading}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: eventsLoading ? 0.7 : 1,
              }}
            >
              {eventsLoading ? 'Validando…' : 'Validar código'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!doc) return <p style={{ padding:16 }}>Documento não disponível.</p>

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
              {!icpImageError ? (
                <img
                  src="/seals/icp-brasil.png"
                  alt="Selo ICP-Brasil"
                  style={{ height: 48, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#fff', objectFit: 'contain', padding: 4 }}
                  onError={() => setIcpImageError(true)}
                />
              ) : (
                <div style={{ height: 48, width: 48, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280' }}>
                  ICP-BR
                </div>
              )}
              {!itiImageError ? (
                <img
                  src="/seals/iti.png"
                  alt="Selo ITI - Instituto Nacional de Tecnologia da Informação"
                  style={{ height: 48, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#fff', objectFit: 'contain', padding: 4 }}
                  onError={() => setItiImageError(true)}
                />
              ) : (
                <div style={{ height: 48, width: 48, borderRadius: 8, border: `1px solid ${headerPalette.border}`, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280' }}>
                  ITI
                </div>
              )}
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

        <div style={{ marginTop:16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
          
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            aria-label="Gerar relatório de autenticidade"
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              backgroundColor: '#10b981',
              color:'#fff',
              border:'none',
              borderRadius:9999,
              padding:'10px 18px',
              fontWeight:600,
              cursor: generatingReport ? 'not-allowed' : 'pointer',
              boxShadow:'0 10px 25px rgba(16,185,129,0.15)',
              opacity: generatingReport ? 0.7 : 1
            }}
          >
            <FileText size={18} />
            {generatingReport ? 'Gerando relatório...' : 'Gerar relatório de autenticidade'}
          </button>
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
          {certificateIssuer && (
            <div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Emissor do certificado</div>
              <div style={{ fontSize:14 }}>{certificateIssuer}</div>
            </div>
          )}
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

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginTop:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Histórico de assinaturas</h2>
        {eventsLoading ? (
          <div style={{ fontSize:13, color:'#6b7280' }}>Carregando histórico…</div>
        ) : events.length === 0 ? (
          <div style={{ fontSize:13, color:'#6b7280' }}>
            Nenhum evento de assinatura foi registrado para este documento.
          </div>
        ) : (
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
            {events.map(event => {
              const signedAtDisplay = (() => {
                const date = new Date(event.signed_at)
                return Number.isNaN(date.getTime()) ? event.signed_at : date.toLocaleString()
              })()
              const validUntilDisplay = (() => {
                if (!event.certificate_valid_until) return 'Validade não informada'
                const date = new Date(event.certificate_valid_until)
                return Number.isNaN(date.getTime()) ? event.certificate_valid_until : date.toLocaleDateString()
              })()

              return (
                <li
                  key={event.id}
                  style={{
                    display:'flex',
                    gap:16,
                    alignItems:'flex-start',
                    border:'1px solid #e5e7eb',
                    borderRadius:12,
                    background:'#fff',
                    padding:16,
                  }}
                >
                  {event.logo_url ? (
                    <img
                      src={event.logo_url}
                      alt={`Logo de ${event.signer_name}`}
                      style={{ width:64, height:64, objectFit:'contain', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff' }}
                    />
                  ) : (
                    <div
                      style={{
                        width:64,
                        height:64,
                        borderRadius:8,
                        border:'1px dashed #cbd5f5',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        fontSize:11,
                        color:'#6b7280',
                        background:'#f8fafc',
                        textAlign:'center',
                        padding:4,
                      }}
                    >
                      Sem logo
                    </div>
                  )}

                  <div style={{ flex:'1 1 auto', minWidth:0, display:'grid', gap:8 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:16 }}>{event.signer_name}</div>
                      <div style={{ fontSize:13, color:'#6b7280' }}>{event.signer_reg || 'Registro não informado'}</div>
                      {event.signer_email && (
                        <div style={{ fontSize:12, color:'#6b7280' }}>{event.signer_email}</div>
                      )}
                    </div>
                    <div style={{ fontSize:13 }}>
                      <strong>Assinado em:</strong> {signedAtDisplay}
                    </div>
                    <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      <div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>Certificado</div>
                        <div style={{ fontSize:13 }}>{event.certificate_type || 'Tipo não informado'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>Validade</div>
                        <div style={{ fontSize:13 }}>{validUntilDisplay}</div>
                      </div>
                      {event.certificate_issuer && (
                        <div>
                          <div style={{ fontSize:12, color:'#6b7280' }}>Emissor</div>
                          <div style={{ fontSize:13 }}>{event.certificate_issuer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {eventsError && (
          <div style={{ marginTop:12, fontSize:12, color:'#b91c1c' }}>
            Não foi possível carregar o histórico completo agora: {eventsError}.
          </div>
        )}
      </section>

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
