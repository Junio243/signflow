'use client'
/* Editor FINAL (sem CDNs, login obrigatório p/ salvar):
   - Prévia com <object> (nativo do navegador)
   - Assinatura em canvas (pointer events)
   - Clique para posicionar assinatura + QR (aplica em TODAS as páginas)
   - Gera QR (qrcode) -> assina (pdf-lib) -> salva no Supabase -> /validate/{id}
*/

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabaseClient'

export default function EditorPage() {
  const router = useRouter()

  // PDF selecionado
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null)

  // Assinatura (canvas puro)
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [drewSomething, setDrewSomething] = useState(false)

  // Posição normalizada (0..1) escolhida na prévia
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)
  const previewBoxRef = useRef<HTMLDivElement | null>(null)

  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // Ajusta o canvas da assinatura para DPI/retina
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

  // Desenho livre (assinatura)
  const getCanvasCtx = () => signCanvasRef.current!.getContext('2d')!

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true)
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ctx = getCanvasCtx()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    setDrewSomething(true)
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ctx = getCanvasCtx()
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(false)
    ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
  }

  const clearSignature = () => {
    const cvs = signCanvasRef.current!
    const ctx = cvs.getContext('2d')!
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    setDrewSomething(false)
  }

  // Seleção e prévia do PDF (sem dependências)
  const onPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setPdfFile(f)
    setNormX(null); setNormY(null)
    if (!f) {
      setPdfUrl(null)
      setPdfBytes(null)
      return
    }
    const url = URL.createObjectURL(f)
    setPdfUrl(url)
    setPdfBytes(await f.arrayBuffer())
    setInfo('Clique na prévia para posicionar assinatura/QR (aplicado em todas as páginas).')
  }

  // Clique para posição (overlay)
  const onPreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = previewBoxRef.current!
    const rect = box.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setNormX(Math.max(0, Math.min(1, x / rect.width)))
    setNormY(Math.max(0, Math.min(1, y / rect.height)))
  }

  // Marcador visual (pontinho vermelho) na posição escolhida
  const Marker = () => {
    if (normX === null || normY === null) return null
    return (
      <div
        style={{
          position: 'absolute',
          left: `${normX * 100}%`,
          top: `${normY * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12,
          borderRadius: 999, background: '#e11d48',
          border: '2px solid white', boxShadow: '0 0 0 1px #e11d48',
          pointerEvents: 'none'
        }}
        title="Posição escolhida"
      />
    )
  }

  // Util: DataURL -> Blob
  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl)
    return await res.blob()
  }

  // Util: baixar local
  const baixarBlob = (blob: Blob, nome = 'documento-assinado.pdf') => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const assinarESalvar = async () => {
    try {
      setBusy(true); setInfo(null)

      // 0) Exige login (evita RLS bloquear INSERT/Storage)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) { setInfo('Não consegui validar sua sessão. Entre novamente.'); return }
      if (!sessionData?.session) {
        setInfo('Faça login para salvar no Signflow.')
        window.location.href = '/login?next=/editor'
        return
      }

      if (!pdfBytes) { setInfo('Envie um PDF primeiro.'); return }
      if (!drewSomething) { setInfo('Desenhe sua assinatura no quadro.'); return }

      // 1) Cria registro rascunho e pega id
      const { data: inserted, error: insErr } = await supabase
        .from('documents').insert({ status: 'draft' }).select('id').single()
      if (insErr || !inserted?.id) {
        console.error('SUPABASE INSERT ERROR:', insErr)
        setInfo('Erro ao criar registro: ' + (insErr?.message ?? 'desconhecido'))
        return
      }
      const id: string = inserted.id

      // 2) Gera QR apontando para /validate/{id}
      const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
      const validateUrl = `${base}/validate/${id}`
      const qrDataUrl = await QRCode.toDataURL(validateUrl, { width: 256, margin: 1 })

      // 3) Monta PDF com pdf-lib (todas as páginas)
      const pdfDoc = await PDFDocument.load(pdfBytes)

      const sigDataUrl = signCanvasRef.current!.toDataURL('image/png')
      const sigPng = await pdfDoc.embedPng(await (await fetch(sigDataUrl)).arrayBuffer())
      const qrPng = await pdfDoc.embedPng(await (await fetch(qrDataUrl)).arrayBuffer())

      const sigWidth = 160
      const sigScale = sigWidth / sigPng.width
      const sigHeight = sigPng.height * sigScale
      const qrSize = 100

      const pages = pdfDoc.getPages()
      pages.forEach((page: any) => {
        const { width, height } = page.getSize()

        // default: canto inferior direito
        let px = width - sigWidth - 36
        let py = 36

        // se usuário escolheu posição, usa (origem PDF: canto inferior esquerdo)
        if (normX !== null && normY !== null) {
          px = (normX as number) * width
          py = height - (normY as number) * height
        }

        // clampa dentro da página
        px = Math.max(12, Math.min(width - sigWidth - 12, px))
        py = Math.max(12, Math.min(height - sigHeight - 12, py))

        // assinatura
        page.drawImage(sigPng, { x: px, y: py, width: sigWidth, height: sigHeight, opacity: 0.95 })

        // qr à esquerda
        const qx = Math.max(12, px - qrSize - 12)
        const qy = py
        page.drawImage(qrPng, { x: qx, y: qy, width: qrSize, height: qrSize, opacity: 0.98 })
      })

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })

      // 4) Upload no Storage
      const pdfPath = `${id}/signed.pdf`
      const qrPath = `${id}/qr.png`

      const up1 = await supabase.storage.from('signflow').upload(pdfPath, outBlob, {
        contentType: 'application/pdf', upsert: true
      })
      if (up1.error) { setInfo('Não consegui salvar o PDF no Storage.'); return }

      const up2 = await supabase.storage.from('signflow').upload(qrPath, await dataUrlToBlob(qrDataUrl), {
        contentType: 'image/png', upsert: true
      })
      if (up2.error) console.warn('QR upload error', up2.error)

      const pubPdf = await supabase.storage.from('signflow').getPublicUrl(pdfPath)
      const pubQr = await supabase.storage.from('signflow').getPublicUrl(qrPath)

      // 5) Update do registro e redireciona
      const { error: updErr } = await supabase
        .from('documents')
        .update({
          status: 'signed',
          signed_pdf_url: pubPdf.data?.publicUrl ?? null,
          qr_code_url: pubQr.data?.publicUrl ?? null
        })
        .eq('id', id)

      if (updErr) {
        console.error('SUPABASE UPDATE ERROR:', updErr)
        setInfo('Arquivo salvo, mas não consegui atualizar o registro.')
        return
      }

      router.push(`/validate/${id}`)
    } catch (e) {
      console.error(e)
      setInfo('Falha ao assinar/salvar. Revise policies/variáveis e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const baixarLocal = async () => {
    try {
      setBusy(true); setInfo(null)
      if (!pdfBytes) { setInfo('Envie um PDF primeiro.'); return }
      if (!drewSomething) { setInfo('Desenhe sua assinatura no quadro.'); return }

      const pdfDoc = await PDFDocument.load(pdfBytes)
      const sigDataUrl = signCanvasRef.current!.toDataURL('image/png')
      const sigPng = await pdfDoc.embedPng(await (await fetch(sigDataUrl)).arrayBuffer())

      const sigWidth = 160
      const sigScale = sigWidth / sigPng.width
      const sigHeight = sigPng.height * sigScale

      const pages = pdfDoc.getPages()
      pages.forEach((page: any) => {
        const { width, height } = page.getSize()
        let px = width - sigWidth - 36
        let py = 36
        if (normX !== null && normY !== null) {
          px = (normX as number) * width
          py = height - (normY as number) * height
        }
        px = Math.max(12, Math.min(width - sigWidth - 12, px))
        py = Math.max(12, Math.min(height - sigHeight - 12, py))
        page.drawImage(sigPng, { x: px, y: py, width: sigWidth, height: sigHeight, opacity: 0.95 })
      })

      const outBytes = await pdfDoc.save()
      baixarBlob(new Blob([outBytes], { type: 'application/pdf' }))
      setInfo('PDF assinado baixado com sucesso.')
    } catch (e) {
      console.error(e)
      setInfo('Não consegui assinar/baixar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Editor — todas as páginas + QR + Supabase</h1>
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>Envie o PDF</li>
        <li>Desenhe sua assinatura</li>
        <li>Clique na prévia para posicionar</li>
        <li>Assinar & Salvar</li>
      </ol>

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <div>
          <label><strong>1) PDF</strong></label><br />
          <input type="file" accept="application/pdf" onChange={onPdfChange} />
        </div>

        <div>
          <label><strong>2) Assinatura</strong></label><br />
          <canvas
            ref={signCanvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrawing(false)}
            style={{ width: '100%', maxWidth: 640, height: 180, border: '1px dashed #888', borderRadius: 8, background: '#fff', touchAction: 'none' }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={clearSignature} disabled={busy}>Limpar assinatura</button>
          </div>
        </div>

        <div>
          <label><strong>3) Prévia (clique para posicionar)</strong></label><br />
          <div
            ref={previewBoxRef}
            style={{ position: 'relative', width: '100%', maxWidth: 820, height: 520, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}
          >
            {pdfUrl ? (
              <>
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <p style={{ padding: 12 }}>Não foi possível exibir a pré-visualização. (Você ainda pode assinar e salvar.)</p>
                </object>
                {/* Overlay que captura o clique por cima do <object> */}
                <div
                  onClick={onPreviewClick}
                  title="Clique para escolher a posição"
                  style={{ position: 'absolute', inset: 0, cursor: 'crosshair', background: 'transparent' }}
                />
                <Marker />
              </>
            ) : (
              <div style={{ padding: 12, color: '#666' }}>Envie um PDF para visualizar aqui.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={assinarESalvar} disabled={busy || !pdfBytes || !drewSomething}>
            {busy ? 'Processando…' : 'Assinar & Salvar (com QR)'}
          </button>
          <button onClick={baixarLocal} disabled={busy || !pdfBytes || !drewSomething}>
            {busy ? 'Gerando…' : 'Apenas baixar (plano B)'}
          </button>
          <button onClick={() => router.push('/')}>Voltar</button>
        </div>

        {info && <p style={{ marginTop: 6 }}>{info}</p>}
      </div>
    </div>
  )
}
