// app/auth/callback/page.tsx
import React, { Suspense } from 'react';
import AuthCallbackClient from '@/components/AuthCallbackClient';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 520, margin: '24px auto', padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entrando…</h1>
        <p>Finalizando login…</p>
      </div>
    }>
      <AuthCallbackClient />
    </Suspense>
  );
}
