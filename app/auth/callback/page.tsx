'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState('Autenticando…');

  useEffect(() => {
    const run = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1) Fluxo PKCE (code)
      const code = search.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setMsg('Tudo certo! Redirecionando…');
          router.replace('/dashboard');
          return;
        }
      }

      // 2) Fluxo magic link (token_hash)
      const token_hash =
        search.get('token_hash') ||
        search.get('token') ||
        search.get('verification_token') ||
        undefined;

      const typeParam = search.get('type');
      const type =
        (typeParam as 'magiclink' | 'signup' | 'recovery' | 'invite' | null) ??
        'magiclink';

      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!error) {
          setMsg('Tudo certo! Redirecionando…');
          router.replace('/dashboard');
          return;
        }
      }

      setMsg('Link inválido ou expirado. Peça um novo no login.');
    };

    run();
  }, [router, search]);

  return (
    <div className="max-w-xl mx-auto py-24">
      <h1 className="text-2xl font-semibold mb-2">Autenticando…</h1>
      <p className="text-slate-600">{msg}</p>
      {msg.startsWith('Link inválido') && (
        <a className="text-indigo-600 underline mt-4 inline-block" href="/login">
          Voltar para o login
        </a>
      )}
    </div>
  );
}
