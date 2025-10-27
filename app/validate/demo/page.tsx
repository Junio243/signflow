'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Download } from 'lucide-react'
import QRCode from 'qrcode'

export default function ValidateDemoPage() {
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    const url = typeof window !== 'undefined'
      ? window.location.origin + '/validate/demo'
      : 'https://seusite.com/validate/demo'
    QRCode.toDataURL(url, { width: 180, margin: 1 }).then(setQr).catch(() => setQr(null))
  }, [])

  const color = '#2563eb'
  const accentColor = '#059669'
  const headerPalette = {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    icon: '#059669',
    badge: 'rgba(5, 150, 105, 0.1)',
  }
  const events = useMemo(() => {
    const now = new Date()
    const minusHours = (hours: number) => {
      const d = new Date(now)
      d.setHours(d.getHours() - hours)
      return d.toISOString()
    }

    return [
      {
        id: 'evt-001',
        signer_name: 'Dra. Maria Oliveira',
        signer_reg: 'CRM/DF 12345',
        signer_email: 'maria.oliveira@exemplo.com',
        certificate_type: 'Certificado digital ICP-Brasil A3',
        certificate_issuer: 'AC VALID',
        certificate_valid_until: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()).toISOString(),
        signed_at: minusHours(6),
        logo_url: 'https://placehold.co/96x96/0f172a/ffffff?text=MO',
      },
      {
        id: 'evt-002',
        signer_name: 'Dr. Carlos Lima',
        signer_reg: 'CRM/SP 67890',
        signer_email: 'carlos.lima@exemplo.com',
        certificate_type: 'gov.br — Assinatura Avançada',
        certificate_issuer: 'gov.br',
        certificate_valid_until: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
        signed_at: minusHours(3),
        logo_url: 'https://placehold.co/96x96/1d4ed8/ffffff?text=CL',
      },
      {
        id: 'evt-003',
        signer_name: 'Enf. Juliana Souza',
        signer_reg: 'COREN/DF 556677',
        signer_email: 'juliana.souza@exemplo.com',
        certificate_type: 'Certificado digital ICP-Brasil A1',
        certificate_issuer: 'SERPRO',
        certificate_valid_until: new Date(now.getFullYear() + 1, now.getMonth() + 6, now.getDate()).toISOString(),
        signed_at: minusHours(1),
        logo_url: 'https://placehold.co/96x96/047857/ffffff?text=JS',
      },
    ]
  }, [])

  const primarySigner = useMemo(() => (events.length ? events[events.length - 1] : null), [events])
  const hasExplicitSigners = events.length > 0
  const headingLabel = hasExplicitSigners ? (events.length > 1 ? 'Signatários' : 'Signatário') : 'Signatários'

  const fallbackIssuer = 'Exemplo: Dr(a). Fulano — CRM/DF 12345'
  const fallbackReg = 'Instituição: Hospital/Clínica — CNPJ 00.000.000/0001-00'
  const fallbackCertificateType = 'Certificado digital ICP-Brasil A3'
  const fallbackCertificateIssuer = 'AC VALID'

  const issuer = primarySigner?.signer_name || null
  const reg = primarySigner?.signer_reg || null
  const certificateType = primarySigner?.certificate_type || null
  const certificateIssuer = primarySigner?.certificate_issuer || null
  const certificateValidUntilRaw = useMemo(() => {
    if (primarySigner?.certificate_valid_until) return primarySigner.certificate_valid_until
    const today = new Date()
    today.setFullYear(today.getFullYear() + 1)
    return today.toISOString().slice(0, 10)
  }, [primarySigner?.certificate_valid_until])
  const certificateValidUntil = useMemo(() => {
    const asDate = new Date(certificateValidUntilRaw)
    if (!Number.isNaN(asDate.getTime())) return asDate.toLocaleDateString()
    return certificateValidUntilRaw
  }, [certificateValidUntilRaw])
  const footer = 'Demonstração visual da validação no SignFlow (sem consulta ao banco).'

  const signedAt = useMemo(() => new Date().toLocaleString(), [])
  const documentName = 'declaração-assinada.pdf'
  const logo = primarySigner?.logo_url || null
  const issuerDisplay = issuer || fallbackIssuer
  const regDisplay = reg || fallbackReg
  const certificateTypeDisplay = certificateType || fallbackCertificateType
  const certificateIssuerDisplay = certificateIssuer || fallbackCertificateIssuer

  const handleDownload = () => {
    alert('No ambiente real, este botão abriria o PDF assinado.')
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
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
            <div style={{ fontWeight: 700, fontSize: 20 }}>Documento válido e assinado digitalmente</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Experiência demonstrativa do fluxo de validação.</div>
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
        <div>
          <h1 style={{ margin:0, fontSize:22 }}>Validação — Demo</h1>
          <div style={{ color:'#6b7280', fontSize:12 }}>ID: demo</div>
        </div>
      </div>

      <div style={{ border:`2px solid ${accentColor}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status</div>
            <div style={{ fontWeight:700, fontSize:16, color:'#065f46' }}>Assinado</div>
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
            <div style={{ fontFamily:'monospace', fontSize:13 }}>demo</div>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Baixar documento assinado (demonstração)"
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              backgroundColor: color,
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
            Baixar documento assinado
          </button>
        </div>
      </div>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'0 0 12px 0' }}>
          <h2 style={{ fontSize:18, margin:0 }}>{headingLabel}</h2>
          {!hasExplicitSigners && (
            <span
              style={{
                fontSize:11,
                textTransform:'uppercase',
                letterSpacing:0.5,
                color:'#2563eb',
                background:'rgba(37, 99, 235, 0.1)',
                borderRadius:9999,
                padding:'2px 8px',
                fontWeight:600,
              }}
            >
              Opcional
            </span>
          )}
        </div>

        {!hasExplicitSigners && (
          <div style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
            Nenhum signatário individual foi cadastrado nesta demonstração. Exibindo dados ilustrativos.
          </div>
        )}

        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          {logo && (
            <img
              src={logo}
              alt="Logo do emissor"
              style={{ height:56, objectFit:'contain', maxWidth:'100%' }}
            />
          )}
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Assinatura emitida por</div>
            <div style={{ fontWeight:600 }}>{issuerDisplay}</div>
            <div style={{ fontSize:14 }}>{regDisplay}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginTop:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Tipo de certificado</div>
            <div style={{ fontSize:14 }}>{certificateTypeDisplay}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Válido até</div>
            <div style={{ fontSize:14 }}>{certificateValidUntil}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Emissor do certificado</div>
            <div style={{ fontSize:14 }}>{certificateIssuerDisplay}</div>
          </div>
        </div>
      </section>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Validação rápida</h2>
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', alignItems:'start' }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>QR Code (demo)</div>
            {qr ? (
              <img
                src={qr}
                alt="QR Demo"
                style={{ border:'1px solid #e5e7eb', borderRadius:12, width:'100%', maxWidth:200, aspectRatio:'1 / 1', objectFit:'contain' }}
              />
            ) : (
              <div style={{ color:'#6b7280' }}>Gerando QR…</div>
            )}
            <p style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>
              Aponte sua câmera ou aplicativo leitor de QR Code para validar este documento diretamente.
            </p>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status da verificação</div>
            <div style={{ fontSize:14 }}>
              O documento foi emitido em <strong>{signedAt}</strong> e permanece com status <strong>Assinado</strong>.
            </div>
            <div style={{ fontSize:14, color:'#6b7280', marginTop:8 }}>
              Utilize o QR Code acima ou acesse o editor para gerar seu próprio PDF assinado em
              {' '}<a href="/editor" style={{ color:color, textDecoration:'underline' }}>/editor</a>.
            </div>
          </div>
        </div>
      </section>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginTop:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Histórico de assinaturas</h2>
        {events.length === 0 ? (
          <div style={{ fontSize:13, color:'#6b7280' }}>
            Nenhum evento de assinatura foi registrado nesta demonstração.
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
                    <div style={{ fontSize:13, color:'#6b7280' }}>{event.signer_reg}</div>
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
                      <div style={{ fontSize:13 }}>{event.certificate_type}</div>
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
      </section>

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
