// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import HeaderClient from '@/components/HeaderClient';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'SignFlow - Assinatura Digital de PDFs',
    template: '%s | SignFlow'
  },
  description: 'Assinatura eletrônica de PDFs com QR Code e validação pública auditável. Simples, rápido e seguro.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SignFlow'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'SignFlow',
    title: 'SignFlow - Assinatura Digital de PDFs',
    description: 'Assinatura eletrônica de PDFs com QR Code e validação pública auditável'
  },
  twitter: {
    card: 'summary',
    title: 'SignFlow - Assinatura Digital de PDFs',
    description: 'Assinatura eletrônica de PDFs com QR Code e validação pública auditável'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0066ff'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Ir para o conteúdo
        </a>
        <HeaderClient />
        <main id="conteudo-principal" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 border-t bg-white/60 safe-area-bottom">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 text-sm text-slate-600 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-slate-900">SignFlow</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Assinaturas eletrônicas com QR Code e validação pública auditável.
            </p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm sm:justify-end">
            <Link className="transition hover:text-brand-600" href="/security">Segurança</Link>
            <Link className="transition hover:text-brand-600" href="/docs/immutability">Imutabilidade</Link>
            <Link className="transition hover:text-brand-600" href="/status">Status</Link>
            <Link className="transition hover:text-brand-600" href="/contato">Contato</Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400 sm:mt-8">
          © {new Date().getFullYear()} SignFlow — Brasília/DF
        </p>
      </div>
    </footer>
  );
}
