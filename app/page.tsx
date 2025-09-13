// app/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Link from 'next/link';

export default function Home() {
  return (
    <section className="grid gap-10 md:grid-cols-2 items-center">
      <div className="space-y-6">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          Assine PDFs <span className="text-indigo-600">de forma visual</span> e valide por QR Code
        </h1>
        <p className="text-slate-600">
          Faça upload do PDF, posicione sua assinatura escaneada e gere um QR de validação pública.
          Ideal para autorizações, recibos e contratos informais no DF.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Começar agora
          </Link>
          <Link href="/dashboard" className="inline-flex items-center rounded-lg border px-4 py-2 hover:bg-slate-50">
            Ver meus documentos
          </Link>
        </div>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Login por e-mail (link mágico)</li>
          <li>• QR Code com página pública de validação</li>
          <li>• Armazenamento temporário (7 dias)</li>
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="aspect-[4/3] rounded-lg border grid place-content-center text-slate-400">
          Prévia do editor / PDF
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Após entrar, você poderá enviar um PDF e assinar.
        </p>
      </div>
    </section>
  );
}
