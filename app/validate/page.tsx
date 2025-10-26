// app/validate/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

type FetchDocResult =
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: { id: string; status: string | null; created_at: string; signed_pdf_url: string | null; qr_code_url: string | null } };

async function fetchDoc(id: string, url: string, anon: string): Promise<FetchDocResult> {
  try {
    const supabase = createClient(url, anon);

    const { data, error } = await supabase
      .from('documents')
      .select('id, status, created_at, signed_pdf_url, qr_code_url')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { status: 'error', message: error.message };
    }
    if (!data) return { status: 'not-found' };
    return {
      status: 'success',
      data: data as {
        id: string; status: string | null; created_at: string; signed_pdf_url: string | null; qr_code_url: string | null;
      },
    };
  } catch (error) {
    console.error('[Supabase] Não foi possível consultar o documento.', error);
    return { status: 'error', message: 'Erro ao consultar documento.' };
  }
}

export default async function ValidatePage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams?.id;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const validationUnavailable = !supabaseUrl || !supabaseAnon;
  const result = id && supabaseUrl && supabaseAnon ? await fetchDoc(id, supabaseUrl, supabaseAnon) : null;
  const doc = result?.status === 'success' ? result.data : null;
  const lookupError = result?.status === 'error' ? result.message : null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Validação do documento</h1>
      {validationUnavailable && (
        <p className="text-sm text-red-600">
          Serviço de validação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      )}
      {!validationUnavailable && !id && <p className="text-sm text-red-600">Parâmetro ?id ausente.</p>}
      {!validationUnavailable && id && result?.status === 'not-found' && (
        <p className="text-sm text-red-600">Documento não encontrado.</p>
      )}
      {!validationUnavailable && lookupError && (
        <p className="text-sm text-red-600">{lookupError}</p>
      )}

      {!validationUnavailable && doc && (
        <div className="rounded-lg border p-4 space-y-3">
          <ul className="text-sm text-slate-700 space-y-1">
            <li><strong>ID:</strong> {doc.id}</li>
            <li><strong>Status:</strong> {doc.status ?? '—'}</li>
            <li><strong>Assinado em:</strong> {new Date(doc.created_at).toLocaleString()}</li>
          </ul>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-slate-500 mb-2">QR Code</div>
              {doc.qr_code_url ? (
                <img src={doc.qr_code_url} alt="QR" className="w-40 h-40 object-contain" />
              ) : (
                <div className="text-sm text-slate-500">Sem QR disponível.</div>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-slate-500 mb-2">PDF Assinado</div>
              {doc.signed_pdf_url ? (
                <a className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                   href={doc.signed_pdf_url} target="_blank">
                  Baixar PDF
                </a>
              ) : (
                <div className="text-sm text-slate-500">Ainda não gerado.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
