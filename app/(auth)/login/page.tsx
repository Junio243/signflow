'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Cliente do Supabase no browser (usa variáveis públicas do Vercel)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setMsg('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatus('error');
      setMsg(error.message);
    } else {
      setStatus('ok');
      setMsg('Enviamos um link de login para o seu e-mail.');
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form
        onSubmit={sendMagicLink}
        className="w-full max-w-md bg-white p-6 rounded-2xl border shadow"
      >
        <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
        <p className="text-sm text-slate-600 mb-6">
          Informe seu e-mail para receber um link mágico de acesso.
        </p>

        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input
          type="email"
          required
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-sky-500"
        />

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-lg bg-sky-600 text-white py-2 font-medium hover:bg-sky-700 disabled:opacity-60"
        >
          {status === 'sending' ? 'Enviando…' : 'Enviar link de login'}
        </button>

        {msg && (
          <p
            className={`mt-4 text-sm ${
              status === 'ok' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-slate-600'
            }`}
          >
            {msg}
          </p>
        )}
      </form>
    </main>
  );
}
