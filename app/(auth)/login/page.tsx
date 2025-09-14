'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState<string>('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMsg('');

    // Depois que o usuário clicar no e-mail, ele volta para esta rota:
    const redirect = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });

    if (error) {
      setStatus('error');
      setMsg(error.message || 'Falha ao enviar o link. Tente novamente.');
      return;
    }

    setStatus('sent');
    setMsg('Enviamos um e-mail com seu link de acesso. Abra pelo mesmo dispositivo.');
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Entrar por e-mail</h1>

      <form onSubmit={handleSend} className="space-y-3">
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-md px-3 py-2 bg-blue-600 text-white"
        >
          {status === 'sending' ? 'Enviando…' : 'Enviar link mágico'}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
