'use client';

import React from 'react';

interface ProgressBarProps {
  /** Valor de 0 a 100 */
  value: number;
  /** Texto descritivo */
  label?: string;
  /** Mostrar percentual */
  showPercent?: boolean;
  /** Cor da barra (classe Tailwind bg-*) */
  colorClass?: string;
}

/**
 * Barra de progresso acessível para uploads e operações longas.
 *
 * @example
 * <ProgressBar value={uploadProgress} label="Enviando PDF…" showPercent />
 */
export function ProgressBar({
  value,
  label,
  showPercent = false,
  colorClass = 'bg-brand-600',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-slate-700">{label}</span>}
          {showPercent && (
            <span className="tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progresso'}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
