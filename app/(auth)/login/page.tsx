export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setOk(null); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setOk('Enviamos um link de login para seu e-mail.');
  };

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form onSubmit={sendMagic} className="w-full max-w-md bg-white p-6 rounded-2xl border shadow">
        <h1 className="text-xl font-semibold mb-2">Entrar</h1>
        <p className="text-sm text-slate-600 mb-4">Receba um link mágico por e-mail.</p>
        <input
          type="email"
          required
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-sky-600 text-white py-2 hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar link de login'}
        </button>
        {ok && <p className="mt-3 text-green-600 text-sm">{ok}</p>}
        {err && <p className="mt-3 text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}
