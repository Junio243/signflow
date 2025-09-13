// app/validate/[id]/page.jsx
export const runtime = 'nodejs';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/types';

interface PageParams {
  params: {
    id: string;
  };
}

export default async function ValidatePage({ params }: PageParams) {
  // Busca o documento correspondente ao ID
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id,status,created_at,signed_pdf_url,qr_code_url,user_id')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Erro ao carregar</h1>
        <p className="text-sm text-red-600">{String(error.message || error)}</p>
      </main>
    );
  }

  type Document = Database['public']['Tables']['documents']['Row'];
  const doc = data as Document | null;

  if (!doc) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Documento não encontrado</h1>
        <p className="text-sm text-slate-600">
          Verifique o QR Code/URL. ID solicitado: <code>{params.id}</code>
        </p>
      </main>
    );
  }

  const signedUrl = doc.signed_pdf_url ?? '';
  const qrUrl = doc.qr_code_url ?? '';
  const createdAt = doc.created_at ? new Date(doc.created_at).toLocaleString('pt-BR') : '-';

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Validação do documento</h1>
        <ul className="text-sm text-slate-700 space-y-1">
          <li><strong>ID:</strong> {doc.id}</li>
          <li><strong>Status:</strong> {doc.status}</li>
          <li><strong>Assinado em:</strong> {createdAt}</li>
          {doc.user_id && <li><strong>Usuário:</strong> {doc.user_id}</li>}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Baixar PDF assinado
            </a>
          )}
          {qrUrl && (
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Abrir QR Code
            </a>
          )}
        </div>

        {signedUrl ? (
          <div className="border rounded">
            <iframe
              src={signedUrl}
              className="w-full h-[70vh]"
              title="PDF assinado"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Ainda não há PDF assinado disponível para este documento.
          </p>
        )}
      </section>
    </main>
  );
}
