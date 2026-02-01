'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="border-t border-white/5 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Card principal de CTA */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-950/80 to-cyan-950/60 p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Conteúdo */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
                Comece a assinar documentos digitalmente agora
              </h2>
              <p className="mt-4 text-lg text-slate-200">
                Sem taxa de ativação. Sem contrato de longo prazo. Comece gratuitamente e escale conforme crescer.
              </p>

              {/* Benefícios principais */}
              <div className="mt-6 space-y-3">
                {[
                  'Acesso imediato sem verificação',
                  'Crie até 10 documentos grátis por mês',
                  'Dashboard completo incluso',
                  'Suporte por email 24/7'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Botões */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition hover:scale-105"
                >
                  Criar conta gratuita
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3 text-base font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-900 transition"
                >
                  Entrar na minha conta
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Sem cartão de crédito necessário. Será solicitado apenas quando quiser usar recursos premium.
              </p>
            </div>

            {/* Showcases de confiança */}
            <div className="flex flex-col gap-6">
              {/* Showcase de estatísticas */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Confiado por</h3>
                <p className="mt-3 text-3xl font-bold text-slate-50">10.000+</p>
                <p className="text-sm text-slate-400">Documentos assinados este mês</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                  <p className="text-2xl font-bold text-cyan-300">99.9%</p>
                  <p className="text-sm text-slate-400">Uptime</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                  <p className="text-2xl font-bold text-emerald-300">&lt; 2s</p>
                  <p className="text-sm text-slate-400">Assinatura</p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6">
                <p className="text-sm font-medium text-slate-200">
                  “Trocar para SignFlow reduziu nosso tempo de processamento de contratos em 80%. Ferramenta essencial.”
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600"></div>
                  <div className="text-xs">
                    <p className="font-medium text-slate-50">Maria Silva</p>
                    <p className="text-slate-400">Gerente Jurídico</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ simplificado */}
        <div className="mt-12">
          <h3 className="text-center text-xl font-semibold text-slate-50 mb-8">
            Dúvidas comuns
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                q: 'Meus documentos ficam seguros?',
                a: 'Sim. Todos os PDFs são criptografados em trânsito e em repouso. Conformidade com LGPD e GDPR.'
              },
              {
                q: 'Posso usar em outro país?',
                a: 'Sim! SignFlow é global. Suportamos múltiplas moedas e idiomas. Validade jurídica em México, Brasil e EUA.'
              },
              {
                q: 'Como faço para integrar com meu sistema?',
                a: 'Fornecemos uma API REST completa com documentação. Autossegundo tempo de integração.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <h4 className="font-semibold text-slate-50 mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
