// app/(auth)/login/page.tsx
'use client';
export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase    = createClient(supabaseUrl, anonKey);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
      <p className="text-sm text-slate-600 mb-6">
        Digite seu e-mail. Enviaremos um link mágico para acessar o SignFlow.
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          required
          className="w-full rounded-lg border px-3 py-2"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
          disabled={sent}
        >
          {sent ? 'Link enviado!' : 'Enviar link mágico'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="text-xs text-slate-500 mt-4">
        Dica: verifique caixa de entrada e spam. No DF, alguns provedores demoram alguns segundos para entregar o e-mail.
      </p>
    </div>
  );
}
