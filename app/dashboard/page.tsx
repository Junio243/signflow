// app/dashboard/page.tsx
'use client';
export const revalidate = 0;

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

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);

      if (!user) return;
      const { data, error } = await supabase
        .from('documents')
        .select('id, original_pdf_name, status, created_at, signed_pdf_url, qr_code_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setDocs(data as Doc[]);
    })();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Meus documentos</h1>
        <p className="text-sm text-slate-600">
          {email ? `Logado como ${email}` : 'Entre para ver seus documentos.'}
        </p>
      </div>

      <div className="grid gap-4">
        {docs.length === 0 && (
          <div className="rounded-lg border p-4 text-sm text-slate-600">
            Você ainda não enviou documentos. Vá para{' '}
            <a className="text-indigo-600 underline" href="/editor/new">
              Assinar um PDF
            </a>.
          </div>
        )}

        {docs.map((d) => (
          <div key={d.id} className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.original_pdf_name ?? d.id}</div>
              <div className="text-xs text-slate-500">
                Status: {d.status ?? '—'} • {new Date(d.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              {d.signed_pdf_url && (
                <a className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50" href={d.signed_pdf_url} target="_blank">
                  Baixar
                </a>
              )}
              <a className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700" href={`/validate?id=${d.id}`}>
                Validar
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
