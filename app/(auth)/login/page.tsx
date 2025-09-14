'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) setError(error.message);
    else router.replace('/dashboard');
  }

  async function onMagicLink(e: React.FormEvent) {
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
      <p className="text-slate-600 mb-6">
        {mode === 'password'
          ? 'Use seu e-mail e senha para acessar.'
          : 'Envie o link mágico para seu e-mail.'}
      </p>

      {mode === 'password' ? (
        <form onSubmit={onPasswordLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setMode('magic');
              setError(null);
            }}
            className="text-sm text-indigo-600 underline"
          >
            Entrar com link mágico
          </button>
        </form>
      ) : sent ? (
        <div className="rounded-lg border p-4 text-sm">
          Verifique sua caixa de entrada. Abra o link no <b>mesmo dispositivo</b> se possível.
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setSent(false);
            }}
            className="mt-4 text-indigo-600 underline"
          >
            Voltar para login com senha
          </button>
        </div>
      ) : (
        <form onSubmit={onMagicLink} className="space-y-4">
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
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError(null);
            }}
            className="text-sm text-indigo-600 underline"
          >
            Entrar com e-mail e senha
          </button>
        </form>
      )}
    </div>
  );
}
