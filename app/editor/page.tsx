'use client'

import { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'

// --- STUBS (Simulações de componentes externos) ---

// Stub para '@/lib/supabaseClient'
const supabase = {
  auth: {
    getSession: async () => ({ data: { session: true } }) // Mock
  },
  from: (tableName: string) => ({
    select: (query: string) => ({
      order: async (column: string, options: { ascending: boolean }) => {
        console.log(`[STUB] Supabase select from ${tableName}: ${query}`);
        return ({ data: [] });
      }
    })
  })
};

// Stub para '@/components/PdfEditor' (Agora com Tailwind)
const PdfEditor = ({ pdfBytes, signatureUrl, positions, page, onPageChange, onDocumentLoaded }: { pdfBytes: any, signatureUrl: string | null, positions: any[], page: number, onPageChange: (page: number) => void, onDocumentLoaded: (info: { pages: number }) => void }) => {
  const [totalPages, setTotalPages] = useState(3); // Simula 3 páginas

  useEffect(() => {
    if (pdfBytes) {
      setTotalPages(3); // Simula 3 páginas
      onDocumentLoaded({ pages: 3 });
    }
  }, [pdfBytes, onDocumentLoaded]);

  if (!pdfBytes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8">
        <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <p className="mt-4 text-lg font-semibold text-slate-600">Preview do PDF</p>
        <p className="text-sm text-slate-500">Envie um arquivo PDF para começar</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-100 rounded-lg">
      <div className="relative bg-white min-h-[500px] border border-slate-300 rounded-md shadow-inner flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xl font-bold text-slate-800">Simulação do PDF</p>
          <p className="font-mono text-sm text-slate-500">(Página {page} de {totalPages})</p>
          <p className="mt-4 text-xs text-slate-400">({pdfBytes.byteLength} bytes carregados)</p>

          {signatureUrl && (
            <div className="absolute border-2 border-dotted border-blue-500 p-1" style={{ top: '150px', left: '100px' }}>
              <img src={signatureUrl} alt="Assinatura" className="w-[150px] h-auto opacity-70" />
            </div>
          )}
          <p className="mt-16 text-sm text-slate-500">Clique para posicionar a assinatura (simulado)</p>
        </div>
      </div>
      <div className="flex justify-center items-center mt-4 gap-4">
        <Button variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
          Anterior
        </Button>
        <span className="text-sm font-medium text-slate-700">Página {page} / {totalPages}</span>
        <Button variant="outline" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          Próxima
        </Button>
      </div>
    </div>
  );
};

// --- COMPONENTES DE UI (Reutilizáveis) ---

// Componente de Botão estilizado
const Button = ({ variant = 'primary', className = '', ...props }: { variant?: 'primary' | 'outline', className?: string, [key: string]: any }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300 disabled:bg-slate-50'
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

// Componente de Card estilizado
const Card = ({ title, right, children }: { title: string, right?: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
    <div className="flex justify-between items-center p-4 border-b border-slate-100">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div>{right}</div>
    </div>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </div>
);

// Ícones (SVGs)
const IconDraw = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
);

const IconUpload = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
);


// --- TIPOS ---

type Profile = { id: string; name: string; type: 'medico'|'faculdade'|'generico'; theme: any }
type Pos = { page: number; nx: number; ny: number; scale: number; rotation: number };

// --- COMPONENTE PRINCIPAL DA PÁGINA ---

export default function EditorPage() {
  // PDF
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Posição (legacy)
  const [normX, setNormX] = useState<number | null>(null)
  const [normY, setNormY] = useState<number | null>(null)

  // NOVO: positions array
  const [positions, setPositions] = useState<Pos[]>([])
  const [activePage, setActivePage] = useState(1)
  const [pdfPageCount, setPdfPageCount] = useState(1)

  // Outros estados
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [presets, setPresets] = useState<any[]>([])

  // --- EFEITOS ---

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

  // Carregar perfis (simulado)
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

  // Atualizar posição legacy (mantido)
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


  // --- FUNÇÕES ---

  // Carregar PDF
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

  // Ação principal
  const assinarESalvar = async () => {
    setInfo('Ação de assinar/salvar foi chamada (debug) — este fluxo está desabilitado no modo debug.');
  }

  // Lógica do Canvas
  const onPD = (e: React.PointerEvent) => {
    setDrawing(true);
    const ctx = signCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111827'; // Cor mais escura
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  }
  const onPM = (e: React.PointerEvent) => {
    if (!drawing || !signCanvasRef.current) return;
    const ctx = signCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    if (!drewSomething) setDrewSomething(true);
  }
  const onPU = () => {
    setDrawing(false);
    if (drewSomething && signCanvasRef.current) {
      setSignaturePreviewUrl(signCanvasRef.current.toDataURL('image/png'));
    }
  }
  const clearSignature = () => {
    if (signCanvasRef.current) {
      const ctx = signCanvasRef.current.getContext('2d');
      // Redefine a transformação antes de limpar
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, signCanvasRef.current.width, signCanvasRef.current.height);
    }
    setDrewSomething(false);
    setSignaturePreviewUrl(null);
  }

  // Classe para aba de assinatura (ativa/inativa)
  const radioTabClass = (active: boolean) =>
    active
      ? 'bg-white shadow-sm text-blue-600'
      : 'text-slate-600 hover:text-slate-900';


  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Editor de Documento (Debug)</h1>
        <p className="text-slate-600 mb-6">Painel debug visível para verificar se o arquivo está chegando ao React e ao componente de prévia.</p>

        {/* --- DEBUG STATUS --- */}
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <strong className="text-sm font-semibold text-slate-700">Debug Status</strong>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono text-slate-600">
            <div><strong>Arquivo:</strong> {pdfFile ? `${pdfFile.name} (${Math.round((pdfFile.size||0)/1024)} KB)` : 'nenhum'}</div>
            <div><strong>pdfBytes:</strong> {pdfBytes ? `${(pdfBytes as ArrayBuffer).byteLength} bytes` : 'nenhum'}</div>
            <div><strong>Páginas:</strong> {pdfPageCount}</div>
            <div><strong>Assinatura:</strong> {signaturePreviewUrl ? 'definida' : 'nenhuma'}</div>
            <div className="col-span-2 mt-2 pt-2 border-t border-slate-100"><strong>Info:</strong> {info ?? '—'}</div>
          </div>
        </div>

        {/* --- LAYOUT PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr,1fr] gap-6 items-start">
          
          {/* Coluna da Esquerda: Prévia */}
          <div className="w-full">
            <Card title="Prévia interativa">
              {pdfFile ? (
                <PdfEditor
                  pdfBytes={pdfBytes}
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
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8">
                  <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <p className="mt-4 text-lg font-semibold text-slate-600">Preview do PDF</p>
                  <p className="text-sm text-slate-500">Envie um arquivo PDF para começar</p>
                </div>
              )}
            </Card>
          </div>

          {/* Coluna da Direita: Controles */}
          <div className="flex flex-col gap-6">
            
            {/* Card 1: PDF */}
            <Card title="1) PDF">
              <input
                type="file"
                accept="application/pdf"
                onChange={onPdfChange}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Escolher arquivo
                </Button>
                <span className="text-sm text-slate-500 truncate" title={pdfFile?.name}>
                  {pdfFile ? pdfFile.name : 'Nenhum arquivo escolhido'}
                </span>
              </div>
            </Card>

            {/* Card 2: Assinatura */}
            <Card title="2) Assinatura" right={
              <div className="flex items-center rounded-lg bg-slate-100 p-1">
                <label className={`py-1.5 px-3 rounded-md cursor-pointer text-sm font-medium flex items-center gap-1.5 transition-all ${radioTabClass(sigMode === 'draw')}`}>
                  <input type="radio" name="sigMode" checked={sigMode==='draw'} onChange={() => setSigMode('draw')} className="sr-only" />
                  <IconDraw className="w-4 h-4" /> Desenhar
                </label>
                <label className={`py-1.5 px-3 rounded-md cursor-pointer text-sm font-medium flex items-center gap-1.5 transition-all ${radioTabClass(sigMode === 'upload')}`}>
                  <input type="radio" name="sigMode" checked={sigMode==='upload'} onChange={() => setSigMode('upload')} className="sr-only" />
                  <IconUpload className="w-4 h-4" /> Importar
                </label>
              </div>
            }>
              {sigMode === 'draw' ? (
                <>
                  <canvas
                    ref={signCanvasRef}
                    width={400} // Width/Height para melhor resolução
                    height={180}
                    onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={()=>setDrawing(false)}
                    className="w-full h-[180px] bg-white border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair touch-action-none"
                  />
                  <div className="mt-2">
                    <Button onClick={clearSignature} disabled={busy || !drewSomething} variant="outline" className="text-sm">
                      Limpar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <IconUpload className="w-8 h-8 text-slate-400 mb-3" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                      <p className="text-xs text-slate-400">PNG ou JPG</p>
                    </div>
                    <input
                      type="file" accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e)=> {
                        const f = e.target.files?.[0] || null
                        setSigImgFile(f)
                        if (sigImgPreview) URL.revokeObjectURL(sigImgPreview)
                        const preview = f ? URL.createObjectURL(f) : null
                        setSigImgPreview(preview)
                        setSignaturePreviewUrl(preview)
                      }}
                    />
                  </label>
                  {sigImgPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Prévia da imagem:</p>
                      <img src={sigImgPreview} alt="Preview" className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-white" />
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Card 3: Ação */}
            <Card title="3) Ação">
               <Button onClick={() => assinarESalvar()} disabled={busy || !pdfFile || !signaturePreviewUrl} className="w-full text-base py-2.5">
                 Assinar & Salvar (debug)
               </Button>
               <div className="text-sm text-slate-500 text-center mt-2">A função real de salvar está desabilitada no modo debug.</div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

