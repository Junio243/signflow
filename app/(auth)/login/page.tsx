'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
      <p className="text-slate-600 mb-6">Envie o link mágico para seu e-mail.</p>

      {sent ? (
        <div className="rounded-lg border p-4 text-sm">
          Verifique sua caixa de entrada. Abra o link no <b>mesmo dispositivo</b> se possível.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar link de acesso'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
