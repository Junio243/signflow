// app/layout.tsx
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'SignFlow — Assine PDFs em minutos',
  description: 'Assinatura visual com QR e validação pública.',
};

export const revalidate = 0;           // sem cache
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-indigo-600">Sign</span>Flow
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:text-indigo-600" href="/dashboard">Dashboard</Link>
          <Link className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50" href="/login">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500">
        © {new Date().getFullYear()} SignFlow — Brasília/DF • Uso informativo (não substitui ICP-Brasil).
      </div>
    </footer>
  );
}
