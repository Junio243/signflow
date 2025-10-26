'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'

export default function ValidateDemoPage() {
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    const url = typeof window !== 'undefined'
      ? window.location.origin + '/validate/demo'
      : 'https://seusite.com/validate/demo'
    QRCode.toDataURL(url, { width: 180, margin: 1 }).then(setQr).catch(() => setQr(null))
  }, [])

  const color = '#2563eb'
  const issuer = 'Exemplo: Dr(a). Fulano — CRM/DF 12345'
  const reg = 'Instituição: Hospital/Clínica — CNPJ 00.000.000/0001-00'
  const certificateType = 'Certificado digital ICP-Brasil A3'
  const certificateValidUntilRaw = useMemo(() => {
    const today = new Date()
    today.setFullYear(today.getFullYear() + 1)
    return today.toISOString().slice(0, 10)
  }, [])
  const certificateValidUntil = useMemo(() => {
    const asDate = new Date(certificateValidUntilRaw)
    if (!Number.isNaN(asDate.getTime())) return asDate.toLocaleDateString()
    return certificateValidUntilRaw
  }, [certificateValidUntilRaw])
  const footer = 'Demonstração visual da validação no SignFlow (sem consulta ao banco).'

  const signedAt = useMemo(() => new Date().toLocaleString(), [])
  const documentName = 'declaração-assinada.pdf'


  const handleDownload = () => {
    alert('No ambiente real, este botão abriria o PDF assinado.')
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <div style={{ marginBottom:12 }}>
        <h1 style={{ margin:0, fontSize:22 }}>Validação — Demo</h1>
      </div>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Documento</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
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
      </section>

      <section style={{ border:`2px solid ${color}`, borderRadius:12, padding:16, marginBottom:16 }}>
        <h2 style={{ fontSize:18, margin:'0 0 12px 0' }}>Signatário</h2>
        <div style={{ fontSize:12, color:'#6b7280' }}>Assinatura emitida por</div>
        <div style={{ fontWeight:600 }}>{issuer}</div>
        <div style={{ fontSize:14 }}>{reg}</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginTop:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Tipo de certificado</div>
            <div style={{ fontSize:14 }}>{certificateType}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Válido até</div>
            <div style={{ fontSize:14 }}>{certificateValidUntil}</div>
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

      <div style={{ marginTop:12, fontSize:12, color:'#374151' }}>
        {footer}
      </div>
    </div>
  )
}
