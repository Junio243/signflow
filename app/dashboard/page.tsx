'use client'

/* Editor com:
   - Layout mais clean (cards)
   - Assinatura: desenhar OU importar imagem (PNG/JPG)
   - Slider de tamanho: assinatura e QR
   - Posição por clique (todas as páginas)
   - Seleção de Perfil de Validação (salvo no Supabase)
   - Gera QR, assina com pdf-lib, salva Storage, atualiza documents e redireciona
*/

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabaseClient'

type Profile = { id: string; name: string; type: string }

export default function EditorPage() {
  const router = useRouter()

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null)

  // Assinatura
  const [sigMode, setSigMode] = useState<'draw'|'upload'>('draw')
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [drewSomething, setDrewSomething] = useState(false)
  const [sigImgFile, setSigImgFile] = useState<File | null>(null)
  const [sigImgPreview, setSigImgPreview] = useState<string | null>(null)

  // Tamanhos
  const [sigWidth, setSigWidth] = useState<number>(180) // px
  const [qrSize, setQrSize] = useState<number>(110) // px

  // Posição normalizada 0..1
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)
  const previewBoxRef = useRef<HTMLDivElement | null>(null)

  // Perfis de validação
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // ====== UI helpers ======
  const Card: React.FC<React.PropsWithChildren<{title?: string; right?: React.ReactNode}>> = ({ title, right, children }) => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: title ? 12 : 0 }}>
        {title && <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>}
        {right}
      </div>
      {children}
    </div>
  )

  // ====== Canvas assinatura (draw) ======
  useEffect(() => {
    const cvs = signCanvasRef.current
    if (!cvs) return
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const cssW = Math.min(640, cvs.parentElement ? cvs.parentElement.clientWidth : 640)
      const cssH = 180
      cvs.style.width = cssW + 'px'
      cvs.style.height = cssH + 'px'
      cvs.width = Math.floor(cssW * ratio)
      cvs.height = Math.floor(cssH * ratio)
      const ctx = cvs.getContext('2d')!
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, cssW, cssH)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#111'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getCtx = () => signCanvasRef.current!.getContext('2d')!
  const onPD = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true)
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
    getCtx().beginPath()
    getCtx().moveTo(e.clientX - r.left, e.clientY - r.top)
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }
  const onPM = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    setDrewSomething(true)
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
    getCtx().lineTo(e.clientX - r.left, e.clientY - r.top)
    getCtx().stroke()
  }
  const onPU = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(false)
    ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
  }
  const clearSignature = () => {
    if (sigMode === 'draw') {
      const cvs = signCanvasRef.current!
      const ctx = cvs.getContext('2d')!
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      setDrewSomething(false)
    } else {
      setSigImgFile(null)
      setSigImgPreview(null)
    }
  }

  // ====== PDF preview & click ======
  const onPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setPdfFile(f)
    setNormX(null); setNormY(null)
    if (!f) { setPdfUrl(null); setPdfBytes(null); return }
    setPdfUrl(URL.createObjectURL(f))
    setPdfBytes(await f.arrayBuffer())
    setInfo('Clique na prévia para posicionar (assina todas as páginas).')
  }
  const onPreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = previewBoxRef.current!
    const r = box.getBoundingClientRect()
    setNormX(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
    setNormY(Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)))
  }
  const Marker = () => (normX===null||normY===null)?null:(
    <div style={{
      position:'absolute', left:`${normX*100}%`, top:`${normY*100}%`,
      transform:'translate(-50%,-50%)', width:12, height:12, borderRadius:999,
      background:'#2563eb', border:'2px solid #fff', boxShadow:'0 0 0 1px #2563eb', pointerEvents:'none'
    }}/>
  )

  // ====== Perfis de validação ======
  useEffect(() => {
    const load = async () => {
      const s = await supabase.auth.getSession()
      if (!s.data?.session) return
      const { data, error } = await supabase
        .from('validation_profiles')
        .select('id, name, type')
        .order('created_at', { ascending: false })
      if (!error) setProfiles(data || [])
    }
    load()
  }, [])

  // ====== Utils ======
  const dataUrlToBlob = async (dataUrl: string) => fetch(dataUrl).then(r => r.blob())
  const canvasToDataURL = () => signCanvasRef.current!.toDataURL('image/png')

  // ====== Core: assinar & salvar ======
  const assinarESalvar = async () => {
    try {
      setBusy(true); setInfo(null)

      // exige login
      const { data: sess } = await supabase.auth.getSession()
      if (!sess?.session) { window.location.href = '/login?next=/editor'; return }

      if (!pdfBytes || !pdfFile) { setInfo('Envie um PDF primeiro.'); return }

      // valida assinatura
      let signatureBytes: ArrayBuffer | null = null
      if (sigMode === 'draw') {
        // precisa ter algo desenhado
        if (!drewSomething) { setInfo('Desenhe sua assinatura.'); return }
        signatureBytes = await fetch(canvasToDataURL()).then(r=>r.arrayBuffer())
      } else {
        if (!sigImgFile) { setInfo('Envie a imagem da assinatura.'); return }
        signatureBytes = await sigImgFile.arrayBuffer()
      }

      // cria rascunho no banco (inclui nome + expiração)
      const originalName = pdfFile.name || 'upload.pdf'
      const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)

      const { data: inserted, error: insErr } = await supabase
        .from('documents')
        .insert({ status:'draft', original_pdf_name: originalName, expires_at: expiresAt, validation_profile_id: profileId })
        .select('id')
        .single()
      if (insErr || !inserted?.id) { setInfo('Erro ao criar registro: '+(insErr?.message??'desconhecido')); return }
      const id: string = inserted.id

      // gera QR
      const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
      const validateUrl = `${base}/validate/${id}`
      const qrDataUrl = await QRCode.toDataURL(validateUrl, { width: Math.max(64, Math.min(300, qrSize)), margin: 1 })

      // monta PDF
      const pdfDoc = await PDFDocument.load(pdfBytes)

      // embed assinatura (png/jpg)
      const mime = sigMode==='upload' ? (sigImgFile?.type||'image/png') : 'image/png'
      const isJpg = mime.includes('jpeg') || mime.includes('jpg')
      const sigImg = isJpg
        ? await pdfDoc.embedJpg(signatureBytes!)
        : await pdfDoc.embedPng(signatureBytes!)

      const qrBytes = await fetch(qrDataUrl).then(r=>r.arrayBuffer())
      const qrImg = await pdfDoc.embedPng(qrBytes)

      const sigW = sigWidth
      const sigH = (sigW / sigImg.width) * sigImg.height
      const qrW = Math.max(64, Math.min(300, qrSize))
      const qrH = qrW

      const pages = pdfDoc.getPages()
      pages.forEach((page:any) => {
        const { width, height } = page.getSize()
        let px = width - sigW - 36
        let py = 36
        if (normX!==null && normY!==null) {
          px = normX * width
          py = height - normY * height
        }
        px = Math.max(12, Math.min(width - sigW - 12, px))
        py = Math.max(12, Math.min(height - sigH - 12, py))

        page.drawImage(sigImg, { x:px, y:py, width:sigW, height:sigH, opacity:0.98 })

        const qx = Math.max(12, px - qrW - 12)
        const qy = py
        page.drawImage(qrImg, { x: qx, y: qy, width: qrW, height: qrH, opacity: 0.98 })
      })

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type:'application/pdf' })

      // upload
      const pdfPath = `${id}/signed.pdf`
      const qrPath = `${id}/qr.png`

      const up1 = await supabase.storage.from('signflow').upload(pdfPath, outBlob, { contentType:'application/pdf', upsert:true })
      if (up1.error) { setInfo('Não consegui salvar o PDF no Storage.'); return }

      const up2 = await supabase.storage.from('signflow').upload(qrPath, await dataUrlToBlob(qrDataUrl), { contentType:'image/png', upsert:true })
      if (up2.error) console.warn('QR upload:', up2.error)

      const pubPdf = await supabase.storage.from('signflow').getPublicUrl(pdfPath)
      const pubQr  = await supabase.storage.from('signflow').getPublicUrl(qrPath)

      // update
      const { error: updErr } = await supabase
        .from('documents')
        .update({
          status:'signed',
          signed_pdf_url: pubPdf.data?.publicUrl ?? null,
          qr_code_url:    pubQr.data?.publicUrl ?? null,
          validation_profile_id: profileId ?? null
        })
        .eq('id', id)
      if (updErr) { setInfo('Arquivo salvo, mas não consegui atualizar o registro.'); return }

      router.push(`/validate/${id}`)
    } catch (e) {
      console.error(e)
      setInfo('Falha ao assinar/salvar.')
    } finally {
      setBusy(false)
    }
  }

  // ====== Render ======
  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Editor de Documento</h1>
      <p style={{ marginTop: -6, color: '#6b7280' }}>Envie o PDF, escolha a assinatura (desenhar ou importar), clique na prévia para posicionar, ajuste o tamanho do QR e salve.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Coluna esquerda: Prévia */}
        <Card title="Prévia do PDF (clique para posicionar)">
          <div
            ref={previewBoxRef}
            style={{ position:'relative', width:'100%', height:560, border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', background:'#fafafa' }}
          >
            {pdfUrl ? (
              <>
                <object data={pdfUrl} type="application/pdf" width="100%" height="100%"></object>
                <div onClick={onPreviewClick} title="Clique para escolher a posição" style={{ position:'absolute', inset:0, cursor:'crosshair' }} />
                <Marker />
              </>
            ) : (
              <div style={{ padding: 12, color: '#6b7280' }}>Envie um PDF para visualizar aqui.</div>
            )}
          </div>
        </Card>

        {/* Coluna direita: Controles */}
        <div style={{ display:'grid', gap:16 }}>
          <Card title="1) Envio do PDF">
            <input type="file" accept="application/pdf" onChange={onPdfChange} />
          </Card>

          <Card title="2) Assinatura" right={
            <div style={{ display:'flex', gap:8 }}>
              <label><input type="radio" checked={sigMode==='draw'} onChange={() => setSigMode('draw')} /> Desenhar</label>
              <label><input type="radio" checked={sigMode==='upload'} onChange={() => setSigMode('upload')} /> Importar</label>
            </div>
          }>
            {sigMode === 'draw' ? (
              <>
                <canvas
                  ref={signCanvasRef}
                  onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={()=>setDrawing(false)}
                  style={{ width:'100%', height:180, border:'1px dashed #94a3b8', borderRadius:8, background:'#fff', touchAction:'none' }}
                />
                <div style={{ marginTop: 8 }}>
                  <button onClick={clearSignature} disabled={busy}>Limpar</button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="file" accept="image/png,image/jpeg"
                  onChange={(e)=> {
                    const f = e.target.files?.[0] || null
                    setSigImgFile(f)
                    setSigImgPreview(f ? URL.createObjectURL(f) : null)
                  }}
                />
                {sigImgPreview && (
                  <div style={{ marginTop:8 }}>
                    <img src={sigImgPreview} alt="Prévia assinatura" style={{ maxWidth:'100%', border:'1px dashed #94a3b8', borderRadius:8 }} />
                  </div>
                )}
                <div style={{ marginTop:8 }}>
                  <button onClick={clearSignature} disabled={busy}>Remover imagem</button>
                </div>
              </>
            )}
          </Card>

          <Card title="3) Tamanhos">
            <div style={{ display:'grid', gap:8 }}>
              <label>Assinatura: {sigWidth}px
                <input type="range" min={100} max={320} value={sigWidth} onChange={e=>setSigWidth(parseInt(e.target.value))} />
              </label>
              <label>QR Code: {qrSize}px
                <input type="range" min={64} max={300} value={qrSize} onChange={e=>setQrSize(parseInt(e.target.value))} />
              </label>
            </div>
          </Card>

          <Card title="4) Perfil de Validação" right={<a href="/appearance" style={{ textDecoration:'underline' }}>Gerenciar perfis</a>}>
            {profiles.length === 0 ? (
              <div style={{ color:'#6b7280' }}>Nenhum perfil ainda. Clique em <a href="/appearance" style={{ textDecoration:'underline' }}>Gerenciar perfis</a> para criar “Médico/Faculdade/Genérico”.</div>
            ) : (
              <select value={profileId ?? ''} onChange={(e)=>setProfileId(e.target.value || null)} style={{ width:'100%', padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                <option value="">(Sem perfil)</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} — {p.type}</option>)}
              </select>
            )}
          </Card>

          <Card>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={assinarESalvar} disabled={busy || !pdfBytes || (sigMode==='draw' && !drewSomething) || (sigMode==='upload' && !sigImgFile)}>
                {busy ? 'Processando…' : 'Assinar & Salvar'}
              </button>
              <button onClick={()=>router.push('/dashboard')} disabled={busy}>Voltar à Dashboard</button>
            </div>
            {info && <p style={{ marginTop: 8 }}>{info}</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
