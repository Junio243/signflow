'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /** Tamanho em px (padrão: 24) */
  size?: number;
  /** Espessura do traço (padrão: 2) */
  strokeWidth?: number;
  /** Classe extra de cor Tailwind (padrão: text-brand-600) */
  className?: string;
  /** Texto para leitores de tela */
  label?: string;
}

/** Spinner SVG leve, acessível e animado */
export function LoadingSpinner({
  size = 24,
  strokeWidth = 2,
  className = 'text-brand-600',
  label = 'Carregando…',
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`animate-spin ${className}`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" className="opacity-25" />
        <path d="M12 2a10 10 0 0 1 10 10" className="opacity-90" />
      </svg>
    </span>
  );
}
