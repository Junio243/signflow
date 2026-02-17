// components/Toast.tsx
// Sistema de notificações toast não-bloqueante.
// Uso: const { toast } = useToast()
//      toast.success('Feito!') | toast.error('Erro') | toast.info('Info')
'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
  id: string;
  tone: ToastTone;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toast: {
    success: (message: string, duration?: number) => void;
    error:   (message: string, duration?: number) => void;
    info:    (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error:   'border-red-200 bg-red-50 text-red-800',
  info:    'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const TONE_ICONS: Record<ToastTone, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string, duration = 4000) => {
    const id = genId();
    setToasts(prev => [...prev.slice(-4), { id, tone, message, duration }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg: string, dur?: number) => push('success', msg, dur),
    error:   (msg: string, dur?: number) => push('error',   msg, dur),
    info:    (msg: string, dur?: number) => push('info',    msg, dur),
    warning: (msg: string, dur?: number) => push('warning', msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal de toasts */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-4 z-50 flex flex-col-reverse gap-2 w-full max-w-sm"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm transition-all animate-in fade-in slide-in-from-bottom-4 ${
              TONE_STYLES[t.tone]
            }`}
          >
            <span className="text-base shrink-0">{TONE_ICONS[t.tone]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 text-xs leading-none"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
