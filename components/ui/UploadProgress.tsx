'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ProgressBar } from './ProgressBar';

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadProgressProps {
  state: UploadState;
  progress?: number;   // 0-100
  fileName?: string;
  errorMessage?: string;
  successMessage?: string;
  onRetry?: () => void;
}

const STATE_CONFIG: Record<
  UploadState,
  { icon: string; label: string; color: string; bg: string; border: string }
> = {
  idle:       { icon: '📎', label: '',                    color: 'text-slate-600', bg: 'bg-slate-50',   border: 'border-slate-200' },
  uploading:  { icon: '⬆️', label: 'Enviando arquivo…',  color: 'text-brand-700', bg: 'bg-brand-50',  border: 'border-brand-200' },
  processing: { icon: '⚙️', label: 'Processando…',       color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200' },
  success:    { icon: '✅', label: 'Concluído!',          color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  error:      { icon: '❌', label: 'Erro no envio',       color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200'   },
};

/**
 * Feedback visual completo para uploads e processamento de arquivos.
 *
 * @example
 * <UploadProgress
 *   state={uploadState}
 *   progress={progress}
 *   fileName={file?.name}
 *   errorMessage={error}
 *   onRetry={handleRetry}
 * />
 */
export function UploadProgress({
  state,
  progress = 0,
  fileName,
  errorMessage,
  successMessage,
  onRetry,
}: UploadProgressProps) {
  if (state === 'idle') return null;

  const cfg = STATE_CONFIG[state];
  const isLoading = state === 'uploading' || state === 'processing';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`rounded-xl border p-4 transition-all ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-3">
        {/* Ícone / Spinner */}
        <div className="mt-0.5 flex-shrink-0">
          {isLoading ? (
            <LoadingSpinner size={20} className={cfg.color} />
          ) : (
            <span className="text-xl" aria-hidden="true">{cfg.icon}</span>
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${cfg.color}`}>
            {state === 'success' && successMessage ? successMessage : cfg.label}
          </p>

          {fileName && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{fileName}</p>
          )}

          {state === 'error' && errorMessage && (
            <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
          )}

          {/* Barra de progresso */}
          {state === 'uploading' && (
            <div className="mt-2">
              <ProgressBar value={progress} showPercent colorClass="bg-brand-600" />
            </div>
          )}

          {state === 'processing' && (
            <div className="mt-2">
              <ProgressBar
                value={100}
                label="Aguarde…"
                colorClass="bg-amber-500 animate-pulse"
              />
            </div>
          )}
        </div>

        {/* Botão Tentar novamente */}
        {state === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
