// app/editor/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabaseClient'

type Profile = { id: string; name: string; type: 'medico'|'faculdade'|'generico'; theme: any }

const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const IconDraw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 3l5 5L8 21H3v-5L16 3z" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5h13l3 3v11a2 2 0 01-2 2z" stroke="#111" strokeWidth="2"/><path d="M7 3v6h8V3" stroke="#111" strokeWidth="2"/></svg>
)

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
  const [qrSize, setQrSize] = useState<number>(120) // px

  // Posição normalizada 0..1
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)

  // Perfis (com theme)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // ====== NOVOS: guardar traços do desenho para não sumirem ======
  const strokesRef = useRef<Array<Array<{x:number,y:number}>>>([]);
  const currentStrokeRef = useRef<Array<{x:number,y:number}> | null>(null);

  // ====== UI helper ======
  const Card: React.FC<React.PropsWithChildren<{title?: string; right?: React.ReactNode}>> = ({ title, right, children }) => (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, boxShadow:'0 1px 2px rgba(0,0,0,.03)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: title ? 12 : 0 }}>
        {title && <h2 style={{ margin:0, fontSize:16 }}>{title}</h2>}
        {right}
      </div>
      {children}
    </div>
  )

  // estilo para destacar botões
  const buttonStyle: React.CSSProperties = {
    display:'inline-flex',
    alignItems:'center',
    gap:6,
    padding:'8px 12px',
    border:'1px solid #e5e7eb',
    borderRadius:8,
    background:'#2563eb',
    color:'#fff',
    cursor:'pointer',
    boxShadow:'0 1px 1px rgba(0,0,0,.03)'
  };

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

      // redesenha traços salvos (em CSS pixels)
      strokesRef.current.forEach(stroke=>{
        if (!stroke || stroke.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i=1;i<stroke.length;i++){
          const p = stroke[i];
          ctx.lineTo(p.x,p.y);
        }
        ctx.stroke();
      });
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const ctx = () => signCanvasRef.current!.getContext('2d')!

  // ====== NOVAS funções de desenho (persistem traços) ======
  const onPD = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const startX = e.clientX - r.left;
    const startY = e.clientY - r.top;
    ctx().beginPath();
    ctx().moveTo(startX, startY);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    currentStrokeRef.current = [{x:startX, y:startY}];
  }

  const onPM = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !currentStrokeRef.current) return;
    setDrewSomething(true);
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    currentStrokeRef.current.push({x,y});
    ctx().lineTo(x, y);
    ctx().stroke();
  }

  const onPU = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(false);
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    if (currentStrokeRef.current && currentStrokeRef.current.length) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
  }

  const clearSignature = () => {
    if (sigMode === 'draw') {
      const cvs = signCanvasRef.current!
      const c = cvs.getContext('2d')!
      c.clearRect(0, 0, cvs.width, cvs.height)
      strokesRef.current = [];
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
    setInfo('Clique na prévia para posicionar assinatura/QR (aplica em todas as páginas).')
  }
  const onPreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = previewRef.current!
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

  // ====== Perfis (com theme) ======
  useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession()
      if (!s.data?.session) return
      const { data } = await supabase
        .from('validation_profiles')
        .select('id, name, type, theme')
        .order('created_at', { ascending: false })
      setProfiles((data || []) as Profile[])
    })()
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
        if (!drewSomething) { setInfo('Desenhe sua assinatura.'); return }
        signatureBytes = await fetch(canvasToDataURL()).then(r=>r.arrayBuffer())
      } else {
        if (!sigImgFile) { setInfo('Envie a imagem da assinatura.'); return }
        signatureBytes = await sigImgFile.arrayBuffer()
      }

      // perfil e snapshot (para a página de validação mostrar sem depender de SELECT público em profiles)
      let themeSnapshot: any = null
      if (profileId) {
        const p = profiles.find(x => x.id === profileId)
        if (p?.theme) themeSnapshot = p.theme
      }

      // cria rascunho
      const originalName = pdfFile.name || 'upload.pdf'
      const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)

      const { data: inserted, error: insErr } = await supabase
        .from('documents')
        .insert({
          status:'draft',
          original_pdf_name: originalName,
          expires_at: expiresAt,
          validation_profile_id: profileId,
          validation_theme_snapshot: themeSnapshot
        })
        .select('id')
        .single()
      if (insErr || !inserted?.id) { setInfo('Erro ao criar registro: '+(insErr?.message??'desconhecido')); return }
      const id: string = inserted.id

      // gera QR
      const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
      const validateUrl = `${base}/validate/${id}`
      const clampedQR = Math.max(64, Math.min(320, qrSize))
      const qrDataUrl = await QRCode.toDataURL(validateUrl, { width: clampedQR, margin: 1 })

      // monta PDF
      const pdfDoc = await PDFDocument.load(pdfBytes)

      const isJpg = sigMode==='upload' ? (sigImgFile?.type||'').includes('jpg') || (sigImgFile?.type||'').includes('jpeg') : false
      const sigImg = isJpg
        ? await pdfDoc.embedJpg(signatureBytes!)
        : await pdfDoc.embedPng(signatureBytes!)

      const qrBytes = await fetch(qrDataUrl).then(r=>r.arrayBuffer())
      const qrImg = await pdfDoc.embedPng(qrBytes)

      const sigW = sigWidth
      const sigH = (sigW / sigImg.width) * sigImg.height
      const qrW = clampedQR
      const qrH = clampedQR

      pdfDoc.getPages().forEach((page:any) => {
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

      // uploads
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
          qr_code_url:    pubQr.data?.publicUrl ?? null
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

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Editor de Documento</h1>
      <p style={{ marginTop: -6, color: '#6b7280' }}>Envie o PDF, escolha a assinatura (desenhar ou importar), clique na prévia para posicionar, ajuste o tamanho do QR e salve.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 }}>
        {/* Prévia */}
        <Card title="Prévia do PDF (clique para posicionar)">
          <div
            ref={previewRef}
            style={{ position:'relative', width:'100%', height:560, border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', background:'#fafafa' }}
          >
            {pdfUrl ? (
              <>
                {/* garantir que o object não capture eventos */}
                <object data={pdfUrl} type="application/pdf" width="100%" height="100%" style={{ pointerEvents: 'none' }}></object>
                <div onClick={onPreviewClick} title="Clique para escolher a posição" style={{ position:'absolute', inset:0, cursor:'crosshair' }} />
                <Marker />
              </>
            ) : (
              <div style={{ padding: 12, color: '#6b7280' }}>Envie um PDF para visualizar aqui.</div>
            )}
          </div>
        </Card>

        {/* Controles */}
        <div style={{ display:'grid', gap:16 }}>
          <Card title="1) PDF">
            <input type="file" accept="application/pdf" onChange={onPdfChange} />
          </Card>

          <Card title="2) Assinatura" right={
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer' }}>
                <IconDraw /> <input type="radio" checked={sigMode==='draw'} onChange={() => setSigMode('draw')} /> Desenhar
              </label>
              <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer' }}>
                <IconUpload /> <input type="radio" checked={sigMode==='upload'} onChange={() => setSigMode('upload')} /> Importar
              </label>
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
                  <button onClick={clearSignature} disabled={busy} style={{...buttonStyle, background:'#fff', color:'#111', border:'1px solid #e5e7eb'}}>Limpar</button>
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
                  <button onClick={clearSignature} disabled={busy} style={{...buttonStyle, background:'#fff', color:'#111', border:'1px solid #e5e7eb'}}>Remover imagem</button>
                </div>
              </>
            )}
          </Card>

          <Card title="3) Tamanhos">
            <div style={{ display:'grid', gap:8 }}>
              <label>Assinatura: {sigWidth}px
                <input type="range" min={100} max={340} value={sigWidth} onChange={e=>setSigWidth(parseInt(e.target.value))} />
              </label>
              <label>QR Code: {qrSize}px
                <input type="range" min={64} max={320} value={qrSize} onChange={e=>setQrSize(parseInt(e.target.value))} />
              </label>
            </div>
          </Card>

          <Card title="4) Perfil de Validação" right={<a href="/appearance" style={{ textDecoration:'underline' }}>Gerenciar perfis</a>}>
            {profiles.length === 0 ? (
              <div style={{ color:'#6b7280' }}>Nenhum perfil ainda. Crie em <a href="/appearance" style={{ textDecoration:'underline' }}>Aparência</a>.</div>
            ) : (
              <select value={profileId ?? ''} onChange={(e)=>setProfileId(e.target.value || null)} style={{ width:'100%', padding:10, border:'1px solid #e5e7eb', borderRadius:8 }}>
                <option value="">(Sem perfil)</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name} — {p.type}</option>)}
              </select>
            )}
          </Card>

          <Card>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={assinarESalvar} disabled={busy || !pdfBytes || (sigMode==='draw' && !drewSomething) || (sigMode==='upload' && !sigImgFile)} style={buttonStyle}>
                <span style={{ display:'inline-flex', gap:6, alignItems:'center' }}><IconSave /> {busy ? 'Processando…' : 'Assinar & Salvar'}</span>
              </button>
              <button onClick={()=>router.push('/dashboard')} disabled={busy} style={{...buttonStyle, background:'#fff', color:'#111', border:'1px solid #e5e7eb'}}>Voltar à Dashboard</button>
            </div>
            {info && <p style={{ marginTop: 8 }}>{info}</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
