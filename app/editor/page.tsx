'use client'
/* Editor gratuito: assina TODAS as páginas do PDF no navegador
   e salva no Supabase (bucket 'signflow' + registro em 'documents').
   Bibliotecas por CDN (sem custo): PDF-LIB + SignaturePad. */

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

type WindowAny = Window & { PDFLib?: any; SignaturePad?: any }

export default function EditorPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sigPadRef = useRef<any>(null)

  const [scriptsReady, setScriptsReady] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // Carrega bibliotecas (grátis) via CDN
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
      const cvs = canvasRef.current!
      cvs.width = 500
      cvs.height = 180
      const pad = new (window as any).SignaturePad(cvs, { minWidth: 1.2, maxWidth: 2.4, backgroundColor: 'rgba(255,255,255,0)' })
      sigPadRef.current = pad
      setScriptsReady(true)
    }
    run().catch(() => setInfo('Não consegui carregar os componentes do editor. Recarregue a página.'))
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfFile(e.target.files?.[0] || null)
  }
  const limparAssinatura = () => sigPadRef.current?.clear()

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

  // Assina todas as páginas e SALVA no Supabase (leva a /validate/{id})
  const assinarESalvar = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!pdfFile) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Faça sua assinatura no quadro.'); return }

      const w = window as unknown as WindowAny
      const { PDFDocument } = w.PDFLib!

      // Carrega PDF original
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)

      // Converte assinatura em PNG incorporável
      const sigDataUrl: string = sigPadRef.current.toDataURL('image/png')
      const sigPngBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer())
      const sigPng = await pdfDoc.embedPng(sigPngBytes)

      // Tamanho/posição base (canto inferior direito com margem)
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
      // TODAS as páginas
      pages.forEach(stampOnPage)

      const outBytes = await pdfDoc.save()
      const outBlob = new Blob([outBytes], { type: 'application/pdf' })

      // Salvar no Supabase (opcionalmente permita download local abaixo)
      if (!supabaseRef) {
        setInfo('Supabase não detectado no cliente. Baixei o PDF assinado localmente.')
        baixarBlob(outBlob)
        return
      }

      const id = (crypto as any).randomUUID?.() || String(Date.now())
      const path = `${id}/signed.pdf`

      // Upload no bucket 'signflow' (precisa de política de INSERT/UPDATE para usuários autenticados)
      const { error: upErr } = await supabaseRef
        .storage.from('signflow')
        .upload(path, outBlob, { contentType: 'application/pdf', upsert: true })
      if (upErr) {
        setInfo('Não consegui salvar no Signflow. Baixei o PDF localmente.')
        baixarBlob(outBlob)
        return
      }

      // URL pública
      const { data: pub } = await supabaseRef.storage.from('signflow').getPublicUrl(path)
      const signedUrl = pub?.publicUrl

      // Registro no banco
      await supabaseRef
        .from('documents')
        .insert({ id, status: 'signed', signed_pdf_url: signedUrl, created_at: new Date().toISOString() })

      // Vai pra validação
      router.push(`/validate/${id}`)
    } catch (e) {
      console.error(e)
      setInfo('Falha ao assinar/salvar. Você pode tentar baixar localmente.')
    } finally {
      setBusy(false)
    }
  }

  // Plano B: só baixar localmente
  const apenasBaixar = async () => {
    try {
      setBusy(true)
      setInfo(null)

      if (!pdfFile) { setInfo('Envie um PDF primeiro.'); return }
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) { setInfo('Faça sua assinatura no quadro.'); return }

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
      pages.forEach(stampOnPage)

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
    <div style={{ maxWidth: 920, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Editor de Assinatura (todas as páginas)</h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Envie um PDF, desenhe sua assinatura e clique em <strong>Assinar & Salvar</strong> para guardar no Signflow e validar em seguida.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label><strong>1) Envie o PDF</strong></label><br />
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} />
          {pdfFile && (
            <iframe title="Pré-visualização" src={URL.createObjectURL(pdfFile)}
              style={{ width: '100%', height: 420, border: '1px solid #ddd', borderRadius: 8, marginTop: 8 }} />
          )}
        </div>

        <div>
          <label><strong>2) Desenhe sua assinatura</strong> (use “Limpar” para refazer)</label>
          <canvas ref={canvasRef}
                  style={{ width: '100%', maxWidth: 640, height: 180, border: '1px dashed #888', borderRadius: 8, display: 'block', marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={limparAssinatura} disabled={!scriptsReady || busy}>Limpar assinatura</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={assinarESalvar} disabled={!scriptsReady || busy}>
            {busy ? 'Processando…' : 'Assinar & Salvar no Signflow'}
          </button>
          <button onClick={apenasBaixar} disabled={!scriptsReady || busy}>
            {busy ? 'Gerando…' : 'Apenas baixar (plano B)'}
          </button>
          <button onClick={() => router.push('/')}>Voltar para a página inicial</button>
        </div>

        {info && <p style={{ marginTop: 8, color: '#444' }}>{info}</p>}
      </div>

      {!scriptsReady && <p style={{ marginTop: 12, color: 'tomato' }}>Carregando componentes do editor…</p>}
    </div>
  )
}
