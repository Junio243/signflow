// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import HeaderClient from '@/components/HeaderClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 antialiased" style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Ir para o conteúdo
        </a>
        <HeaderClient />
        <main id="conteudo-principal" className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <p className="text-base font-semibold text-slate-900">SignFlow</p>
          <p className="max-w-sm text-sm text-slate-500">
            Assinaturas eletrônicas com QR Code e validação pública auditável.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link className="transition hover:text-brand-600" href="/security">Segurança</Link>
          <Link className="transition hover:text-brand-600" href="/docs/immutability">Imutabilidade</Link>
          <Link className="transition hover:text-brand-600" href="/status">Status</Link>
          <Link className="transition hover:text-brand-600" href="/contato">Contato</Link>
        </nav>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} SignFlow — Brasília/DF</p>
      </div>
    </footer>
  );
}
