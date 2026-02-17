// components/PdfTextOverlay.tsx
// Permite adicionar anotações de texto e campos sobre o PDF.
// Esses campos são enviados para a API /api/sign como metadados de sobreposição.
'use client';
import { useCallback, useState } from 'react';

export type TextAnnotation = {
  id: string;
  page: number;
  text: string;
  nx: number; // posição normalizada 0-1
  ny: number;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
};

type Props = {
  totalPages: number;
  currentPage: number;
  annotations: TextAnnotation[];
  onAnnotations: (a: TextAnnotation[]) => void;
  onGoToPage: (page: number) => void;
};

const COLORS = [
  { label: 'Preto', value: '#111827' },
  { label: 'Azul', value: '#1d4ed8' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Cinza', value: '#6b7280' },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PdfTextOverlay({ totalPages, currentPage, annotations, onAnnotations, onGoToPage }: Props) {
  const [text, setText] = useState('');
  const [page, setPage] = useState(currentPage);
  const [nx, setNx] = useState(0.5);
  const [ny, setNy] = useState(0.5);
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#111827');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setText('');
    setNx(0.5); setNy(0.5);
    setFontSize(12);
    setColor('#111827');
    setBold(false); setItalic(false);
    setAlign('left');
    setEditingId(null);
  }, []);

  const handleAdd = () => {
    if (!text.trim()) return;
    if (editingId) {
      onAnnotations(annotations.map(a =>
        a.id === editingId ? { ...a, text, page, nx, ny, fontSize, color, bold, italic, align } : a
      ));
      resetForm();
      return;
    }
    const annotation: TextAnnotation = {
      id: genId(),
      page,
      text: text.trim(),
      nx, ny, fontSize, color, bold, italic, align,
    };
    onAnnotations([...annotations, annotation]);
    setText('');
  };

  const handleEdit = (a: TextAnnotation) => {
    setEditingId(a.id);
    setText(a.text);
    setPage(a.page);
    setNx(a.nx); setNy(a.ny);
    setFontSize(a.fontSize);
    setColor(a.color);
    setBold(a.bold); setItalic(a.italic);
    setAlign(a.align);
    onGoToPage(a.page);
  };

  const handleDelete = (id: string) => {
    onAnnotations(annotations.filter(a => a.id !== id));
    if (editingId === id) resetForm();
  };

  const pageAnnotations = annotations.filter(a => a.page === currentPage);

  return (
    <div className="space-y-4">
      {/* ── Formulário de nova anotação ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {editingId ? '✏️ Editar texto' : '+ Adicionar texto ao PDF'}
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Texto</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Digite o texto a ser inserido no documento..."
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Página</label>
            <select
              value={page}
              onChange={e => { setPage(Number(e.target.value)); onGoToPage(Number(e.target.value)); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <option key={i + 1} value={i + 1}>Página {i + 1}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Tamanho da fonte</label>
            <input
              type="number" min={6} max={72} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Posição horizontal (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={Math.round(nx * 100)}
                onChange={e => setNx(Number(e.target.value) / 100)}
                className="flex-1 accent-blue-600"
              />
              <span className="text-xs text-slate-500 w-8 text-right">{Math.round(nx * 100)}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Posição vertical (%)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={Math.round(ny * 100)}
                onChange={e => setNy(Number(e.target.value) / 100)}
                className="flex-1 accent-blue-600"
              />
              <span className="text-xs text-slate-500 w-8 text-right">{Math.round(ny * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Cor</label>
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    color === c.value ? 'border-blue-500 scale-110' : 'border-slate-200'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border border-slate-300"
                title="Cor personalizada"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Estilo</label>
            <div className="flex gap-1">
              <button
                onClick={() => setBold(b => !b)}
                className={`h-8 w-8 rounded-lg border text-sm font-bold transition ${
                  bold ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
                title="Negrito"
              >B</button>
              <button
                onClick={() => setItalic(it => !it)}
                className={`h-8 w-8 rounded-lg border text-sm italic transition ${
                  italic ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
                title="Itálico"
              ><em>I</em></button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Alinhamento</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAlign(a)}
                  className={`h-8 w-8 rounded-lg border text-xs transition ${
                    align === a ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  title={a === 'left' ? 'Esquerda' : a === 'center' ? 'Centro' : 'Direita'}
                >
                  {a === 'left' ? '⬜↙' : a === 'center' ? '⬜↓' : '⬜↘'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? 'Salvar edição' : 'Adicionar texto'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de anotações ── */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Textos adicionados ({annotations.length})
          </h4>
          {annotations.map(a => (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                a.page === currentPage ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: a.color }}
                  >
                    p. {a.page}
                  </span>
                  <span className="text-xs text-slate-500">{a.fontSize}pt</span>
                  {a.bold && <span className="text-xs font-bold text-slate-600">N</span>}
                  {a.italic && <span className="text-xs italic text-slate-600">I</span>}
                </div>
                <p
                  className="mt-1 text-slate-700 truncate"
                  style={{
                    fontWeight: a.bold ? 'bold' : 'normal',
                    fontStyle: a.italic ? 'italic' : 'normal',
                    color: a.color,
                  }}
                >
                  {a.text}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { handleEdit(a); }}
                  className="h-7 w-7 rounded border border-slate-200 bg-white text-slate-500 hover:text-blue-600 text-xs"
                  title="Editar"
                >✎</button>
                <button
                  onClick={() => onGoToPage(a.page)}
                  className="h-7 w-7 rounded border border-slate-200 bg-white text-slate-500 hover:text-blue-600 text-xs"
                  title="Ir para esta página"
                >↗</button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="h-7 w-7 rounded border border-red-100 bg-white text-red-400 hover:text-red-600 text-xs"
                  title="Remover"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Anotações na página atual destacadas ── */}
      {pageAnnotations.length > 0 && (
        <p className="text-xs text-blue-600">
          {pageAnnotations.length} texto{pageAnnotations.length > 1 ? 's' : ''} nesta página
        </p>
      )}
    </div>
  );
}
