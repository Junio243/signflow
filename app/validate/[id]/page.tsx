// app/validate/[id]/page.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';

// Tipagem mínima para evitar "never"
type DocRow = {
  id: string;
  status: string | null;
  created_at: string;
  signed_pdf_url: string | null;
  qr_code_url: string | null;
};

export default async function ValidatePage({ params }: { params: { id: string } }) {
  const id = params.id;

  // cria o client do Supabase NO SERVIDOR
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('documents')
    .select('id, status, created_at, signed_pdf_url, qr_code_url')
    .eq('id', id)
    .maybeSingle<DocRow>();

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Validação do documento</h1>
        <p className="text-red-600">Erro ao buscar documento: {error.message}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Validação do documento</h1>
        <p className="text-slate-700">Documento não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">Validação do documento</h1>
        <ul className="text-sm text-slate-700 space-y-1">
          <li><strong>ID:</strong> {data.id}</li>
          <li><strong>Status:</strong> {data.status ?? '—'}</li>
          <li>
            <strong>Assinado em:</strong>{' '}
            {data.created_at ? new Date(data.created_at).toLocaleString() : '—'}
          </li>
        </ul>
      </div>

      {data.signed_pdf_url ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <a
              href={data.signed_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded bg-black text-white text-sm"
            >
              Baixar PDF assinado
            </a>
            {data.qr_code_url && (
              <a
                href={data.qr_code_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded border text-sm"
              >
                Baixar QR Code
              </a>
            )}
            <Link href="/" className="px-3 py-2 rounded border text-sm">
              Assinar outro PDF
            </Link>
          </div>

          <div className="border rounded">
            <iframe
              src={data.signed_pdf_url}
              className="w-full h-[80vh]"
              title="PDF assinado"
            />
          </div>
        </div>
      ) : (
        <p className="text-slate-600">
          Este documento ainda não possui PDF assinado gerado.
        </p>
      )}
    </main>
  );
}
