import Link from 'next/link'
import { ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pt-28">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        {/* Conteúdo principal */}
        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/60 px-3 py-1 text-xs font-medium text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Assinatura digital com validade jurídica
          </div>

          {/* Título */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Assine documentos{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
              com segurança e velocidade
            </span>
          </h1>

          {/* Descrição */}
          <p className="text-balance text-lg leading-relaxed text-slate-300 sm:text-xl">
            Plataforma completa de assinatura digital com certificado, QR Code de validação pública, suporte a múltiplos signatários e dashboard em tempo real. Sem burocracias, 100% digital.
          </p>

          {/* Botões CTA */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/create-document"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105"
            >
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Ver demonstração
            </Link>
          </div>

          {/* Benefícios rápidos */}
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-50">Hash criptográfico</p>
                <p className="text-xs text-slate-400">SHA-256 para integridade</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-50">Validação pública</p>
                <p className="text-xs text-slate-400">QR Code para qualquer um</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-50">Múltiplos signatários</p>
                <p className="text-xs text-slate-400">Fluxo colaborativo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-sky-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-50">Certificado digital</p>
                <p className="text-xs text-slate-400">Personalizado com dados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card lateral / Preview */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 blur-3xl" />
          
          <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur p-6 shadow-2xl shadow-cyan-500/20">
            {/* Header do card */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-medium text-slate-400">Sessão protegida</span>
              </div>
              <span className="text-xs text-slate-500">signflow.app</span>
            </div>

            {/* Conteúdo do card */}
            <div className="space-y-4 rounded-2xl bg-slate-950/80 p-4">
              {/* Status documento */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Documento atual</p>
                  <p className="text-sm font-semibold text-slate-50 mt-1">Contrato_Serviços.pdf</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  Pronto
                </span>
              </div>

              <div className="border-t border-slate-800" />

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[11px] text-slate-400">Status</p>
                  <p className="mt-1.5 text-sm font-semibold text-emerald-300">Em andamento</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">2 de 3 assinaram</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-[11px] text-slate-400">Validação</p>
                  <p className="mt-1.5 text-[10px] font-mono text-cyan-300">a3f5e9c8...21bf</p>
                </div>
              </div>

              {/* Ação sugerida */}
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-cyan-500/5 p-3">
                <p className="text-[10px] uppercase tracking-widest text-cyan-300 font-semibold">Próxima ação</p>
                <p className="mt-2 text-xs text-slate-200">Enviar link para o próximo signatário</p>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-cyan-700 transition">
                    Copiar link
                  </button>
                  <button className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-slate-500 transition">
                    Detalhes
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé do card */}
            <p className="mt-4 text-[11px] text-slate-500">
              Cada documento recebe um hash único, certificado digital e página de validação pública.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
