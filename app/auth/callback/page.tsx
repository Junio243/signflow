'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Validando seu login…');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handle = async () => {
      try {
        const url = new URL(window.location.href);
        const token_hash = url.searchParams.get('token_hash');
        const type = (url.searchParams.get('type') || 'magiclink') as
          | 'magiclink'
          | 'recovery'
          | 'signup'
          | 'invite';

        if (token_hash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
        }

        // checa sessão e vai pro dashboard
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
        } else {
          setMsg('Não foi possível validar sua sessão. Tente novamente.');
          setTimeout(() => router.replace('/login'), 1500);
        }
      } catch (e: any) {
        setMsg(e?.message || 'Erro ao validar login.');
        setTimeout(() => router.replace('/login'), 1500);
      }
    };

    handle();
  }, [router, supabase]);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="bg-white p-6 rounded-2xl border shadow w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Aguarde…</h1>
        <p className="text-slate-600">{msg}</p>
      </div>
    </main>
  );
}
