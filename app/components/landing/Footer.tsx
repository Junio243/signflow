import Link from 'next/link'
import { Github, Linkedin, Twitter } from 'lucide-react'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Recursos', href: '#recursos' },
      { label: 'Como funciona', href: '#como-funciona' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Documentação', href: '/docs' }
    ]
  },
  {
    title: 'Companhia',
    links: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Blog', href: '/blog' },
      { label: 'Carreiras', href: '/carreiras' },
      { label: 'Contato', href: '/contato' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos de Uso', href: '/terms' },
      { label: 'Política de Privacidade', href: '/privacy' },
      { label: 'Segurança', href: '/security' },
      { label: 'Status', href: '/status' }
    ]
  },
  {
    title: 'Desenvolvimento',
    links: [
      { label: 'GitHub', href: 'https://github.com/Junio243/signflow' },
      { label: 'API Docs', href: '/api' },
      { label: 'Webhooks', href: '/webhooks' },
      { label: 'Status', href: 'https://status.signflow.app' }
    ]
  }
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Grid principal */}
        <div className="grid gap-8 mb-8 md:grid-cols-5">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600">
                <span className="text-sm font-bold text-white">SF</span>
              </div>
              <span className="text-sm font-semibold text-slate-50">SignFlow</span>
            </Link>
            <p className="mt-3 text-xs text-slate-400 max-w-xs">
              Plataforma de assinatura digital com validade jurídica, certificado digital e QR Code de validação pública.
            </p>
            {/* Social links */}
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/Junio243/signflow"
                className="inline-flex p-2 rounded-lg bg-slate-900/70 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
                title="GitHub"
              >
                <Github size={16} />
              </a>
              <a
                href="#"
                className="inline-flex p-2 rounded-lg bg-slate-900/70 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
                title="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                className="inline-flex p-2 rounded-lg bg-slate-900/70 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Links sections */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-cyan-300 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 py-8">
          {/* Payment methods / Trust badges */}
          <div className="mb-8">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
              Certificações e segurança
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                LGPD Compliant
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                GDPR Compliant
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                ISO 27001
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Supabase Cloud
              </div>
            </div>
          </div>

          {/* Copyright e info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {currentYear} SignFlow. Todos os direitos reservados. Desenvolvido com ❤️ em São Paulo, Brasil.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-cyan-300 transition">
                Privacidade
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-cyan-300 transition">
                Termos
              </Link>
              <span>•</span>
              <Link href="/security" className="hover:text-cyan-300 transition">
                Segurança
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
