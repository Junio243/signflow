'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
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
  const issuer = 'Exemplo: Dr(a). Fulano — CRM/DF 12345'
  const reg = 'Instituição: Hospital/Clínica — CNPJ 00.000.000/0001-00'
  const footer = 'Demonstração visual da validação no SignFlow (sem consulta ao banco).'

  const createdAt = new Date().toLocaleString()

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

      <div style={{ border:`2px solid ${accentColor}`, borderRadius:12, padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Status</div>
            <div style={{ fontWeight:700, fontSize:16, color:'#065f46' }}>signed</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Assinado em</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{createdAt}</div>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Assinatura emitida por</div>
          <div style={{ fontWeight:600 }}>{issuer}</div>
          <div style={{ fontSize:14 }}>{reg}</div>
        </div>

        <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>QR Code (demo)</div>
            {qr ? (
              <img src={qr} alt="QR Demo" style={{ border:'1px solid #e5e7eb', borderRadius:8, width:160, height:160, objectFit:'contain' }} />
            ) : (
              <div style={{ color:'#6b7280' }}>Gerando QR…</div>
            )}
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>PDF Assinado</div>
            <div style={{ color:'#6b7280' }}>Exemplo — gere um PDF assinado em <a href="/editor" style={{ textDecoration:'underline' }}>/editor</a>.</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
