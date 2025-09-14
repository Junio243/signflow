'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState('Validando seu link…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (!code) {
          setMsg('Link inválido ou expirado. Peça um novo no login.');
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        // Login concluído: vá para o dashboard (ajuste se quiser outra rota)
        router.replace('/dashboard');
      } catch (e: any) {
        setMsg(e?.message || 'Não foi possível validar o link.');
      }
    })();
  }, [router]);

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Autenticando…</h1>
      <p className="text-sm text-slate-600">{msg}</p>
    </main>
  );
}
