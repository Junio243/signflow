import './globals.css'
import Link from 'next/link'
import HeaderClient from '@/components/HeaderClient'
import { Providers } from './providers'
import type { Metadata, Viewport } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signflow-beta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SignFlow - Assinatura Digital de PDFs',
    template: '%s | SignFlow',
  },
  description:
    'Assine PDFs digitalmente com QR Code e validacao publica auditavel. Simples, rapido e seguro para operacoes profissionais.',
  keywords: [
    'assinatura digital',
    'assinar PDF',
    'assinatura eletronica',
    'QR Code',
    'validacao de documento',
    'SignFlow',
    'assinar documento online',
    'PDF online',
    'certificado digital',
  ],
  authors: [{ name: 'SignFlow', url: SITE_URL }],
  creator: 'SignFlow',
  publisher: 'SignFlow',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'SignFlow',
    title: 'SignFlow - Assinatura Digital de PDFs',
    description: 'Assine PDFs com QR Code e validacao publica auditavel. Gratis, rapido e seguro.',
    locale: 'pt_BR',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'SignFlow - Assinatura Digital de PDFs',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SignFlow - Assinatura Digital de PDFs',
    description: 'Assine PDFs com QR Code e validacao publica auditavel. Gratis e seguro.',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@signflow',
  },
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SignFlow',
  },
  other: { 'mobile-web-app-capable': 'yes' },
  formatDetection: { telephone: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} />
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
                } catch (e) {}
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
            Ir para o conteudo
          </a>
          <HeaderClient />
          <main id="conteudo-principal">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200 safe-area-bottom">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                SF
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">SignFlow</p>
                <p className="mt-1 text-sm text-slate-400">Assinatura digital institucional</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Plataforma brasileira para assinatura digital, validacao publica e apresentacao profissional de documentos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">ICP-Brasil</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">LGPD</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Trilha de auditoria</span>
            </div>
          </div>

          <FooterColumn
            title="Produto"
            links={[
              { href: '/pricing', label: 'Precos' },
              { href: '/sign', label: 'Assinar documento' },
              { href: '/verify', label: 'Verificar assinatura' },
              { href: '/validate', label: 'Validar documento' },
            ]}
          />

          <FooterColumn
            title="Institucional"
            links={[
              { href: '/about', label: 'Sobre o SignFlow' },
              { href: '/security', label: 'Seguranca e compliance' },
              { href: '/contato', label: 'Contato comercial' },
              { href: '/status', label: 'Status da plataforma' },
            ]}
          />

          <FooterColumn
            title="Legal e apoio"
            links={[
              { href: '/privacy', label: 'Privacidade' },
              { href: '/terms', label: 'Termos de uso' },
              { href: '/docs/immutability', label: 'Imutabilidade' },
              { href: '/faq', label: 'Perguntas frequentes' },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SignFlow. Todos os direitos reservados.</p>
          <p>Brasilia/DF • Seguranca, validacao e confianca institucional em uma mesma camada visual.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string }>
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="transition hover:text-sky-300" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
