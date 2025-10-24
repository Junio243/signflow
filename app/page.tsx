export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  PenLine,
  QrCode,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />

        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 font-semibold text-white">
                SF
              </div>
              <span className="text-lg font-semibold text-white">SignFlow</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm text-slate-200 md:flex">
              <Link className="transition hover:text-white" href="#recursos">
                Recursos
              </Link>
              <Link className="transition hover:text-white" href="#como-funciona">
                Como funciona
              </Link>
              <Link className="transition hover:text-white" href="/dashboard">
                Dashboard
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </header>

        <section className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
              <Sparkles className="h-4 w-4" /> Nova experiência de assinatura
            </span>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight text-white md:text-5xl">
              Assine e valide PDFs com a mesma facilidade de arrastar e soltar.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Envie seu documento, posicione a assinatura com precisão, gere um QR Code de verificação e compartilhe o PDF final
              com confiança. Tudo em minutos, sem downloads ou dores de cabeça.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-medium text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/validate/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-medium text-slate-200 transition hover:border-white/30"
              >
                Ver validação ao vivo
              </Link>
            </div>
            <dl className="mt-12 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-400">Assinaturas emitidas</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">+3.500</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-400">Tempo médio de criação</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">4 minutos</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-400">Documentos validados</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">99,9%</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-sky-400/40 via-transparent to-purple-500/40 blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span className="font-medium">contrato-assinado.pdf</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> Assinado
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-200">
                  <p className="text-sm font-medium">Posicione a assinatura com precisão milimétrica.</p>
                  <p className="mt-2 text-xs text-slate-400">Arraste a imagem, ajuste o tamanho e confirme em segundos.</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-200">
                  <p className="text-sm font-medium">QR Code para validação pública.</p>
                  <p className="mt-2 text-xs text-slate-400">Qualquer pessoa pode verificar a autenticidade com uma leitura rápida.</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-slate-200">
                  <p className="text-sm font-medium">Histórico de envios organizado.</p>
                  <p className="mt-2 text-xs text-slate-400">Veja os últimos documentos e acompanhe o status no dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="recursos" className="bg-white py-20 text-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Tudo o que você precisa para assinar documentos digitais</h2>
            <p className="mt-4 text-lg text-slate-600">
              O SignFlow combina um editor visual intuitivo com validação criptografada para você se concentrar no que importa: fechar
              acordos.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Upload drag-and-drop</h3>
              <p className="mt-3 text-slate-600">
                Envie PDFs diretamente do computador ou arraste para a tela. Detectamos o tamanho automaticamente para você trabalhar.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <PenLine className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Editor visual intuitivo</h3>
              <p className="mt-3 text-slate-600">
                Ajuste posição, rotação e escala da assinatura em tempo real. Visualize como o documento final ficará antes de salvar.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">QR Code e link de validação</h3>
              <p className="mt-3 text-slate-600">
                Cada documento assinado recebe um QR Code público para verificação. Transparência total para quem receber o PDF.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Segurança por 7 dias</h3>
              <p className="mt-3 text-slate-600">
                Armazenamos os arquivos com criptografia e excluímos automaticamente após 7 dias para atender às melhores práticas de LGPD.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Um fluxo simples em três etapas</h2>
            <p className="mt-4 text-lg text-slate-600">Todo o processo cabe em poucos cliques. Do upload à validação final.</p>
          </div>

          <ol className="mt-12 space-y-6">
            <li className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-600">
                1
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Envie o PDF e a imagem da assinatura</h3>
                <p className="mt-2 text-slate-600">Você pode fazer upload individual ou arrastar tudo de uma vez. Também dá para usar um QR Code já gerado.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-600">
                2
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Posicione, ajuste e confirme</h3>
                <p className="mt-2 text-slate-600">O editor mostra cada página e você arrasta a assinatura até ficar perfeita. Confirme e nós geramos o documento final.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-600">
                3
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Compartilhe com QR Code e link de verificação</h3>
                <p className="mt-2 text-slate-600">Pronto! Você baixa o PDF assinado e recebe um link público para validar a autenticidade em qualquer lugar.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 text-center text-white">
          <h2 className="text-3xl font-semibold md:text-4xl">Pronto para enviar seu próximo documento?</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Crie sua conta gratuita, organize suas assinaturas e acompanhe tudo em um painel moderno feito para equipes ágeis.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-sky-700 shadow-lg shadow-black/10 transition hover:bg-slate-100"
            >
              Acessar minha conta
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/validate/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-6 py-3 font-medium text-white transition hover:border-white"
            >
              Explorar demo de validação
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SignFlow. Plataforma brasileira de assinatura digital.</p>
          <div className="flex items-center gap-6">
            <Link className="transition hover:text-white" href="/terms">
              Termos
            </Link>
            <Link className="transition hover:text-white" href="/privacy">
              Privacidade
            </Link>
            <Link className="transition hover:text-white" href="/dashboard">
              Entrar no dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
