// components/PdfEditor.tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

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
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (e) {
    console.warn('PdfEditor: não foi possível configurar workerSrc:', e);
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
  onDocumentLoaded,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showThumbs, setShowThumbs] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const rafRef = useRef(false);
  const latestPosRef = useRef<{ nx: number; ny: number } | null>(null);
  const isFirstLoadRef = useRef(true);
  const renderTaskRef = useRef<any>(null);

  // ── Carrega PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    let blobUrl: string | null = null;
    isFirstLoadRef.current = true;

    (async () => {
      if (!file) { setPdf(null); setError(null); setThumbnails([]); return; }
      try {
        setLoading(true);
        setError(null);
        try {
          const ab = await file.arrayBuffer();
          const uint8 = new Uint8Array(ab);
          const loadingTask = pdfjsLib.getDocument({ data: uint8 });
          task = loadingTask;
          const doc = await loadingTask.promise;
          if (cancelled) { doc?.destroy?.(); return; }
          setPdf(doc);
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            if (controlledPage === undefined) setPage(1);
            onDocumentLoaded?.({ pages: doc.numPages || 1 });
            onPageChange?.(1);
          }
          // gera miniaturas em background
          generateThumbnails(doc);
          return;
        } catch {
          // fallback blob
        }
        blobUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument({ url: blobUrl });
        task = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) { doc?.destroy?.(); return; }
        setPdf(doc);
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
          if (controlledPage === undefined) setPage(1);
          onDocumentLoaded?.({ pages: doc.numPages || 1 });
          onPageChange?.(1);
        }
        generateThumbnails(doc);
      } catch (err: any) {
        console.error('PdfEditor: falha ao carregar PDF', err);
        if (!cancelled) { setPdf(null); setError('Não foi possível carregar a prévia do PDF.'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      try { task?.destroy?.(); } catch {}
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch {} }
    };
  }, [file]);

  // ── Miniaturas ────────────────────────────────────────────────────────────────
  const generateThumbnails = useCallback(async (doc: PDFDocumentProxy) => {
    const thumbs: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const p = await doc.getPage(i);
        const vp = p.getViewport({ scale: 0.18 });
        const c = document.createElement('canvas');
        c.width = vp.width; c.height = vp.height;
        const ctx = c.getContext('2d')!;
        await p.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbs.push(c.toDataURL('image/jpeg', 0.6));
      } catch { thumbs.push(''); }
    }
    setThumbnails(thumbs);
  }, []);

  useEffect(() => { setSigDataUrl(signatureUrl); }, [signatureUrl]);
  useEffect(() => { if (controlledPage !== undefined) setPage(controlledPage); }, [controlledPage]);

  // ── Renderiza página ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas || !pdf || cancelled) return;

      try {
        // cancela render anterior se houver
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch {}
          renderTaskRef.current = null;
        }

        const p = await pdf.getPage(page);
        if (cancelled) return;

        const viewport = p.getViewport({ scale: zoom });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderTask = p.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;
        renderTaskRef.current = null;

        // desenha assinaturas na página atual
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
          const cw = canvas.width; const ch = canvas.height;
          const x = (pos.nx || 0.5) * cw; const y = (pos.ny || 0.5) * ch;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((pos.rotation || 0) * Math.PI / 180);
          ctx.globalAlpha = 0.92;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();

          // indicador de posição (cross-hair)
          ctx.save();
          ctx.strokeStyle = 'rgba(37,99,235,0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4);
          ctx.restore();
        }

        if (!cancelled) setError(null);
      } catch (err: any) {
        if (cancelled || err?.name === 'RenderingCancelledException') return;
        console.error('PdfEditor: erro ao renderizar página', err);
        setError('Não foi possível renderizar esta página.');
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pdf, page, zoom, positions, sigDataUrl, signatureSize]);

  // ── Interações ────────────────────────────────────────────────────────────────
  function getRelativePos(e: React.MouseEvent | React.PointerEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      nx: (e.clientX - rect.left) / (rect.width || 1),
      ny: (e.clientY - rect.top) / (rect.height || 1),
    };
  }

  function onClick(e: React.MouseEvent) {
    if (drag) return; // não registra clique após drag
    const { nx, ny } = getRelativePos(e);
    const existing = positions.filter(p => p.page !== page);
    onPositions([...existing, { page, nx, ny, scale: 1, rotation: 0 }]);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(4, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!sigDataUrl) return;
    const { x, y } = getRelativePos(e);
    setDrag({ x, y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const { nx, ny } = getRelativePos(e);
    setHoverPos({ x: e.clientX, y: e.clientY });
    if (!drag) return;
    if (!sigDataUrl) return;
    latestPosRef.current = { nx, ny };
    if (!rafRef.current) {
      rafRef.current = true;
      requestAnimationFrame(() => {
        rafRef.current = false;
        const pos = positions.find(p => p.page === page); if (!pos) return;
        const others = positions.filter(p => p.page !== page);
        onPositions([...others, { ...pos, nx: latestPosRef.current!.nx, ny: latestPosRef.current!.ny }]);
      });
    }
  }

  function onPointerUp() { setDrag(null); }
  function onPointerLeave() { setDrag(null); setHoverPos(null); }

  useEffect(() => {
    if (controlledPage === undefined) onPageChange?.(page);
  }, [page, controlledPage, onPageChange]);

  const currentPos = positions.find(p => p.page === page);
  const totalPages = pdf?.numPages || 1;

  function changePage(next: number) {
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (controlledPage === undefined) setPage(clamped);
    onPageChange?.(clamped);
  }

  const hasSignatureOnPage = !!currentPos;

  return (
    <div className="space-y-3">
      {/* ── Barra de controles ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Navegação de páginas */}
        <div className="flex items-center gap-1">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => changePage(1)}
            disabled={page <= 1}
            title="Primeira página"
          >«</button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
            title="Página anterior"
          >‹</button>
          <span className="min-w-[72px] text-center text-sm text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => changePage(page + 1)}
            disabled={page >= totalPages}
            title="Próxima página"
          >›</button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => changePage(totalPages)}
            disabled={page >= totalPages}
            title="Última página"
          >»</button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-base font-bold"
            onClick={() => setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(1)))}
            disabled={zoom <= 0.5}
            title="Diminuir zoom"
          >−</button>
          <span className="min-w-[48px] text-center text-sm text-slate-600">{Math.round(zoom * 100)}%</span>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-base font-bold"
            onClick={() => setZoom(z => Math.min(4, +(z + 0.2).toFixed(1)))}
            disabled={zoom >= 4}
            title="Aumentar zoom"
          >+</button>
          <button
            className="inline-flex h-9 px-2 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => setZoom(1.2)}
            title="Zoom padrão"
          >⟳ 100%</button>
        </div>

        {/* Miniaturas toggle */}
        {thumbnails.length > 1 && (
          <button
            className={`inline-flex h-9 px-3 items-center justify-center rounded-lg border text-xs font-medium transition ${
              showThumbs ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setShowThumbs(s => !s)}
          >
            🗂 Páginas
          </button>
        )}
      </div>

      {/* ── Sliders de escala/rotação (quando há assinatura posicionada) ── */}
      {currentPos && (
        <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
          <div className="flex flex-1 items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-medium text-slate-600">Tamanho</span>
            <input
              type="range" min={0.3} max={3} step={0.05}
              value={currentPos.scale || 1}
              onChange={e => {
                const v = Number(e.target.value);
                onPositions([...positions.filter(p => p.page !== page), { ...currentPos, scale: v }]);
              }}
              className="flex-1 accent-blue-600"
            />
            <span className="w-10 text-right text-xs text-slate-500">{(currentPos.scale || 1).toFixed(2)}×</span>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-medium text-slate-600">Rotação</span>
            <input
              type="range" min={-180} max={180} step={1}
              value={currentPos.rotation || 0}
              onChange={e => {
                const v = Number(e.target.value);
                onPositions([...positions.filter(p => p.page !== page), { ...currentPos, rotation: v }]);
              }}
              className="flex-1 accent-blue-600"
            />
            <span className="w-10 text-right text-xs text-slate-500">{(currentPos.rotation || 0).toFixed(0)}°</span>
          </div>
          <button
            className="self-start sm:self-center text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
            onClick={() => onPositions(positions.filter(p => p.page !== page))}
          >
            ✕ Remover da página
          </button>
        </div>
      )}

      {/* ── Miniaturas ── */}
      {showThumbs && thumbnails.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {thumbnails.map((thumb, i) => {
            const pageNum = i + 1;
            const hasSig = positions.some(p => p.page === pageNum);
            return (
              <button
                key={i}
                onClick={() => changePage(pageNum)}
                className={`relative shrink-0 rounded-lg border-2 overflow-hidden transition ${
                  page === pageNum ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
                title={`Ir para página ${pageNum}`}
              >
                {thumb ? (
                  <img src={thumb} alt={`Página ${pageNum}`} className="h-24 w-auto" />
                ) : (
                  <div className="h-24 w-16 bg-slate-100 flex items-center justify-center text-xs text-slate-400">{pageNum}</div>
                )}
                {hasSig && (
                  <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white" title="Assinatura posicionada" />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] text-center py-0.5">{pageNum}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Canvas principal ── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-auto rounded-xl border border-slate-200 bg-slate-100"
        style={{ maxHeight: '70vh' }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-white mx-auto block shadow-sm"
          onClick={onClick}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          style={{
            display: 'block',
            maxWidth: '100%',
            cursor: sigDataUrl ? (drag ? 'grabbing' : 'crosshair') : 'default',
            touchAction: 'manipulation',
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/90 text-sm text-slate-600">
            <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Carregando prévia...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/90 text-sm text-red-600 text-center px-6">
            {error}
          </div>
        )}
      </div>

      {/* ── Dica de uso ── */}
      <p className="text-xs text-slate-500">
        {sigDataUrl
          ? hasSignatureOnPage
            ? '✓ Assinatura posicionada nesta página. Arraste para reposicionar ou use os sliders acima.'
            : 'Clique na página para posicionar a assinatura. Use a roda do mouse para zoom.'
          : 'Envie ou desenhe uma assinatura para posicioná-la nas páginas. Use a roda do mouse para zoom.'}
      </p>
    </div>
  );
}
