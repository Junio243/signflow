import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'SignFlow', description: 'Assine PDFs com assinatura visual e QR de validação.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <Link href="/" className="font-semibold">SignFlow</Link>
            <nav className="ml-auto text-sm flex gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/validate/demo">Validar</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
        <footer className="max-w-6xl mx-auto p-4 text-xs text-slate-500">
          <hr className="my-4" />
          <p>Assinatura eletrônica <em>simples</em>. Para atos com GDF/SEI-DF pode ser exigida ICP‑Brasil.</p>
        </footer>
      </body>
    </html>
  );
}
