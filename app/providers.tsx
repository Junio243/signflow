'use client'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/ConfirmModal'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ToastProvider>
  )
}
