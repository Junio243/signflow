'use client'

import { useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'

type ValidateErrorFallbackProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ValidateErrorFallback({ error, reset }: ValidateErrorFallbackProps) {
  useEffect(() => {
    console.error('[Validate][error boundary] Falha inesperada ao carregar validação', error)
  }, [error])

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '48px auto',
        padding: 24,
        borderRadius: 16,
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: '#7f1d1d',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'rgba(185, 28, 28, 0.1)',
          borderRadius: '50%',
          width: 72,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldAlert size={36} color="#b91c1c" strokeWidth={2.5} />
      </div>

      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Não foi possível carregar a validação</h1>
        <p style={{ margin: '12px 0 0', fontSize: 14, color: '#7f1d1d' }}>
          Ocorreu um erro inesperado ao consultar os dados do documento. Tente novamente ou contate o suporte se o problema persistir.
        </p>
      </div>

      {error?.message && (
        <code
          style={{
            display: 'inline-block',
            background: '#fee2e2',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#991b1b',
            maxWidth: '100%',
            overflowWrap: 'anywhere',
          }}
        >
          {error.message}
        </code>
      )}

      <button
        type="button"
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 9999,
          padding: '12px 20px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(37,99,235,0.15)',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
