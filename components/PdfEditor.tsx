// components/PdfEditor.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;

type Pos = { page: number; nx: number; ny: number; scale: number; rotation: number };

type Props = {
  file: File | null;
  signature: File | null;
  positions: Pos[];
  onPositions: (p: Pos[]) => void;
};

export default function PdfEditor({ file, signature, positions, onPositions }: Props){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{x:number,y:number}|null>(null);

  // throttle refs
  const rafRef = useRef(false);
  const latestPosRef = useRef<{nx:number, ny:number} | null>(null);

  useEffect(()=>{
    (async()=>{
      if (!file) return;
      const ab = await file.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({data: ab});
      setPdf(await loadingTask.promise);
      setPage(1);
    })();
  }, [file]);

  useEffect(()=>{
    if (!signature) return setSigDataUrl(null);
    const fr = new FileReader();
    fr.onload = ()=> setSigDataUrl(String(fr.result));
    fr.readAsDataURL(signature);
  }, [signature]);

  useEffect(()=>{ renderPage(); }, [pdf, page, scale, positions, sigDataUrl]);

  async function renderPage(){
    const canvas = canvasRef.current; if (!canvas || !pdf) return;
    const p = await pdf.getPage(page);
    const viewport = p.getViewport({ scale });
    canvas.width = viewport.width; canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await p.render({ canvasContext: ctx, viewport }).promise;

    const pos = positions.find(ps=>ps.page===page);
    if (pos && sigDataUrl){
      const img = new Image(); img.src = sigDataUrl; await img.decode();
      const w = 240 * pos.scale; const h = w * 0.35;
      const cw = canvas.width, ch = canvas.height;
      const x = (pos.nx||0.5) * cw; const y = (pos.ny||0.5) * ch;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((pos.rotation||0) * Math.PI/180);
      ctx.drawImage(img, -w/2, -h/2, w, h);
      ctx.restore();
    }
  }

  function onClick(e: React.MouseEvent){
    // usar bounding rect para normalizar (CSS pixels) => consistente com preview logic
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const existing = positions.filter(p=>p.page!==page);
    const cw = rect.width || 1; const ch = rect.height || 1;
    const nx = x / cw; const ny = y / ch;
    onPositions([...existing, { page, nx, ny, scale: 1, rotation: 0 }]);
  }

  function onWheel(e: React.WheelEvent){ setScale(s=>Math.max(0.5, Math.min(3, s + (e.deltaY>0?-0.1:0.1)))); }

  function onPointerDown(e: React.PointerEvent){
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    setDrag({x: e.clientX - rect.left, y: e.clientY - rect.top});
  }

  function onPointerMove(e: React.PointerEvent){
    if(!drag) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const cw = rect.width || 1; const ch = rect.height || 1;
    const nx = x / cw; const ny = y / ch;
    latestPosRef.current = { nx, ny };
    if (!rafRef.current) {
      rafRef.current = true;
      requestAnimationFrame(()=>{
        rafRef.current = false;
        const pos = positions.find(p=>p.page===page); if(!pos) return;
        const others = positions.filter(p=>p.page!==page);
        onPositions([...others, { ...pos, nx: latestPosRef.current!.nx, ny: latestPosRef.current!.ny }]);
      });
    }
  }

  function onPointerUp(){ setDrag(null); }

  const pos = positions.find(p=>p.page===page);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))}>◀</button>
        <div>p. {page}</div>
        <button className="btn" onClick={()=>setPage(p=>Math.min(pdf?.numPages||1,p+1))}>▶</button>
        <div className="ml-auto flex items-center gap-2">
          <label className="label m-0">Tamanho</label>
          <input type="range" min={0.5} max={3} step={0.1} value={pos?.scale||1} onChange={e=>{
            const v = Number(e.target.value);
            if(!pos) return; onPositions([...positions.filter(p=>p.page!==page), {...pos, scale:v}]);
          }} />
          <label className="label m-0">Rotação</label>
          <input type="range" min={-45} max={45} step={1} value={pos?.rotation||0} onChange={e=>{
            const v = Number(e.target.value);
            if(!pos) return; onPositions([...positions.filter(p=>p.page!==page), {...pos, rotation:v}]);
          }} />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-lg border bg-white max-w-full"
        onClick={onClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <p className="text-xs text-slate-500">Clique para posicionar. Arraste para mover. Use os sliders para tamanho/rotação.</p>
    </div>
  );
}
