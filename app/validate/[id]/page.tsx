import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import type { Database } from '@/lib/types';

type Document = Database['public']['Tables']['documents']['Row'];

export default async function Validate({ params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) {
    return <p className="card">Documento não encontrado.</p>;
  }

  const doc = data as Document;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Validação do documento</h1>
        <ul className="text-sm text-slate-600 space-y-1">
          <li><strong>ID:</strong> {doc.id}</li>
          <li><strong>Status:</strong> {doc.status}</li>
          <li><strong>Assinado em:</strong> {new Date(doc.created_at).toLocaleString()}</li>
        </ul>
        {doc.signed_pdf_url && (
          <a className="btn mt-3 inline-block" href={doc.signed_pdf_url} target="_blank">
            Baixar PDF assinado
          </a>
        )}
      </div>
      <div className="card">
        <iframe className="w-full h-[70vh] rounded-xl border" src={doc.signed_pdf_url || ''}></iframe>
        <div className="text-xs text-slate-500 mt-2">
          Se o PDF não abrir, use o botão de download acima.
        </div>
        <div className="mt-3">
          <Link className="btn" href={`/validate/${params.id}`}>
            Link público de validação
          </Link>
        </div>
      </div>
    </div>
  );
}
