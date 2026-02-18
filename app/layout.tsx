// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import HeaderClient from '@/components/HeaderClient';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signflow-beta.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'SignFlow — Assinatura Digital de PDFs',
    template: '%s | SignFlow',
  },
  description:
    'Assine PDFs digitalmente com QR Code e validação pública auditável. Simples, rápido e 100% seguro. Crie sua assinatura eletrônica gratuitamente.',

  keywords: [
    'assinatura digital', 'assinar PDF', 'assinatura eletrônica', 'QR Code', 'validação de documento',
    'SignFlow', 'assinar documento online', 'PDF online', 'certificado digital',
  ],

  authors: [{ name: 'SignFlow', url: SITE_URL }],
  creator: 'SignFlow',
  publisher: 'SignFlow',

  // Canonical
  alternates: { canonical: '/' },

  // Open Graph
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'SignFlow',
    title: 'SignFlow — Assinatura Digital de PDFs',
    description:
      'Assine PDFs digitalmente com QR Code e validação pública auditável. Grátis, rápido e seguro.',
    locale: 'pt_BR',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'SignFlow — Assinatura Digital de PDFs',
        type: 'image/png',
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'SignFlow — Assinatura Digital de PDFs',
    description:
      'Assine PDFs com QR Code e validação pública auditável. Grátis e seguro.',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@signflow',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SignFlow',
  },
  other: { 'mobile-web-app-capable': 'yes' },
  formatDetection: { telephone: false },

  // Verificação (adicione os valores reais quando tiver as contas)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Pré-conecta ao Supabase para reduzir latência */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} />
        {/* Script inline para aplicar tema antes de renderizar (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Providers>
          <a
            href="#conteudo-principal"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Ir para o conteúdo
          </a>
          <HeaderClient />
          <main id="conteudo-principal">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-8 sm:mt-12 border-t border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 safe-area-bottom">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:gap-6 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-slate-900 dark:text-white">SignFlow</p>
            <p className="mt-1 max-w-sm text-xs sm:text-sm">
              Assinaturas eletrônicas com QR Code e validação pública auditável.
            </p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm sm:gap-x-6 sm:gap-y-3 sm:justify-end">
            <Link className="transition hover:text-blue-600 dark:hover:text-blue-400" href="/security">Segurança</Link>
            <Link className="transition hover:text-blue-600 dark:hover:text-blue-400" href="/docs">Documentação</Link>
            <Link className="transition hover:text-blue-600 dark:hover:text-blue-400" href="/pricing">Preços</Link>
            <Link className="transition hover:text-blue-600 dark:hover:text-blue-400" href="/contato">Contato</Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600 sm:mt-6">
          © {new Date().getFullYear()} SignFlow — Brasília/DF
        </p>
      </div>
    </footer>
  );
}
