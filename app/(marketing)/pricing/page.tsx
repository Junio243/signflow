'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Building2, Rocket, Crown, HelpCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface PlanFeature {
  name: string
  free: boolean | string
  pro: boolean | string
  business: boolean | string
  enterprise: boolean | string
}

const FEATURES: PlanFeature[] = [
  { name: 'Assinaturas por mês', free: '5', pro: '100', business: 'Ilimitadas', enterprise: 'Ilimitadas' },
  { name: 'Armazenamento', free: '100 MB', pro: '10 GB', business: '100 GB', enterprise: 'Ilimitado' },
  { name: 'Validação de documentos', free: true, pro: true, business: true, enterprise: true },
  { name: 'QR Code de verificação', free: true, pro: true, business: true, enterprise: true },
  { name: 'Assinatura visual customizável', free: false, pro: true, business: true, enterprise: true },
  { name: 'Certificado digital ICP-Brasil', free: false, pro: true, business: true, enterprise: true },
  { name: 'Assinatura em lote', free: false, pro: '10/dia', business: 'Ilimitado', enterprise: 'Ilimitado' },
  { name: 'API de integração', free: false, pro: false, business: true, enterprise: true },
  { name: 'Webhooks', free: false, pro: false, business: true, enterprise: true },
  { name: 'Equipes e permissões', free: false, pro: '5 usuários', business: '50 usuários', enterprise: 'Ilimitados' },
  { name: 'SSO (Single Sign-On)', free: false, pro: false, business: false, enterprise: true },
  { name: 'White-label/Marca própria', free: false, pro: false, business: false, enterprise: true },
  { name: 'Auditoria e logs completos', free: false, pro: '30 dias', business: '1 ano', enterprise: 'Personalizável' },
  { name: 'Suporte', free: 'Comunidade', pro: 'E-mail (48h)', business: 'E-mail (24h)', enterprise: 'Dedicado 24/7' },
]

const PLANS = [
  {
    id: 'free',
    name: 'Grátis',
    nameEn: 'Free',
    nameEs: 'Gratis',
    description: 'Para uso pessoal e testes',
    descriptionEn: 'For personal use and testing',
    descriptionEs: 'Para uso personal y pruebas',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    color: 'slate',
    features: [
      '5 assinaturas/mês',
      '100 MB de armazenamento',
      'Validação de documentos',
      'QR Code de verificação',
      'Suporte por comunidade',
    ],
  },
  {
    id: 'pro',
    name: 'Profissional',
    nameEn: 'Professional',
    nameEs: 'Profesional',
    description: 'Para profissionais autônomos',
    descriptionEn: 'For freelancers and professionals',
    descriptionEs: 'Para autónomos y profesionales',
    monthlyPrice: 49,
    annualPrice: 470, // ~20% desconto
    icon: Rocket,
    color: 'brand',
    popular: true,
    features: [
      '100 assinaturas/mês',
      '10 GB de armazenamento',
      'Assinatura visual customizável',
      'Certificado digital ICP-Brasil',
      'Assinatura em lote (10/dia)',
      'Até 5 usuários',
      'Logs de 30 dias',
      'Suporte por e-mail (48h)',
    ],
  },
  {
    id: 'business',
    name: 'Empresarial',
    nameEn: 'Business',
    nameEs: 'Empresarial',
    description: 'Para pequenas e médias empresas',
    descriptionEn: 'For small and medium businesses',
    descriptionEs: 'Para pequeñas y medianas empresas',
    monthlyPrice: 149,
    annualPrice: 1430, // ~20% desconto
    icon: Building2,
    color: 'purple',
    features: [
      'Assinaturas ilimitadas',
      '100 GB de armazenamento',
      'Tudo do Profissional, mais:',
      'API de integração completa',
      'Webhooks e automações',
      'Até 50 usuários',
      'Logs de 1 ano',
      'Suporte prioritário (24h)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameEn: 'Enterprise',
    nameEs: 'Enterprise',
    description: 'Para grandes empresas',
    descriptionEn: 'For large enterprises',
    descriptionEs: 'Para grandes empresas',
    monthlyPrice: null,
    annualPrice: null,
    icon: Crown,
    color: 'amber',
    features: [
      'Tudo do Empresarial, mais:',
      'Usuários ilimitados',
      'Armazenamento ilimitado',
      'SSO (Single Sign-On)',
      'White-label/Marca própria',
      'Auditoria personalizável',
      'SLA garantido',
      'Suporte dedicado 24/7',
      'Gerente de conta dedicado',
    ],
  },
]

const FAQS = [
  {
    q: 'Posso mudar de plano depois?',
    qEn: 'Can I change my plan later?',
    qEs: '¿Puedo cambiar mi plan después?',
    a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcional.',
    aEn: 'Yes! You can upgrade or downgrade anytime. We adjust the proportional amount.',
    aEs: '¡Sí! Puedes actualizar o reducir tu plan en cualquier momento. Ajustamos el valor proporcional.',
  },
  {
    q: 'Como funciona o período de teste?',
    qEn: 'How does the trial period work?',
    qEs: '¿Cómo funciona el período de prueba?',
    a: 'Todos os planos pagos têm 14 dias de teste grátis. Sem cartão de crédito necessário.',
    aEn: 'All paid plans have a 14-day free trial. No credit card required.',
    aEs: 'Todos los planes de pago tienen 14 días de prueba gratis. Sin tarjeta de crédito necesaria.',
  },
  {
    q: 'As assinaturas têm validade jurídica?',
    qEn: 'Are signatures legally valid?',
    qEs: '¿Las firmas tienen validez legal?',
    a: 'Sim! Seguimos a MP 2.200-2/2001 e usamos certificados ICP-Brasil nos planos pagos.',
    aEn: 'Yes! We follow MP 2.200-2/2001 and use ICP-Brasil certificates in paid plans.',
    aEs: '¡Sí! Seguimos la MP 2.200-2/2001 y usamos certificados ICP-Brasil en planes de pago.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    qEn: 'Can I cancel anytime?',
    qEs: '¿Puedo cancelar en cualquier momento?',
    a: 'Sim, sem burocracia. Seus documentos ficam disponíveis por 90 dias após o cancelamento.',
    aEn: 'Yes, without bureaucracy. Your documents remain available for 90 days after cancellation.',
    aEs: 'Sí, sin burocracia. Tus documentos quedan disponibles por 90 días después de la cancelación.',
  },
]

export default function PricingPage() {
  const { t, locale } = useLanguage()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const getLocalizedText = (ptText: string, enText: string, esText: string) => {
    if (locale === 'en') return enText
    if (locale === 'es') return esText
    return ptText
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t.pricing.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {t.pricing.subtitle}
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${
                billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {t.pricing.monthly}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={billingCycle === 'annually'}
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                billingCycle === 'annually' ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  billingCycle === 'annually' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === 'annually' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {t.pricing.annually}
              <span className="ml-1 text-xs text-emerald-600 font-semibold">
                (-20%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4 md:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const price =
              plan.monthlyPrice === null
                ? null
                : billingCycle === 'monthly'
                ? plan.monthlyPrice
                : plan.annualPrice

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition hover:shadow-xl ${
                  plan.popular
                    ? 'border-brand-500 shadow-brand-100'
                    : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      ⭐ {t.pricing.popular}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl bg-${plan.color}-100 p-3 text-${plan.color}-600`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {getLocalizedText(plan.name, plan.nameEn, plan.nameEs)}
                    </h3>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {getLocalizedText(plan.description, plan.descriptionEn, plan.descriptionEs)}
                </p>

                <div className="mt-6">
                  {price === null ? (
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        Sob consulta
                      </p>
                      <p className="text-sm text-slate-600">Preço personalizado</p>
                    </div>
                  ) : price === 0 ? (
                    <div>
                      <p className="text-3xl font-bold text-slate-900">R$ 0</p>
                      <p className="text-sm text-slate-600">Grátis para sempre</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        R$ {price}
                        <span className="text-base font-normal text-slate-600">
                          {billingCycle === 'monthly'
                            ? t.pricing.perMonth
                            : t.pricing.perYear}
                        </span>
                      </p>
                      {billingCycle === 'annually' && (
                        <p className="text-sm text-emerald-600 font-medium">
                          Economize R$ {plan.monthlyPrice! * 12 - plan.annualPrice!}/ano
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check
                        className="h-5 w-5 flex-shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.id === 'enterprise' ? '/contato' : '/signup'}
                  className={`mt-8 block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    plan.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-600'
                  }`}
                >
                  {plan.id === 'enterprise'
                    ? t.pricing.contactSales
                    : plan.id === 'free'
                    ? t.nav.signUp
                    : t.pricing.selectPlan}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Comparação Detalhada
          </h2>
          <p className="mt-2 text-center text-slate-600">
            Veja todos os recursos incluídos em cada plano
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Recursos
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Grátis
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Profissional
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Empresarial
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {FEATURES.map((feature, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {feature.name}
                      </td>
                      {(['free', 'pro', 'business', 'enterprise'] as const).map((planId) => {
                        const value = feature[planId]
                        return (
                          <td key={planId} className="px-6 py-4 text-center text-sm">
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="mx-auto h-5 w-5 text-emerald-600" />
                              ) : (
                                <X className="mx-auto h-5 w-5 text-slate-300" />
                              )
                            ) : (
                              <span className="text-slate-700">{value}</span>
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
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Perguntas Frequentes
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  aria-expanded={openFaq === idx}
                >
                  <span className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <HelpCircle className="h-5 w-5 text-brand-600" />
                    {getLocalizedText(faq.q, faq.qEn, faq.qEs)}
                  </span>
                  <span
                    className={`text-2xl text-slate-400 transition ${
                      openFaq === idx ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-200 px-6 py-4 text-slate-700">
                    {getLocalizedText(faq.a, faq.aEn, faq.aEs)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-24 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold text-white">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Experimente grátis por 14 dias. Sem cartão de crédito.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-600 shadow-lg transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
          >
            {t.nav.signUp}
            <Rocket className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
