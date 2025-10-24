'use client'
/* Editor grátis: desenhe a assinatura e aplique no PDF localmente.
   Sem dependências pagas; usa PDF-LIB e SignaturePad via CDN. */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Tentativa de compatibilidade com seu arquivo lib/supabaseClient.ts
// (se exporta "supabase" ou "supabaseClient", pegamos o que existir)
let supabaseRef: any = null
(async () => {
  try {
    const mod: any = await import('@/lib/supabaseClient')
    supabaseRef = mod.supabase || mod.supabaseClient || null
  } catch (_e) {
    supabaseRef = null
  }
})()

type WindowAny = Window & {
  PDFLib?: any
  SignaturePad?: any
}

export default function EditorPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sigPadRef = useRef<any>(null)

  const [scriptsReady, setScriptsReady] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [allPages, setAllPages] = useState(false)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // Carrega bibliotecas grátis via CDN (sem mexer em package.json)
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

    const loadAll = async () => {
      const w = window as unknown as WindowAny
      if (!w.PDFLib) {
        await loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js')
      }
      if (!w.SignaturePad) {
        await loadScript('https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js')
      }
      // prepara o canvas da assinatura
      const cvs = canvasRef.current!
      cvs.width = 500
      cvs.height = 180
      const pad = new (window as any).SignaturePad(cvs, { minWidth: 1.2, maxWidth: 2.4, backgroundColor: 'rgba(255,255,255,0)' })
      sigPadRef.current = pad
      setScriptsReady(true)
    }
    loadAll().catch(() => setInfo('Não consegui carregar as bibliotecas do editor. Recarregue a página.'))
  }, [])

  const limparAssinatura = () => {
    sigPadRef.current?.clear()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setPdfFile(f)
  }

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

  const gerarPdfAssinado = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!pdfFile) {
        setInfo('Envie um PDF primeiro.')
        return
      }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        setInfo('Faça sua assinatura no quadro.')
        return
      }

      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!

      // carrega PDF original
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)

      // pega assinatura como PNG
      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigPngBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())
      const sigPng = await pdfDoc.embedPng(sigPngBytes)

      // tamanho da assinatura (ajuste fino aqui)
      const targetWidth = 160
      const scale = targetWidth / sigPng.width
      const targetHeight = sigPng.height * scale

      const pages = pdfDoc.getPages()
      const stampOnPage = (page: any) => {
        const { width, height } = page.getSize()
        const margin = 36 // 0,5 polegada
        const x = width - targetWidth - margin
        const y = margin
        page.drawImage(sigPng, { x, y, width: targetWidth, height: targetHeight, opacity: 0.95 })
      }

      if (allPages) {
        pages.forEach(stampOnPage)
      } else {
        stampOnPage(pages[0])
      }

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })
      baixarBlob(outBlob)

      setInfo('PDF assinado gerado com sucesso. Você pode também salvar no Signflow (opcional).')
    } catch (e: any) {
      console.error(e)
      setInfo('Não consegui assinar o PDF. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const salvarNoSignflow = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!supabaseRef) {
        setInfo('Supabase não está configurado no cliente. Tudo bem: o download funciona. Se quiser salvar no Signflow, me avise que ajusto.')
        return
      }
      if (!pdfFile) {
        setInfo('Envie um PDF e gere o PDF assinado primeiro (use o botão acima).')
        return
      }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        setInfo('Faça sua assinatura no quadro e gere o PDF assinado primeiro.')
        return
      }

      // Regerar o PDF assinado para salvar (mesma lógica do botão anterior)
      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!

      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)

      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigPngBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())
      const sigPng = await pdfDoc.embedPng(sigPngBytes)

      const targetWidth = 160
      const scale = targetWidth / sigPng.width
      const targetHeight = sigPng.height * scale

      const pages = pdfDoc.getPages()
      const stampOnPage = (page: any) => {
        const { width, height } = page.getSize()
        const margin = 36
        const x = width - targetWidth - margin
        const y = margin
        page.drawImage(sigPng, { x, y, width: targetWidth, height: targetHeight, opacity: 0.95 })
      }
      if (allPages) pages.forEach(stampOnPage)
      else stampOnPage(pages[0])

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })

      const id = (crypto as any).randomUUID?.() || String(Date.now())
      const path = `${id}/signed.pdf`

      const { error: upErr } = await supabaseRef
        .storage.from('signflow')
        .upload(path, outBlob, { contentType: 'application/pdf', upsert: true })

      if (upErr) {
        setInfo('PDF gerado, mas não consegui salvar no Signflow. Baixe localmente (funciona).')
        return
      }

      const { data: pub } = await supabaseRef.storage.from('signflow').getPublicUrl(path)
      const signedUrl = pub?.publicUrl

      await supabaseRef
        .from('documents')
        .insert({ id, status: 'signed', signed_pdf_url: signedUrl, created_at: new Date().toISOString() })

      setInfo(`Salvo no Signflow! Valide em /validate/${id}`)
      router.refresh()
    } catch (e: any) {
      console.error(e)
      setInfo('Não consegui salvar no Signflow. O download local funciona.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Editor de Assinatura (Gratuito)</h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Envie um PDF, desenhe sua assinatura e gere um PDF assinado. (Opcional: salve no Signflow para validar.)
      </p>

      <div style={{ display: 'grid', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            <strong>1) Envie o PDF</strong>
          </label>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} />
          {pdfFile && (
            <iframe
              title="Pré-visualização"
              src={URL.createObjectURL(pdfFile)}
              style={{ width: '100%', height: 420, border: '1px solid #ddd', borderRadius: 8 }}
            />
          )}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            <strong>2) Desenhe sua assinatura</strong> (botão “Limpar” para refazer)
          </label>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', maxWidth: 640, height: 180, border: '1px dashed #888', borderRadius: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={limparAssinatura} disabled={!scriptsReady || busy}>Limpar assinatura</button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={allPages} onChange={(e) => setAllPages(e.target.checked)} />
              Assinar todas as páginas
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={gerarPdfAssinado} disabled={!scriptsReady || busy}>
            {busy ? 'Gerando…' : 'Gerar PDF assinado (baixar)'}
          </button>
          <button onClick={salvarNoSignflow} disabled={!scriptsReady || busy}>
            {busy ? 'Salvando…' : 'Salvar no Signflow (opcional)'}
          </button>
          <button onClick={() => router.push('/')}>Ir para a página inicial</button>
        </div>

        {info && <p style={{ marginTop: 8, color: '#444' }}>{info}</p>}
      </div>

      {!scriptsReady && <p style={{ marginTop: 12, color: 'tomato' }}>Carregando componentes do editor…</p>}
    </div>
  )
}
