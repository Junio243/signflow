// components/PdfEditor.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
import { logger } from '@/lib/utils/logger';

type Pos = { page: number; nx: number; ny: number; scale: number; rotation: number };
type SignatureSize = { width: number; height: number } | null;

type Props = {
  file: File | null;
  signatureUrl: string | null;
  signatureSize?: SignatureSize;
  positions: Pos[];
  onPositions: (p: Pos[]) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  onDocumentLoaded?: (meta: { pages: number }) => void;
};

if (typeof window !== 'undefined') {
  try {
    const workerSrc = '/pdf.worker.min.mjs';
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;
  } catch (e) {
    logger.warn('Failed to configure PDF worker', e);
  }
}

export default function PdfEditor({
  file,
  signatureUrl,
  signatureSize = null,
  positions,
  onPositions,
  page: controlledPage,
  onPageChange,
  onDocumentLoaded
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for throttling and cleanup
  const rafRef = useRef(false);
  const latestPosRef = useRef<{ nx: number; ny: number } | null>(null);
  const isFirstLoadRef = useRef(true);
  const pdfDocRef = useRef<any>(null);
  const loadingTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    isFirstLoadRef.current = true;

    (async () => {
      // Clean up previous document
      if (pdfDocRef.current) {
        try {
          await pdfDocRef.current.destroy();
          pdfDocRef.current = null;
        } catch (err) {
          logger.warn('Failed to destroy previous PDF document', err);
        }
      }

      if (!file) {
        setPdf(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try with Uint8Array first
        try {
          const ab = await file.arrayBuffer();
          const uint8 = new Uint8Array(ab);

          loadingTaskRef.current = (pdfjsLib as any).getDocument({ data: uint8 });
          const doc = await loadingTaskRef.current.promise;
          
          if (cancelled) {
            await doc?.destroy?.();
            return;
          }
          
          pdfDocRef.current = doc;
          setPdf(doc);
          
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            if (controlledPage === undefined) setPage(1);
            onDocumentLoaded?.({ pages: doc.numPages || 1 });
            onPageChange?.(1);
          }
          return;
        } catch (firstErr) {
          logger.debug('PDF load via Uint8Array failed, trying blob URL', { error: firstErr });
        }

        // Fallback: blob URL
        try {
          blobUrl = URL.createObjectURL(file);
          loadingTaskRef.current = (pdfjsLib as any).getDocument({ url: blobUrl });
          const doc = await loadingTaskRef.current.promise;
          
          if (cancelled) {
            await doc?.destroy?.();
            return;
          }
          
          pdfDocRef.current = doc;
          setPdf(doc);
          
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            if (controlledPage === undefined) setPage(1);
            onDocumentLoaded?.({ pages: doc.numPages || 1 });
            onPageChange?.(1);
          }
          return;
        } catch (secondErr) {
          logger.error('Failed to load PDF', secondErr, { fileName: file.name });
          throw secondErr;
        }
      } catch (err) {
        if (!cancelled) {
          setPdf(null);
          setError('Não foi possível carregar a prévia do PDF.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      
      // Clean up loading task
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch (err) {
          logger.debug('Error destroying loading task', err);
        }
        loadingTaskRef.current = null;
      }
      
      // Revoke blob URL
      if (blobUrl) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          logger.debug('Error revoking blob URL', err);
        }
      }
    };
  }, [file, controlledPage, onDocumentLoaded, onPageChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch((err: any) => {
          logger.debug('Error destroying PDF on unmount', err);
        });
      }
    };
  }, []);

  useEffect(() => { setSigDataUrl(signatureUrl); }, [signatureUrl]);
  useEffect(() => { if (controlledPage !== undefined) setPage(controlledPage); }, [controlledPage]);

  // Render PDF page
  useEffect(() => {
    let cancelled = false;
    let currentPageObj: any = null;
    
    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas || !pdf || cancelled) return;

      try {
        currentPageObj = await pdf.getPage(page);
        if (cancelled) return;
        
        const viewport = currentPageObj.getViewport({ scale });
        canvas.width = viewport.width; 
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext('2d')!;
        
        await currentPageObj.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        // Draw signature if present
        const pos = positions.find(ps => ps.page === page);
        if (pos && sigDataUrl) {
          const img = new Image(); 
          img.src = sigDataUrl; 
          await img.decode();
          if (cancelled) return;
          
          const baseW = signatureSize?.width || img.naturalWidth || 240;
          const baseH = signatureSize?.height || img.naturalHeight || baseW * 0.35;
          const w = baseW * (pos.scale || 1);
          const h = baseH * (pos.scale || 1);
          const cw = canvas.width, ch = canvas.height;
          const x = (pos.nx || 0.5) * cw;
          const y = (pos.ny || 0.5) * ch;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((pos.rotation || 0) * Math.PI / 180);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
        
        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Failed to render PDF page', err, { page });
          setError('Não foi possível renderizar esta página do PDF.');
        }
      }
    }
    
    renderPage();
    
    return () => {
      cancelled = true;
      // Clean up page object if needed
      if (currentPageObj && typeof currentPageObj.cleanup === 'function') {
        try {
          currentPageObj.cleanup();
        } catch (err) {
          logger.debug('Error cleaning up page', err);
        }
      }
    };
  }, [pdf, page, scale, positions, sigDataUrl, signatureSize]);

  const onClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const existing = positions.filter(p => p.page !== page);
    const cw = rect.width || 1;
    const ch = rect.height || 1;
    const nx = Math.max(0, Math.min(1, x / cw));
    const ny = Math.max(0, Math.min(1, y / ch));
    onPositions([...existing, { page, nx, ny, scale: 1, rotation: 0 }]);
  }, [page, positions, onPositions]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    setScale(s => Math.max(0.5, Math.min(3, s + (e.deltaY > 0 ? -0.1 : 0.1))));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!sigDataUrl) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    setDrag({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [sigDataUrl]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag || !sigDataUrl) return;
    
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cw = rect.width || 1;
    const ch = rect.height || 1;
    const nx = Math.max(0, Math.min(1, x / cw));
    const ny = Math.max(0, Math.min(1, y / ch));
    
    latestPosRef.current = { nx, ny };
    
    if (!rafRef.current) {
      rafRef.current = true;
      requestAnimationFrame(() => {
        rafRef.current = false;
        const pos = positions.find(p => p.page === page);
        if (!pos || !latestPosRef.current) return;
        const others = positions.filter(p => p.page !== page);
        onPositions([...others, { ...pos, nx: latestPosRef.current.nx, ny: latestPosRef.current.ny }]);
      });
    }
  }, [drag, sigDataUrl, page, positions, onPositions]);

  const onPointerUp = useCallback(() => {
    setDrag(null);
  }, []);

  useEffect(() => {
    if (controlledPage === undefined) onPageChange?.(page);
  }, [page, controlledPage, onPageChange]);

  const currentPos = positions.find(p => p.page === page);
  const totalPages = pdf?.numPages || 1;

  const changePage = useCallback((next: number) => {
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (controlledPage === undefined) setPage(clamped);
    onPageChange?.(clamped);
  }, [totalPages, controlledPage, onPageChange]);

  const updatePosition = useCallback((updates: Partial<Pos>) => {
    if (!currentPos) return;
    onPositions([
      ...positions.filter(p => p.page !== page),
      { ...currentPos, ...updates }
    ]);
  }, [currentPos, page, positions, onPositions]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button 
          className="btn-secondary min-w-[44px] min-h-[44px] px-3 py-2" 
          onClick={() => changePage(page - 1)} 
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          ◀
        </button>
        <div className="text-sm whitespace-nowrap">p. {page} / {totalPages}</div>
        <button 
          className="btn-secondary min-w-[44px] min-h-[44px] px-3 py-2" 
          onClick={() => changePage(page + 1)} 
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          ▶
        </button>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs sm:text-sm">
          <label className="label m-0 whitespace-nowrap">Tamanho</label>
          <input 
            type="range" 
            min={0.5} 
            max={3} 
            step={0.1} 
            value={currentPos?.scale || 1} 
            onChange={e => updatePosition({ scale: Number(e.target.value) })}
            className="w-20" 
          />
          <label className="label m-0 whitespace-nowrap">Rotação</label>
          <input 
            type="range" 
            min={-45} 
            max={45} 
            step={1} 
            value={currentPos?.rotation || 0} 
            onChange={e => updatePosition({ rotation: Number(e.target.value) })}
            className="w-20" 
          />
        </div>
      </div>
      {currentPos && (
        <div className="flex sm:hidden flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <label className="label m-0 w-16">Tamanho</label>
            <input 
              type="range" 
              min={0.5} 
              max={3} 
              step={0.1} 
              value={currentPos?.scale || 1} 
              onChange={e => updatePosition({ scale: Number(e.target.value) })}
              className="flex-1" 
            />
            <span className="w-12 text-right">{(currentPos?.scale || 1).toFixed(1)}×</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="label m-0 w-16">Rotação</label>
            <input 
              type="range" 
              min={-45} 
              max={45} 
              step={1} 
              value={currentPos?.rotation || 0} 
              onChange={e => updatePosition({ rotation: Number(e.target.value) })}
              className="flex-1" 
            />
            <span className="w-12 text-right">{(currentPos?.rotation || 0).toFixed(0)}°</span>
          </div>
        </div>
      )}
      <div className="relative w-full overflow-auto">
        <canvas
          ref={canvasRef}
          className="rounded-lg border bg-white mx-auto"
          onClick={onClick}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ display: 'block', maxWidth: '100%', height: 'auto', touchAction: 'manipulation' }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border bg-white/80 text-sm text-slate-600">
            Carregando prévia...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border bg-white/90 text-sm text-red-600 text-center px-6">
            {error}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {sigDataUrl
          ? 'Clique para posicionar. Arraste para mover. Use os sliders para ajustar tamanho e rotação.'
          : 'Envie ou desenhe uma assinatura para visualizar aqui. Ainda é possível definir posições clicando nas páginas.'}
      </p>
    </div>
  );
}
