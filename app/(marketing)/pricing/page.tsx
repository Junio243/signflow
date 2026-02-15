'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Building2, Rocket, Crown, HelpCircle, ArrowRight, Sparkles } from 'lucide-react'

interface PlanFeature {
  name: string
  free: boolean | string
  starter: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

const FEATURES: PlanFeature[] = [
  { name: 'Assinaturas por mês', free: '3', starter: '50', pro: '500', enterprise: 'Ilimitadas' },
  { name: 'Documentos armazenados', free: '10', starter: '200', pro: '2.000', enterprise: 'Ilimitados' },
  { name: 'Armazenamento', free: '50 MB', starter: '5 GB', pro: '50 GB', enterprise: 'Ilimitado' },
  { name: 'Validação de documentos', free: true, starter: true, pro: true, enterprise: true },
  { name: 'QR Code de verificação', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Assinatura eletrônica simples', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Assinatura visual customizável', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Certificado digital ICP-Brasil', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Assinatura em lote', free: false, starter: '5/dia', pro: 'Ilimitado', enterprise: 'Ilimitado' },
  { name: 'Templates de documentos', free: false, starter: '3', pro: 'Ilimitados', enterprise: 'Ilimitados' },
  { name: 'Fluxos de aprovação', free: false, starter: false, pro: true, enterprise: true },
  { name: 'API de integração', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Webhooks', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Usuários na conta', free: '1', starter: '1', pro: '10', enterprise: 'Ilimitados' },
  { name: 'Equipes e permissões', free: false, starter: false, pro: true, enterprise: true },
  { name: 'SSO (Single Sign-On)', free: false, starter: false, pro: false, enterprise: true },
  { name: 'White-label/Marca própria', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Auditoria e logs', free: '7 dias', starter: '30 dias', pro: '1 ano', enterprise: 'Ilimitado' },
  { name: 'Suporte', free: 'Comunidade', starter: 'E-mail', pro: 'Prioritário', enterprise: 'Dedicado 24/7' },
]

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfeito para começar',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    color: 'slate',
    gradient: 'from-slate-500 to-slate-600',
    features: [
      '3 assinaturas por mês',
      '10 documentos armazenados',
      '50 MB de armazenamento',
      'Validação de documentos',
      'QR Code de verificação',
      'Suporte por comunidade',
    ],
    cta: 'Começar Grátis',
    ctaLink: '/signup',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Para profissionais autônomos',
    monthlyPrice: 29,
    annualPrice: 279, // ~20% desconto
    icon: Rocket,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    popular: true,
    features: [
      '50 assinaturas por mês',
      '200 documentos armazenados',
      '5 GB de armazenamento',
      'Assinatura visual customizável',
      'Certificado digital ICP-Brasil',
      'Assinatura em lote (5/dia)',
      '3 templates personalizados',
      'Logs de 30 dias',
      'Suporte por e-mail',
    ],
    cta: 'Iniciar Teste Grátis',
    ctaLink: '/signup?plan=starter',
  },
  {
    id: 'pro',
    name: 'Profissional',
    description: 'Para equipes e empresas',
    monthlyPrice: 99,
    annualPrice: 950, // ~20% desconto
    icon: Building2,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    features: [
      '500 assinaturas por mês',
      '2.000 documentos armazenados',
      '50 GB de armazenamento',
      'Tudo do Starter, mais:',
      'Assinatura em lote ilimitada',
      'Templates ilimitados',
      'Fluxos de aprovação',
      'API completa e Webhooks',
      'Até 10 usuários',
      'Equipes e permissões',
      'Logs de 1 ano',
      'Suporte prioritário',
    ],
    cta: 'Iniciar Teste Grátis',
    ctaLink: '/signup?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Soluções personalizadas',
    monthlyPrice: null,
    annualPrice: null,
    icon: Crown,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    features: [
      'Assinaturas ilimitadas',
      'Documentos ilimitados',
      'Armazenamento ilimitado',
      'Tudo do Profissional, mais:',
      'Usuários ilimitados',
      'SSO (Single Sign-On)',
      'White-label/Marca própria',
      'Integração personalizada',
      'Auditoria personalizada',
      'SLA garantido 99.9%',
      'Suporte dedicado 24/7',
      'Gerente de conta dedicado',
      'Treinamento e onboarding',
    ],
    cta: 'Falar com Vendas',
    ctaLink: '/contato',
  },
]

const FAQS = [
  {
    q: 'Como funciona o período de teste gratuito?',
    a: 'Todos os planos pagos incluem 14 dias de teste grátis, sem necessidade de cartão de crédito. Você pode testar todos os recursos do plano escolhido antes de decidir assinar.',
  },
  {
    q: 'Posso mudar de plano depois?',
    a: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, você pagará apenas a diferença proporcional. No downgrade, o crédito será aplicado na próxima fatura.',
  },
  {
    q: 'As assinaturas digitais têm validade jurídica?',
    a: 'Sim! O SignFlow segue a Medida Provisória 2.200-2/2001 e oferece assinaturas eletrônicas simples (em todos os planos) e assinaturas digitais com certificado ICP-Brasil (planos pagos), que têm total validade jurídica no Brasil.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartões de crédito (Visa, Mastercard, Elo, American Express), Pix e boleto bancário. Para planos anuais, também oferecemos pagamento via transferência bancária.',
  },
  {
    q: 'O que acontece se eu exceder o limite de assinaturas?',
    a: 'Você receberá um aviso antes de atingir o limite. Caso exceda, poderá fazer upgrade do plano ou adquirir pacotes adicionais de assinaturas.',
  },
  {
    q: 'Posso cancelar minha assinatura a qualquer momento?',
    a: 'Sim, você pode cancelar a qualquer momento, sem burocracia. Seus documentos permanecerão disponíveis para download por 90 dias após o cancelamento.',
  },
  {
    q: 'Como funciona o suporte técnico?',
    a: 'O plano gratuito tem acesso à comunidade. Planos pagos têm suporte por e-mail, com tempo de resposta entre 24-48h. O plano Enterprise inclui suporte dedicado 24/7 via telefone, e-mail e chat.',
  },
  {
    q: 'Os dados estão seguros?',
    a: 'Sim! Todos os documentos são criptografados em repouso e em trânsito. Usamos servidores com certificação ISO 27001 e nossos backups são realizados diariamente. Além disso, somos compatíveis com a LGPD.',
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg mb-6">
            <Sparkles className="h-4 w-4" />
            Preços Transparentes
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Planos para todos os tamanhos
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
            Comece grátis e escale conforme seu negócio cresce. Sem surpresas, sem taxas ocultas.
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span
              className={`text-base font-semibold transition-colors ${
                billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Mensal
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={billingCycle === 'annually'}
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')
              }
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === 'annually' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  billingCycle === 'annually' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-base font-semibold transition-colors ${
                billingCycle === 'annually' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Anual
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Economize 20%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const price =
              plan.monthlyPrice === null
                ? null
                : billingCycle === 'monthly'
                ? plan.monthlyPrice
                : Math.round(plan.annualPrice! / 12)

            const totalAnnualPrice = plan.annualPrice
            const savings = plan.monthlyPrice ? plan.monthlyPrice * 12 - (plan.annualPrice || 0) : 0

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-2 border-blue-500 ring-4 ring-blue-100'
                    : 'border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                      <Sparkles className="h-4 w-4" />
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`rounded-2xl bg-gradient-to-br ${plan.gradient} p-3 text-white shadow-lg`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-600 min-h-[48px]">
                  {plan.description}
                </p>

                <div className="mt-6 mb-8">
                  {price === null ? (
                    <div>
                      <p className="text-4xl font-bold text-slate-900">
                        Personalizado
                      </p>
                      <p className="text-sm text-slate-600 mt-1">Preço sob consulta</p>
                    </div>
                  ) : price === 0 ? (
                    <div>
                      <p className="text-4xl font-bold text-slate-900">R$ 0</p>
                      <p className="text-sm text-slate-600 mt-1">Grátis para sempre</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-slate-900">
                          R$ {price}
                        </span>
                        <span className="text-slate-600 font-medium">
                          /mês
                        </span>
                      </div>
                      {billingCycle === 'annually' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-slate-600">
                            R$ {totalAnnualPrice} cobrado anualmente
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            💰 Economize R$ {savings}/ano
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={plan.ctaLink}
                  className={`block w-full rounded-xl px-6 py-4 text-center text-base font-semibold shadow-lg transition-all focus:outline-none focus:ring-4 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-300'
                      : 'border-2 border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-300'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                        <Check
                          className="h-4 w-4 text-emerald-600"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <span>✨ Teste grátis por 14 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <span>🔒 Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <span>⚡ Cancele quando quiser</span>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900">
              Compare todos os recursos
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Veja em detalhes o que está incluído em cada plano
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                    <th className="px-6 py-5 text-left text-sm font-bold text-slate-900 w-1/3">
                      Recursos
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-slate-900">
                      Gratuito
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-slate-900 bg-blue-50">
                      Starter
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-slate-900">
                      Profissional
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-slate-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {FEATURES.map((feature, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {feature.name}
                      </td>
                      {(['free', 'starter', 'pro', 'enterprise'] as const).map((planId) => {
                        const value = feature[planId]
                        const isStarter = planId === 'starter'
                        return (
                          <td key={planId} className={`px-6 py-4 text-center text-sm ${isStarter ? 'bg-blue-50/50' : ''}`}>
                            {typeof value === 'boolean' ? (
                              value ? (
                                <div className="flex justify-center">
                                  <div className="rounded-full bg-emerald-100 p-1">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <X className="h-5 w-5 text-slate-300" />
                                </div>
                              )
                            ) : (
                              <span className="font-medium text-slate-700">{value}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900">
              Perguntas Frequentes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Tire suas dúvidas sobre nossos planos e preços
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={openFaq === idx}
                >
                  <span className="flex items-center gap-3 text-lg font-semibold text-slate-900 pr-4">
                    <div className="rounded-full bg-blue-100 p-1.5">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    {faq.q}
                  </span>
                  <div
                    className={`flex-shrink-0 text-2xl font-bold text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-200 px-6 py-5 text-slate-700 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-32 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white">
              Pronto para transformar seu fluxo de assinaturas?
            </h2>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Comece gratuitamente hoje e descubra por que milhares de empresas confiam no SignFlow
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all hover:bg-blue-50 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                Começar Grátis Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                Falar com Vendas
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-100">
              ✨ Não precisa de cartão de crédito • 🚀 Comece em 2 minutos • 🔒 Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
