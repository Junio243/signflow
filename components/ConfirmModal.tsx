// components/ConfirmModal.tsx
// Modal de confirmação reutilizável. Substitui window.confirm()
// Uso:
//   const { confirm } = useConfirm()
//   const ok = await confirm({ title: 'Deletar?', message: 'Isso é irreversível.' })
'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ContextValue | null>(null);

type ModalState = ConfirmOptions & { open: boolean };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ open: false, message: '' });
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setModal({ ...opts, open: true });
    });
  }, []);

  const handleResolve = (value: boolean) => {
    setModal(prev => ({ ...prev, open: false }));
    resolveRef.current?.(value);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => handleResolve(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {modal.title && (
              <h2 className="mb-2 text-lg font-bold text-slate-900">{modal.title}</h2>
            )}
            <p className="text-sm text-slate-600">{modal.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleResolve(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {modal.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => handleResolve(true)}
                className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white ${
                  modal.danger ?? true
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modal.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de <ConfirmProvider>');
  return ctx;
}
