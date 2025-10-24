'use client'
/* Editor completo (fix):
   - pdf.js com worker configurado (prévia funciona)
   - SignaturePad com ajuste de DPI (assinar funciona)
   - Clique na prévia (posição normalizada + marcador visual)
   - Assinar TODAS as páginas + QR (/validate/{id})
   - Salvar no Supabase (bucket 'signflow') e atualizar 'documents'
*/

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type WindowAny = Window & {
  PDFLib?: any
  pdfjsLib?: any
  SignaturePad?: any
  QRCode?: any
}

export default function EditorPage() {
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null)
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sigPadRef = useRef<any>(null)

  const [scriptsReady, setScriptsReady] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Posição normalizada 0..1 onde o usuário clicou
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)

  // ---- Carrega bibliotecas (CDN) e configura pdf.js worker ----
  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Falha ao carregar: ' + src))
        document.body.appendChild(s)
      })

    const run = async () => {
      const w = window as unknown as WindowAny

      if (!w.PDFLib) await loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js')
      if (!w.SignaturePad) await loadScript('https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js')
      if (!w.QRCode) await loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js')
      if (!w.pdfjsLib) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')

      // Configura o worker do pdf.js (ESSENCIAL para a prévia funcionar)
      w.pdfjsLib!.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

      // Prepara o canvas da assinatura com ajuste de DPI
      const cvs = signCanvasRef.current!
      // Ajusta para o tamanho visual atual do elemento
      const resizeSignatureCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const cssWidth = Math.min(640, cvs.parentElement ? cvs.parentElement.clientWidth : 640)
        const cssHeight = 180
        cvs.style.width = cssWidth + 'px'
        cvs.style.height = cssHeight + 'px'
        cvs.width = Math.floor(cssWidth * ratio)
        cvs.height = Math.floor(cssHeight * ratio)
        const ctx = cvs.getContext('2d')!
        ctx.scale(ratio, ratio)
        sigPadRef.current?.clear()
      }
      sigPadRef.current = new (window as any).SignaturePad(cvs, {
        minWidth: 1.2,
        maxWidth: 2.4,
        backgroundColor: 'rgba(255,255,255,0)',
      })
      resizeSignatureCanvas()
      window.addEventListener('resize', resizeSignatureCanvas)

      setScriptsReady(true)
      return () => window.removeEventListener('resize', resizeSignatureCanvas)
    }

    run().catch((e) => {
      console.error(e)
      setInfo('Não consegui carregar os componentes do editor. Recarregue a página.')
    })
  }, [])

  // ---- Ler PDF e renderizar prévia (página 1) ----
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setPdfFile(f)
    setNormX(null)
    setNormY(null)
    if (!f) return
    const buf = await f.arrayBuffer()
    setPdfArrayBuffer(buf)
    await renderPreview(buf)
  }

  const renderPreview = async (buf: ArrayBuffer) => {
    try {
      const w = window as unknown as WindowAny
      if (!w.pdfjsLib) throw new Error('pdfjsLib não carregado')

      const pdf = await w.pdfjsLib.getDocument({ data: buf }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.2 })

      const canvas = previewRef.current!
      const ctx = canvas.getContext('2d')!

      // Ajuste para DPI na prévia
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.style.width = viewport.width + 'px'
      canvas.style.height = viewport.height + 'px'
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      await page.render({ canvasContext: ctx, viewport }).promise
      setInfo('Clique na imagem do PDF para posicionar assinatura/QR (aplica em todas as páginas).')
      // Se já houver uma seleção anterior, redesenha marcador
      if (normX !== null && normY !== null) drawMarker()
    } catch (e) {
      console.error(e)
      setInfo('Não foi possível renderizar a prévia do PDF.')
    }
  }

  // Marcador visual na prévia
  const drawMarker = () => {
    const canvas = previewRef.current!
    const ctx = canvas.getContext('2d')!
    const x = (normX as number) * canvas.clientWidth
    const y = (normY as number) * canvas.clientHeight
    // converter coordenadas CSS para coordenadas reais do canvas
    const rx = (x / canvas.clientWidth) * canvas.width
    const ry = (y / canvas.clientHeight) * canvas.height

    // limpar e re-renderizar se necessário? aqui apenas desenhamos o marcador por cima
    ctx.save()
    ctx.strokeStyle = '#e11d48'
    ctx.fillStyle = '#e11d48'
    ctx.lineWidth = 2
    const r = 6 * Math.max(window.devicePixelRatio || 1, 1)
    ctx.beginPath()
    ctx.arc(rx, ry, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(rx, ry, r / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Captura clique para posição (normalizada 0..1) e desenha marcador
  const onPreviewClick = async (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ev.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    const cw = rect.width
    const ch = rect.height
    setNormX(Math.max(0, Math.min(1, x / cw)))
    setNormY(Math.max(0, Math.min(1, y / ch)))
    drawMarker()
  }

  const limparAssinatura = () => sigPadRef.current?.clear()

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

  // ---- Fluxo principal: INSERT doc → QR → assinar TODAS → upload → UPDATE → validate ----
  const assinarSalvar = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!pdfFile || !pdfArrayBuffer) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Desenhe sua assinatura no quadro.'); return }

      // 1) cria registro rascunho para obter id
      const { data: inserted, error: insErr } = await supabase
        .from('documents')
        .insert({ status: 'draft' })
        .select('id')
        .single()
      if (insErr || !inserted?.id) { setInfo('Falha ao criar registro no banco.'); return }
      const id = inserted.id as string

      // 2) QR apontando para /validate/{id}
      const base = typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
      const validateUrl = `${base}/validate/${id}`

      const qrDataUrl: string = await (window as unknown as WindowAny).QRCode!.toDataURL(validateUrl, { width: 256, margin: 1 })
      const qrPngBytes = await fetch(qrDataUrl).then(r => r.arrayBuffer())

      // 3) Monta PDF com pdf-lib
      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer)

      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())

      const sigImg = await pdfDoc.embedPng(sigBytes)
      const qrImg = await pdfDoc.embedPng(qrPngBytes)

      const sigWidth = 160
      const sigScale = sigWidth / sigImg.width
      const sigHeight = sigImg.height * sigScale
      const qrSize = 100

      const pages = pdfDoc.getPages()
      pages.forEach((page: any) => {
        const { width, height } = page.getSize()

        // posição: se usuário clicou, usa normalizada; senão, canto inferior direito
        let px = width - sigWidth - 36
        let py = 36
        if (normX !== null && normY !== null) {
          px = (normX as number) * width
          py = height - (normY as number) * height // pdf-lib tem origem em baixo
        }
        px = Math.max(12, Math.min(width - sigWidth - 12, px))
        py = Math.max(12, Math.min(height - sigHeight - 12, py))

        // assinatura
        page.drawImage(sigImg, { x: px, y: py, width: sigWidth, height: sigHeight, opacity: 0.95 })

        // QR à esquerda da assinatura
        const qx = Math.max(12, px - qrSize - 12)
        const qy = py
        page.drawImage(qrImg, { x: qx, y: qy, width: qrSize, height: qrSize, opacity: 0.98 })
      })

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })

      // 4) upload no Storage
      const pdfPath = `${id}/signed.pdf`
      const qrPath = `${id}/qr.png`

      const up1 = await supabase.storage.from('signflow').upload(pdfPath, outBlob, { contentType: 'application/pdf', upsert: true })
      if (up1.error) { setInfo('Não consegui salvar o PDF no Storage.'); return }

      const qrBlob = await (await fetch(qrDataUrl)).blob()
      const up2 = await supabase.storage.from('signflow').upload(qrPath, qrBlob, { contentType: 'image/png', upsert: true })
      if (up2.error) console.warn('QR upload error', up2.error)

      const pubPdf = await supabase.storage.from('signflow').getPublicUrl(pdfPath)
      const pubQr = await supabase.storage.from('signflow').getPublicUrl(qrPath)
      const signedUrl = pubPdf?.data?.publicUrl || null
      const qrUrl = pubQr?.data?.publicUrl || null

      // 5) update do registro e redireciona
      const { error: updErr } = await supabase
        .from('documents')
        .update({ status: 'signed', signed_pdf_url: signedUrl, qr_code_url: qrUrl })
        .eq('id', id)
      if (updErr) { setInfo('Arquivo salvo, mas não consegui atualizar o registro.'); return }

      router.push(`/validate/${id}`)
    } catch (e) {
      console.error(e)
      setInfo('Falha ao assinar/salvar. Revise policies/variáveis e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  // Plano B: apenas baixar localmente
  const baixarLocal = async () => {
    try {
      setBusy(true)
      setInfo(null)
      if (!pdfFile || !pdfArrayBuffer) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Desenhe sua assinatura.'); return }

      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!

      const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())
      const sigImg = await pdfDoc.embedPng(sigBytes)

      const sigWidth = 160
      const sigScale = sigWidth / sigImg.width
      const sigHeight = sigImg.height * sigScale

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
        page.drawImage(sigImg, { x: px, y: py, width: sigWidth, height: sigHeight, opacity: 0.95 })
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
        <li>Clique na prévia para posicionar (aplica em todas as páginas)</li>
        <li>Assinar & Salvar</li>
      </ol>

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <div>
          <label><strong>1) PDF</strong></label><br />
          <input ref={inputRef} type="file" accept="application/pdf" onChange={handlePdfChange} />
        </div>

        <div>
          <label><strong>2) Assinatura</strong></label><br />
          <canvas ref={signCanvasRef}
                  style={{ width: '100%', maxWidth: 640, height: 180, border: '1px dashed #888', borderRadius: 8, display: 'block' }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={limparAssinatura} disabled={busy || !scriptsReady}>Limpar assinatura</button>
          </div>
        </div>

        <div>
          <label><strong>3) Prévia (clique para posicionar)</strong></label><br />
          <canvas ref={previewRef}
                  onClick={onPreviewClick}
                  style={{ width: '100%', maxWidth: 820, border: '1px solid #ddd', borderRadius: 8, cursor: 'crosshair', display: 'block' }} />
          {normX !== null && normY !== null && (
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              Posição: ({(normX*100).toFixed(1)}%, {(normY*100).toFixed(1)}%)
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={assinarSalvar} disabled={!scriptsReady || busy}>
            {busy ? 'Processando…' : 'Assinar & Salvar (com QR)'}
          </button>
          <button onClick={baixarLocal} disabled={!scriptsReady || busy}>
            {busy ? 'Gerando…' : 'Apenas baixar (plano B)'}
          </button>
          <button onClick={() => router.push('/')}>Voltar</button>
        </div>

        {info && <p style={{ marginTop: 6 }}>{info}</p>}
        {!scriptsReady && <p style={{ color: 'tomato' }}>Carregando componentes do editor…</p>}
      </div>
    </div>
  )
}
