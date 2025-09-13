// app/validate/[id]/page.tsx
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/types';

type DocRow = Database['public']['Tables']['documents']['Row'];

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Validar documento — SignFlow',
};

export default async function ValidatePage({ params }: { params: { id: string } }) {
  // Busca o documento no Supabase
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Erro ao carregar</h1>
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }

  const doc = (data as DocRow | null);

  if (!doc) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Documento não encontrado</h1>
        <p className="text-sm text-slate-600">
          Verifique se o QR Code/URL está correto: <code>{params.id}</code>
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
