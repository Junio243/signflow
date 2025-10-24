// app/validate/[id]/page.tsx
export const revalidate = 0
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'

async function fetchDoc(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anon)

  const { data, error } = await supabase
    .from('documents')
    .select('id, status, created_at, signed_pdf_url, qr_code_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as {
    id: string
    status: string | null
    created_at: string
    signed_pdf_url: string | null
    qr_code_url: string | null
  }
}

export default async function ValidateById({ params }: { params: { id: string } }) {
  const data = await fetchDoc(params.id)

  if (!data) {
    return <p className="text-sm text-red-600">Documento não encontrado.</p>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Validação do documento</h1>
      <ul className="text-sm text-slate-700 space-y-1">
        <li><strong>ID:</strong> {data.id}</li>
        <li><strong>Status:</strong> {data.status ?? '—'}</li>
        <li><strong>Assinado em:</strong> {new Date(data.created_at).toLocaleString()}</li>
      </ul>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-slate-500 mb-2">QR Code</div>
          {data.qr_code_url ? (
            <img src={data.qr_code_url} alt="QR" className="w-40 h-40 object-contain" />
          ) : (
            <div className="text-sm text-slate-500">Sem QR disponível.</div>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-slate-500 mb-2">PDF Assinado</div>
          {data.signed_pdf_url ? (
            <a className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
               href={data.signed_pdf_url} target="_blank">
              Baixar PDF
            </a>
          ) : (
            <div className="text-sm text-slate-500">Ainda não gerado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
