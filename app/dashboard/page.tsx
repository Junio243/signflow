// app/dashboard/page.tsx
'use client';
export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Doc = {
  id: string;
  original_pdf_name: string | null;
  status: string | null;
  created_at: string;
  signed_pdf_url: string | null;
  qr_code_url: string | null;
};

export default function Dashboard() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se variáveis estiverem ausentes, evita quebrar a página no build/SSR
    if (!url || !key) {
      setErr('Variáveis de ambiente do Supabase ausentes.');
      setLoading(false);
      return;
    }

    const supabase = createClient(url, key);

    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes.user ?? null;
        setEmail(user?.email ?? null);

        if (!user) {
          setDocs([]);
          return;
        }

        const { data, error } = await supabase
          .from('documents')
          .select('id, original_pdf_name, status, created_at, signed_pdf_url, qr_code_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setErr(error.message);
        } else if (data) {
          setDocs(data as Doc[]);
        }
      } catch (e: any) {
        setErr(e?.message ?? 'Erro ao carregar documentos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white grid place-content-center font-bold">
              S
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Meus documentos</h1>
              <p className="text-sm text-slate-600">
                {email ? `Logado como ${email}` : 'Entre para ver seus documentos.'}
              </p>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:opacity-90"
          >
            Assinar um PDF
          </a>
        </div>

        {/* Estados */}
        {loading && (
          <div className="rounded-lg border bg-white p-4 text-sm text-slate-600">
            Carregando seus documentos…
          </div>
        )}

        {err && (
          <div className="rounded-lg border bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Lista */}
        {!loading && !err && (
          <div className="grid gap-4">
            {docs.length === 0 && (
              <div className="rounded-lg border bg-white p-4 text-sm text-slate-600">
                Você ainda não enviou documentos. Vá para{' '}
                <a className="text-indigo-600 underline" href="/">
                  Assinar um PDF
                </a>
                .
              </div>
            )}

            {docs.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border bg-white p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {d.original_pdf_name ?? d.id}
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: {d.status ?? '—'} •{' '}
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {d.signed_pdf_url && (
                    <a
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                      href={d.signed_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Baixar
                    </a>
                  )}
                  <a
                    className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700"
                    // Compatível com /validate/page.tsx que lê ?id=<docId>
                    href={`/validate?id=${d.id}`}
                  >
                    Validar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-10 text-xs text-slate-500">
          Dica DF: ideal para recibos e autorizações rápidas no dia a dia em
          Brasília. Os arquivos expiram em 7 dias.
        </footer>
      </div>
    </main>
  );
}
