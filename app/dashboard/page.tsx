'use client';
import useSWR from 'swr';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const fetcher = async () => {
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (error) throw error; return data as any[];
};

export default function Dashboard(){
  const { data, error } = useSWR('docs', fetcher);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Seus documentos</h1>
        <Link href="/editor/new" className="btn">Novo documento</Link>
      </div>
      {error && <p className="text-red-600 text-sm">{String(error)}</p>}
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map(d => (
          <div key={d.id} className="card">
            <div className="font-medium">{d.original_pdf_name}</div>
            <div className="text-xs text-slate-500">{new Date(d.created_at).toLocaleString()}</div>
            <div className="mt-2 flex gap-2 text-sm">
              <Link className="btn" href={`/editor/${d.id}`}>Editar</Link>
              {d.signed_pdf_url && <a className="btn" href={d.signed_pdf_url} target="_blank">Baixar assinado</a>}
              <Link className="btn" href={`/validate/${d.id}`}>Validar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
