export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-sky-600" />
            <span className="font-semibold text-slate-800">SignFlow</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link className="text-slate-600 hover:text-slate-900" href="/dashboard">Dashboard</Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-600 px-4 py-2 text-sky-700 hover:bg-sky-50"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Assine PDFs de forma visual, simples e gratuita
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Envie seu PDF, posicione a assinatura escaneada, gere QR Code de validação e baixe o documento final.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-sky-600 px-6 py-3 text-white font-medium hover:bg-sky-700"
            >
              Assinar PDF agora
            </Link>
            <Link
              href="/validate/demo"
              className="rounded-xl border px-6 py-3 text-slate-700 hover:bg-white"
            >
              Ver exemplo de validação
            </Link>
          </div>
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>• Login por e-mail (link mágico)</li>
            <li>• QR Code para validar a origem</li>
            <li>• Armazenamento por 7 dias (LGPD friendly)</li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="aspect-[4/3] w-full rounded-xl border grid place-items-center text-slate-500">
            Prévia do editor aqui (após login)
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Depois de entrar, você fará upload do PDF e posicionará a assinatura visualmente.
          </p>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 flex justify-between">
          <span>© {new Date().getFullYear()} SignFlow</span>
          <div className="flex gap-4">
            <Link href="/terms">Termos</Link>
            <Link href="/privacy">Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
