// components/PdfEditor.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
// usar a build legacy evita diversos problemas com bundlers/Next.js
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
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
    const ver = (pdfjsLib as any).version || 'latest';
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.js`;
  } catch (e) {
    console.warn('Não foi possível configurar GlobalWorkerOptions.workerSrc automaticamente:', e);
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

  // throttle refs
  const rafRef = useRef(false);
  const latestPosRef = useRef<{ nx: number; ny: number } | null>(null);

  // Log quando 'file' muda
  useEffect(() => {
    console.log('PdfEditor: prop file mudou ->', file ? { name: file.name, size: file.size } : null);
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    let task: any;
    let blobUrl: string | null = null;

    (async () => {
      if (!file) {
        console.log('PdfEditor: sem arquivo, limpando estado.');
        setPdf(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('PdfEditor: iniciando load do arquivo:', { name: file.name, size: file.size });

        // 1) tenta com Uint8Array (recomendado)
        try {
          const ab = await file.arrayBuffer();
          console.log('PdfEditor: arrayBuffer lido, byteLength=', ab.byteLength);
          const uint8 = new Uint8Array(ab);

          task = (pdfjsLib as any).getDocument({ data: uint8 });
          const doc = await task.promise;
          if (cancelled) { await doc?.destroy?.(); return; }
          console.log('PdfEditor: pdf carregado via Uint8Array, páginas=', doc.numPages);
          setPdf(doc);
          if (controlledPage === undefined) setPage(1);
          onDocumentLoaded?.({ pages: doc.numPages || 1 });
          onPageChange?.(1);
          return;
        } catch (firstErr) {
          console.warn('PdfEditor: getDocument usando Uint8Array falhou — tentando blob URL. Erro:', firstErr);
        }

        // 2) fallback: blob URL
        try {
          blobUrl = URL.createObjectURL(file);
          console.log('PdfEditor: tentando getDocument via blob URL:', blobUrl);
          task = (pdfjsLib as any).getDocument({ url: blobUrl });
          const doc = await task.promise;
          if (cancelled) { await doc?.destroy?.(); return; }
          console.log('PdfEditor: pdf carregado via blob URL, páginas=', doc.numPages);
          setPdf(doc);
          if (controlledPage === undefined) setPage(1);
          onDocumentLoaded?.({ pages: doc.numPages || 1 });
          onPageChange?.(1);
          return;
        } catch (secondErr) {
          console.warn('PdfEditor: getDocument via blob URL também falhou:', secondErr);
          throw secondErr;
        }
      } catch (err: any) {
        console.error('Falha ao carregar PDF para prévia:', err?.name, err?.message, err);
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
      try {
        task?.destroy?.();
      } catch (cleanupErr) {
        console.warn('PdfEditor: erro ao destruir task de carregamento', cleanupErr);
      }
      if (blobUrl) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (revokeErr) {
          console.warn('PdfEditor: erro ao revogar blob URL', revokeErr);
        }
      }
    };
  }, [file, controlledPage, onDocumentLoaded, onPageChange]);

  useEffect(() => { setSigDataUrl(signatureUrl); }, [signatureUrl]);
  useEffect(() => { if (controlledPage !== undefined) setPage(controlledPage); }, [controlledPage]);

  useEffect(() => { renderPage(); }, [pdf, page, scale, positions, sigDataUrl, signatureSize]);

  async function renderPage() {
    const canvas = canvasRef.current;
    if (!canvas) { console.log('PdfEditor.renderPage: canvas não encontrado'); return; }
    if (!pdf) { console.log('PdfEditor.renderPage: pdf não definido'); return; }

    try {
      console.log('PdfEditor.renderPage: renderizando página', page);
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({ scale });
      canvas.width = viewport.width; canvas.height = viewport.height;
      // também atualiza estilo CSS para evitar que canvas fique com 0x0 visualmente
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext('2d')!;
      await p.render({ canvasContext: ctx, viewport }).promise;
      console.log('PdfEditor.renderPage: render concluído para página', page);

      const pos = positions.find(ps => ps.page === page);
      if (pos && sigDataUrl) {
        const img = new Image(); img.src = sigDataUrl; await img.decode();
        const baseW = signatureSize?.width || img.naturalWidth || 240;
        const baseH = signatureSize?.height || img.naturalHeight || baseW * 0.35;
        const w = baseW * (pos.scale || 1);
        const h = baseH * (pos.scale || 1);
        const cw = canvas.width, ch = canvas.height;
        const x = (pos.nx || 0.5) * cw; const y = (pos.ny || 0.5) * ch;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((pos.rotation || 0) * Math.PI / 180);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      setError(null);
    } catch (err: any) {
      console.error('Falha ao renderizar página do PDF:', err?.name, err?.message, err);
      setError('Não foi possível renderizar esta página do PDF.');
    }
  }

  function onClick(e: React.MouseEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const existing = positions.filter(p => p.page !== page);
    const cw = rect.width || 1; const ch = rect.height || 1;
    const nx = x / cw; const ny = y / ch;
    onPositions([...existing, { page, nx, ny, scale: 1, rotation: 0 }]);
  }

  function onWheel(e: React.WheelEvent) { setScale(s => Math.max(0.5, Math.min(3, s + (e.deltaY > 0 ? -0.1 : 0.1)))); }

  function onPointerDown(e: React.PointerEvent) {
    if (!sigDataUrl) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    setDrag({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    if (!sigDataUrl) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const cw = rect.width || 1; const ch = rect.height || 1;
    const nx = x / cw; const ny = y / ch;
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => changePage(page - 1)} disabled={page <= 1}>◀</button>
        <div>p. {page} / {totalPages}</div>
        <button className="btn" onClick={() => changePage(page + 1)} disabled={page >= totalPages}>▶</button>
        <div className="ml-auto flex items-center gap-2">
          <label className="label m-0">Tamanho</label>
          <input type="range" min={0.5} max={3} step={0.1} value={currentPos?.scale || 1} onChange={e => {
            const v = Number(e.target.value);
            if (!currentPos) return; onPositions([...positions.filter(p => p.page !== page), { ...currentPos, scale: v }]);
          }} />
          <label className="label m-0">Rotação</label>
          <input type="range" min={-45} max={45} step={1} value={currentPos?.rotation || 0} onChange={e => {
            const v = Number(e.target.value);
            if (!currentPos) return; onPositions([...positions.filter(p => p.page !== page), { ...currentPos, rotation: v }]);
          }} />
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg border bg-white max-w-full"
          onClick={onClick}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ display: 'block', maxWidth: '100%' }}
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
