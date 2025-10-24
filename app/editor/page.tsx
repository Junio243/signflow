'use client'
/* Editor completo (grátis):
   - Carrega PDF (local)
   - Desenhe a assinatura (SignaturePad)
   - Clique na página para escolher a posição (aplica em TODAS as páginas)
   - Gera QR Code apontando para /validate/{id}
   - Salva no Supabase (bucket 'signflow') e atualiza 'documents'
   - Redireciona para /validate/{id}
   Bibliotecas via CDN: pdf-lib, pdf.js, signature_pad, qrcode
*/

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

let supabaseRef: any = null
;(async () => {
  try {
    const mod: any = await import('@/lib/supabaseClient')
    supabaseRef = mod.supabase || mod.supabaseClient || null
  } catch {
    supabaseRef = null
  }
})()

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

  // Posição normalizada (0..1) onde o usuário clicou (aplicada em TODAS as páginas)
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)

  // ---- Carrega bibliotecas (CDN) ----
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
      if (!w.pdfjsLib) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
        // worker
        const workerScript = document.createElement('script')
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        document.body.appendChild(workerScript)
      }

      // prepara quadro da assinatura
      const sc = signCanvasRef.current!
      sc.width = 520
      sc.height = 180
      sigPadRef.current = new (window as any).SignaturePad(sc, {
        minWidth: 1.2,
        maxWidth: 2.4,
        backgroundColor: 'rgba(255,255,255,0)',
      })

      setScriptsReady(true)
    }

    run().catch(() => setInfo('Não consegui carregar os componentes do editor. Recarregue a página.'))
  }, [])

  // ---- Leitura do PDF e prévia (página 1) com pdf.js ----
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
      const pdf = await w.pdfjsLib.getDocument({ data: buf }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.3 })
      const canvas = previewRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
      setInfo('Clique na imagem do PDF para escolher onde posicionar a assinatura/QR (aplica em todas as páginas).')
    } catch (e) {
      console.error(e)
      setInfo('Não foi possível renderizar a prévia do PDF.')
    }
  }

  // Captura clique para posição (normalizada 0..1)
  const onPreviewClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    const cw = rect.width
    const ch = rect.height
    setNormX(Math.max(0, Math.min(1, x / cw)))
    setNormY(Math.max(0, Math.min(1, y / ch)))
  }

  const limparAssinatura = () => sigPadRef.current?.clear()

  // Util: baixa arquivo local
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

  // ---- Fluxo principal: inserir doc (pegar id) → gerar QR → assinar TODAS páginas → upload → update → validar ----
  const assinarSalvar = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!supabaseRef) { setInfo('Supabase não detectado. Confira as variáveis NEXT_PUBLIC_*.'); return }
      if (!pdfFile || !pdfArrayBuffer) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Desenhe sua assinatura no quadro.'); return }

      // (1) Cria um registro "vazio" para obter o id gerado pelo banco
      const { data: inserted, error: insErr } = await supabaseRef
        .from('documents')
        .insert({ status: 'draft' })
        .select('id')
        .single()
      if (insErr || !inserted?.id) { setInfo('Falha ao criar registro no banco.'); return }
      const id = inserted.id as string

      // (2) QR Code apontando para /validate/{id}
      const base = window.location.origin
      const validateUrl = `${base}/validate/${id}`
      const qrDataUrl: string = await (window as any).QRCode.toDataURL(validateUrl, { width: 256, margin: 1 })
      const qrPngBytes = await fetch(qrDataUrl).then(r => r.arrayBuffer())

      // (3) Monta o PDF assinado com pdf-lib
      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!

      const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())

      const sigImg = await pdfDoc.embedPng(sigBytes)
      const qrImg = await pdfDoc.embedPng(qrPngBytes)

      // tamanhos
      const sigWidth = 160
      const sigScale = sigWidth / sigImg.width
      const sigHeight = sigImg.height * sigScale
      const qrSize = 100

      const pages = pdfDoc.getPages()
      pages.forEach(page => {
        const { width, height } = page.getSize()

        // posição: se usuário clicou na prévia, usamos posição normalizada. senão, canto inferior direito.
        let px = width - sigWidth - 36
        let py = 36
        if (normX !== null && normY !== null) {
          px = (normX as number) * width
          // pdf-lib usa origem no canto inferior esquerdo
          py = height - (normY as number) * height
        }

        // evita sair para fora da página
        px = Math.max(12, Math.min(width - sigWidth - 12, px))
        py = Math.max(12, Math.min(height - sigHeight - 12, py))

        // desenha assinatura
        page.drawImage(sigImg, { x: px, y: py, width: sigWidth, height: sigHeight, opacity: 0.95 })

        // desenha QR à esquerda da assinatura (com margem)
        const qx = Math.max(12, px - qrSize - 12)
        const qy = py
        page.drawImage(qrImg, { x: qx, y: qy, width: qrSize, height: qrSize, opacity: 0.98 })
      })

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })

      // (4) Upload do PDF e do QR no Storage
      const pdfPath = `${id}/signed.pdf`
      const qrPath = `${id}/qr.png`

      const up1 = await supabaseRef.storage.from('signflow').upload(pdfPath, outBlob, { contentType: 'application/pdf', upsert: true })
      if (up1.error) { setInfo('Não consegui salvar o PDF no Storage.'); return }

      const qrBlob = await (await fetch(qrDataUrl)).blob()
      const up2 = await supabaseRef.storage.from('signflow').upload(qrPath, qrBlob, { contentType: 'image/png', upsert: true })
      if (up2.error) { setInfo('PDF salvo, mas falhou ao salvar o QR.'); /* continua */ }

      const pubPdf = await supabaseRef.storage.from('signflow').getPublicUrl(pdfPath)
      const pubQr = await supabaseRef.storage.from('signflow').getPublicUrl(qrPath)
      const signedUrl = pubPdf?.data?.publicUrl || null
      const qrUrl = pubQr?.data?.publicUrl || null

      // (5) Atualiza o registro e vai para validação
      const { error: updErr } = await supabaseRef
        .from('documents')
        .update({ status: 'signed', signed_pdf_url: signedUrl, qr_code_url: qrUrl })
        .eq('id', id)
      if (updErr) { setInfo('Arquivo salvo, mas não consegui atualizar o registro.'); return }

      router.push(`/validate/${id}`)
    } catch (e) {
      console.error(e)
      setInfo('Falha ao assinar/salvar. Revise as policies/variáveis ou tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const baixarLocal = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!pdfFile || !pdfArrayBuffer) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Desenhe sua assinatura no quadro.'); return }

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
      pages.forEach(page => {
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
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Editor de Assinatura — todas as páginas + QR + Supabase</h1>
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>Envie o PDF</li>
        <li>Desenhe sua assinatura</li>
        <li>Clique na prévia do PDF para escolher a posição (aplicada em todas as páginas)</li>
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
                  style={{ width: '100%', maxWidth: 640, height: 180, border: '1px dashed #888', borderRadius: 8 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={() => sigPadRef.current?.clear()} disabled={busy || !scriptsReady}>Limpar assinatura</button>
          </div>
        </div>

        <div>
          <label><strong>3) Prévia (clique para posicionar)</strong></label><br />
          <canvas ref={previewRef}
                  onClick={onPreviewClick}
                  style={{ width: '100%', maxWidth: 820, border: '1px solid #ddd', borderRadius: 8, cursor: 'crosshair' }} />
          {normX !== null && normY !== null && (
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              Posição selecionada: ({(normX*100).toFixed(1)}%, {(normY*100).toFixed(1)}%)
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
