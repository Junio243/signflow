import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  FileCheck2,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react'

import {
  benefits,
  companyLogos,
  complianceItems,
  featureStories,
  finalCtas,
  heroMetrics,
  institutionalPillars,
  trustHighlights,
  trustSeals,
} from './components/landing/content'

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string
  title: string
  description: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_55%,_#f8fafc_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
        <div className="landing-shell grid gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Assinatura digital para operacoes que exigem confianca juridica
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Assine, valide e apresente documentos com uma experiencia institucional.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              O SignFlow transforma a assinatura digital em um fluxo claro, seguro e profissional para empresas
              que precisam transmitir legitimidade desde o primeiro contato ate a validacao final.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="landing-btn landing-btn-primary">
                Criar conta gratuita
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/validate/demo" className="landing-btn landing-btn-secondary">
                <PlayCircle className="h-5 w-5" />
                Ver demonstracao
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                'Validade juridica com foco no contexto brasileiro',
                'Validacao publica com QR Code e trilha de auditoria',
                'Fluxos pensados para times, clientes e operacoes internas',
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <p className="text-3xl font-semibold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 hidden h-32 w-32 rounded-full bg-sky-200/60 blur-3xl lg:block" />
            <div className="absolute -right-4 bottom-10 hidden h-44 w-44 rounded-full bg-blue-200/60 blur-3xl lg:block" />

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Painel SignFlow</p>
                  <p className="text-sm text-slate-500">Fluxo de assinatura e validacao</p>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Operacao segura
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Contrato comercial.pdf</p>
                      <p className="text-sm text-slate-500">Em andamento com 3 participantes</p>
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Etapa 02
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ['Solicitante', 'Documento enviado e autenticado'],
                      ['Financeiro', 'Assinatura pendente'],
                      ['Cliente final', 'Aguardando liberacao'],
                    ].map(([title, copy], index) => (
                      <div
                        key={title}
                        className="flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                          0{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-950">{title}</p>
                          <p className="text-sm text-slate-500">{copy}</p>
                        </div>
                        <BadgeCheck className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                    <p className="text-sm font-semibold text-slate-100">Validacao publica</p>
                    <p className="mt-2 text-2xl font-semibold">Documento apto para conferencia</p>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="grid h-20 w-20 grid-cols-4 gap-1 rounded-2xl bg-white p-3">
                        {Array.from({ length: 16 }).map((_, index) => (
                          <span
                            key={index}
                            className={`rounded-[3px] ${index % 2 === 0 || index % 5 === 0 ? 'bg-slate-950' : 'bg-slate-300'}`}
                          />
                        ))}
                      </div>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>QR Code inserido no PDF</p>
                        <p>Hash conferivel</p>
                        <p>Relatorio de eventos disponivel</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Confianca para o destinatario</p>
                        <p className="text-sm text-slate-500">A experiencia comunica autenticidade antes mesmo da leitura juridica.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Quem somos</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Plataforma brasileira desenhada para elevar a percepcao profissional de assinaturas digitais.
                    </p>
                  </div>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                  >
                    Conhecer posicionamento
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="landing-shell py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="landing-eyebrow">Empresas que confiam</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Credibilidade apresentada cedo, com logos reais e sinais visuais de legitimidade.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {trustHighlights.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Icon className="h-5 w-5 text-sky-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:grid-cols-4">
            {companyLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex min-h-[96px] items-center justify-center rounded-2xl border border-white bg-white px-5 py-4 shadow-sm"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="max-h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {trustSeals.map((seal) => (
              <div key={seal.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-14 items-center">
                  {seal.src ? (
                    <Image src={seal.src} alt={seal.title} width={88} height={42} className="max-h-11 w-auto object-contain" />
                  ) : seal.icon ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <seal.icon className="h-6 w-6" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">{seal.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{seal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-slate-50">
        <div className="landing-shell py-20">
          <SectionHeading
            eyebrow="Posicionamento e beneficios"
            title="Uma home mais institucional para um produto que precisa parecer confiavel antes do clique."
            description="A nova hierarquia do SignFlow prioriza clareza de proposta, legitimidade visual e uma leitura escaneavel para juridico, financeiro, RH, comercial e operacoes."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-5 md:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <article key={benefit.title} className="landing-card">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-950">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
                  </article>
                )
              })}
            </div>

            <aside className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
              <p className="landing-eyebrow border-white/10 bg-white/10 text-white">Quem somos</p>
              <h3 className="mt-5 text-3xl font-semibold tracking-tight">
                SignFlow e uma plataforma pensada para assinatura digital com cara de operacao seria.
              </h3>
              <p className="mt-5 text-base leading-8 text-slate-300">
                Em vez de uma pagina apenas promocional, a home passa a funcionar como uma apresentacao institucional:
                proposta de valor, provas visuais de confianca, narrativa de produto e camada juridica no mesmo fluxo.
              </p>

              <div className="mt-8 space-y-4">
                {institutionalPillars.map((pillar) => (
                  <div key={pillar} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-300" />
                    <p className="text-sm leading-6 text-slate-200">{pillar}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/about" className="landing-btn bg-white text-slate-950 hover:bg-slate-100">
                  Ver pagina institucional
                </Link>
                <Link href="/security" className="landing-btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Ver seguranca
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="bg-white">
        <div className="landing-shell py-20">
          <SectionHeading
            eyebrow="Funcionalidades"
            title="A experiencia do produto explicada como fluxo, nao como lista generica de features."
            description="Cada bloco reforca um ponto da leitura: enviar, acompanhar, validar e escalar. Assim, a home vende confianca e entendimento ao mesmo tempo."
            align="center"
          />

          <div className="mt-14 space-y-6">
            {featureStories.map((story, index) => (
              <article
                key={story.title}
                className={`grid gap-6 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-8 ${
                  index % 2 === 1 ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''
                }`}
              >
                <div className={`rounded-[28px] border border-white bg-white p-6 shadow-sm ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <p className="landing-eyebrow">{story.eyebrow}</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{story.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{story.description}</p>
                  <div className="mt-6 space-y-3">
                    {story.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3">
                        <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {story.stats.map((stat) => (
                      <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100">
                        {stat}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <p className="text-sm font-semibold text-white">Narrativa visual do produto</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                        Bloco {index + 1}
                      </span>
                    </div>
                    <div className="mt-5 space-y-4">
                      {story.stats.map((stat) => (
                        <div key={`${story.title}-${stat}`} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4">
                          <p className="text-sm font-semibold text-slate-100">{stat}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            Conteudo visual e textual trabalhando juntos para reduzir duvida e acelerar confianca.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="border-y border-slate-200 bg-slate-50">
        <div className="landing-shell py-20">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <SectionHeading
                eyebrow="Seguranca e compliance"
                title="Camada institucional desenhada para reforcar legitimidade e reduzir objeccoes."
                description="No modelo da ZapSign, a parte juridica nao aparece como detalhe tecnico. Aqui, ela vira um bloco proprio, com linguagem objetiva, selos, links de apoio e componentes que transmitem seguranca."
              />

              <div className="mt-8 space-y-4">
                {[
                  'Medida Provisoria 2.200-2/2001 como referencia do contexto brasileiro de assinatura digital',
                  'Suporte a validacao, trilha de eventos e leitura publica de autenticidade',
                  'Links institucionais para seguranca, documentacao de imutabilidade e validacao de documentos',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/security" className="landing-btn landing-btn-primary">
                  Conhecer camadas de seguranca
                </Link>
                <Link href="/docs/immutability" className="landing-btn landing-btn-secondary">
                  Ler documentacao tecnica
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {complianceItems.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="landing-card bg-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                  </article>
                )
              })}

              <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:col-span-2">
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                  <div>
                    <p className="landing-eyebrow border-white/10 bg-white/10 text-white">Trust center</p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                      Uma mensagem clara: o documento nao apenas foi assinado, ele pode ser conferido.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                      Essa e a diferenca entre uma home visualmente bonita e uma home com percepcao de legitimidade.
                      O bloco final de compliance conecta selos, validacao e links institucionais ja existentes no produto.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <p className="text-sm font-semibold text-slate-100">Central de confianca</p>
                      <BadgeCheck className="h-5 w-5 text-sky-300" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ['Validar documento', '/validate'],
                        ['Verificar assinatura', '/verify'],
                        ['Politica de privacidade', '/privacy'],
                      ].map(([label, href]) => (
                        <Link
                          key={label}
                          href={href}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm font-medium text-slate-100 transition hover:bg-slate-900"
                        >
                          <span>{label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-shell py-20">
          <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_35%,_#0c4a6e_100%)] px-6 py-10 text-center text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)] sm:px-10 sm:py-14">
            <p className="landing-eyebrow mx-auto border-white/10 bg-white/10 text-white">CTA final</p>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Eleve a percepcao profissional das suas assinaturas com uma plataforma feita para inspirar confianca.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              O SignFlow passa a comunicar valor, credibilidade e seguranca desde a primeira dobra ate o ultimo clique.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {finalCtas.map((cta) => (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className={
                    cta.primary
                      ? 'landing-btn bg-white text-slate-950 hover:bg-slate-100'
                      : 'landing-btn border border-white/20 bg-white/5 text-white hover:bg-white/10'
                  }
                >
                  {cta.label}
                  {cta.primary ? <ArrowRight className="h-5 w-5" /> : null}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-200">
              {[
                'Sem cartao de credito para comecar',
                'Narrativa visual alinhada a uma operacao institucional',
                'Links de validacao, seguranca e documentacao tecnica',
              ].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
