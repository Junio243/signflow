// app/editor/page.tsx (debug)
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabaseClient'
import PdfEditor from '@/components/PdfEditor'

type Profile = { id: string; name: string; type: 'medico'|'faculdade'|'generico'; theme: any }
type Pos = { page: number; nx: number; ny: number; scale: number; rotation: number };

export default function EditorPage() {
  const router = useRouter()

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null)

  // Assinatura
  const [sigMode, setSigMode] = useState<'draw'|'upload'>('draw')
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [drewSomething, setDrewSomething] = useState(false)
  const [sigImgFile, setSigImgFile] = useState<File | null>(null)
  const [sigImgPreview, setSigImgPreview] = useState<string | null>(null)
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null)

  // Tamanhos
  const [sigWidth, setSigWidth] = useState<number>(180)
  const [qrSize, setQrSize] = useState<number>(120)

  // Posição normalizada 0..1 (legacy)
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)

  // NOVO: positions array (para presets/multi-page)
  const [positions, setPositions] = useState<Pos[]>([])
  const [activePage, setActivePage] = useState(1)
  const [pdfPageCount, setPdfPageCount] = useState(1)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    return () => {
      if (sigImgPreview) URL.revokeObjectURL(sigImgPreview)
    }
  }, [sigImgPreview])

  useEffect(() => {
    if (sigMode === 'draw') {
      if (drewSomething && signCanvasRef.current) {
        setSignaturePreviewUrl(signCanvasRef.current.toDataURL('image/png'))
      } else if (!drewSomething) {
        setSignaturePreviewUrl(null)
      }
    } else if (sigMode === 'upload') {
      setSignaturePreviewUrl(sigImgPreview)
    }
  }, [sigMode, drewSomething, sigImgPreview])

  // ====== PDF preview & click ======
  const onPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log('[DEBUG] onPdfChange triggered', e);
      const f = e.target.files?.[0] || null;
      console.log('[DEBUG] selected file', f ? { name: f.name, size: f.size, type: f.type } : null);
      setPdfFile(f);
      setNormX(null); setNormY(null);
      setPositions([]);
      setActivePage(1);
      setPdfPageCount(1);
      if (!f) { setPdfBytes(null); setInfo('Nenhum arquivo selecionado.'); return; }
      try {
        const ab = await f.arrayBuffer();
        console.log('[DEBUG] arrayBuffer length', ab?.byteLength);
        setPdfBytes(ab);
        setInfo('PDF carregado no cliente (arrayBuffer lido).');
      } catch (readErr:any) {
        console.error('[DEBUG] falha ao ler arrayBuffer', readErr);
        setPdfBytes(null);
        setInfo('Erro ao ler o arquivo PDF no navegador: ' + (readErr?.message || readErr));
      }
    } catch (err:any) {
      console.error('[DEBUG] erro onPdfChange (outer)', err);
      setInfo('Erro inesperado ao processar o PDF: ' + (err?.message || err));
    }
  }

  // ====== resto do arquivo (sem alteração na lógica principal) ======
  // (mantive a maior parte da lógica original, apenas removi partes não necessárias para o debug e deixei os botões principais)
  useEffect(() => {
    const firstPagePos = positions.find(p => p.page === 1)
    if (firstPagePos) {
      setNormX(firstPagePos.nx)
      setNormY(firstPagePos.ny)
    } else {
      setNormX(null)
      setNormY(null)
    }
  }, [positions])

  // Um fetch simples de perfis (mantido)
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

  // botão principal — para debug apenas exibimos status
  const assinarESalvar = async () => {
    setInfo('Ação de assinar/salvar foi chamada (debug) — este fluxo está desabilitado no modo debug.');
  }

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Editor de Documento (Debug)</h1>
      <p style={{ marginTop: -6, color: '#6b7280' }}>Painel debug visível para verificar se o arquivo está chegando ao React e ao componente de prévia.</p>

      <div style={{ marginBottom: 12, padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <strong>Debug status</strong>
        <div style={{ marginTop: 8 }}>
          <div><strong>Arquivo (pdfFile):</strong> {pdfFile ? `${pdfFile.name} (${Math.round((pdfFile.size||0)/1024)} KB)` : 'nenhum'}</div>
          <div><strong>pdfBytes:</strong> {pdfBytes ? `${(pdfBytes as ArrayBuffer).byteLength} bytes` : 'nenhum'}</div>
          <div><strong>pdfPageCount:</strong> {pdfPageCount}</div>
          <div><strong>signaturePreviewUrl:</strong> {signaturePreviewUrl ? 'definida' : 'nenhuma'}</div>
          <div style={{ marginTop: 8 }}><strong>info:</strong> {info ?? '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 }}>
        <div>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
            {pdfFile ? (
              <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#f8fafc' }}>
                <PdfEditor
                  file={pdfFile}
                  signatureUrl={signaturePreviewUrl}
                  positions={positions}
                  onPositions={setPositions}
                  page={activePage}
                  onPageChange={setActivePage}
                  onDocumentLoaded={({ pages }) => {
                    console.log('[DEBUG] onDocumentLoaded pages=', pages);
                    setPdfPageCount(pages);
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: 12, color: '#6b7280' }}>Envie um PDF para habilitar a prévia interativa.</div>
            )}
          </div>
        </div>

        <div style={{ display:'grid', gap:16 }}>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
            <div style={{ marginBottom: 8, fontWeight:600 }}>1) PDF</div>
            <input type="file" accept="application/pdf" onChange={onPdfChange} />
            <div style={{ marginTop: 8, color:'#6b7280' }}>Selecione um PDF para testar.</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
            <div style={{ marginBottom: 8, fontWeight:600 }}>2) Assinatura</div>
            <div style={{ color:'#6b7280' }}>Modo debug: apenas desenhar (ou mantenha vazio)</div>
            <canvas ref={signCanvasRef} style={{ width:'100%', height:120, border:'1px dashed #94a3b8', borderRadius:8, marginTop:8 }} />
          </div>

          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
            <button onClick={() => assinarESalvar()} style={{ padding:'8px 12px', borderRadius:8, background:'#2563eb', color:'#fff' }}>Assinar & Salvar (debug)</button>
            <div style={{ marginTop:8, color:'#6b7280' }}>A função real de salvar está desabilitada no modo debug.</div>
          </div>

        </div>
      </div>
    </div>
  )
}
