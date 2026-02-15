import Link from 'next/link'
import { ArrowRight, Check, Shield, Zap, FileCheck, Users, Globe, Lock, Sparkles, Play, ChevronRight, Star, TrendingUp, Clock, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 mb-6">
                <Sparkles className="h-4 w-4" />
                Assinaturas Digitais Confiáveis
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                Assine documentos com{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  segurança e validade jurídica
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Plataforma brasileira de assinatura digital certificada pelo ICP-Brasil. 
                Assine, valide e gerencie documentos de forma simples e segura.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105"
                >
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  <Play className="h-5 w-5" />
                  Ver Demonstração
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span>Grátis para começar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span>Suporte em português</span>
                </div>
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="relative">
              <div className="relative rounded-2xl bg-white p-8 shadow-2xl">
                <div className="absolute -top-4 -right-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="rounded-lg bg-blue-600 p-2">
                      <FileCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Contrato.pdf</p>
                      <p className="text-sm text-slate-600">Assinado com sucesso</p>
                    </div>
                    <Check className="h-6 w-6 text-emerald-600 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="rounded-lg bg-purple-600 p-2">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">3 Signatários</p>
                      <p className="text-sm text-slate-600">Aguardando 1 assinatura</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="rounded-lg bg-amber-600 p-2">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">ICP-Brasil</p>
                      <p className="text-sm text-slate-600">Certificado válido</p>
                    </div>
                    <Shield className="h-6 w-6 text-emerald-600 ml-auto" />
                  </div>
                </div>
              </div>
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">+1M</p>
                    <p className="text-sm text-slate-600">Documentos assinados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-600 mb-8">
            Empresas que confiam no SignFlow
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-32 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-400">Empresa {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Tudo que você precisa para assinar documentos
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Recursos completos para assinatura digital, validação e gestão de documentos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Certificado ICP-Brasil',
                description: 'Assinaturas com validade jurídica total, certificadas pela Infraestrutura de Chaves Públicas Brasileira.',
                color: 'blue',
              },
              {
                icon: Zap,
                title: 'Rápido e Fácil',
                description: 'Assine documentos em segundos, de qualquer lugar, em qualquer dispositivo. Interface intuitiva e simples.',
                color: 'purple',
              },
              {
                icon: FileCheck,
                title: 'Validação de Documentos',
                description: 'Verifique a autenticidade e integridade de documentos assinados com QR Code e blockchain.',
                color: 'emerald',
              },
              {
                icon: Users,
                title: 'Múltiplos Signatários',
                description: 'Envie documentos para várias pessoas assinarem com fluxo de aprovação personalizado.',
                color: 'amber',
              },
              {
                icon: Lock,
                title: 'Segurança Máxima',
                description: 'Criptografia de ponta a ponta, armazenamento seguro e conformidade com LGPD e ISO 27001.',
                color: 'red',
              },
              {
                icon: Globe,
                title: 'API Completa',
                description: 'Integre assinaturas digitais em seus sistemas com nossa API REST completa e webhooks.',
                color: 'indigo',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`inline-flex rounded-xl bg-${feature.color}-100 p-3 mb-4`}>
                  <feature.icon className={`h-7 w-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-slate-600">
              Assine seus documentos em 3 passos simples
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 -translate-y-1/2 z-0"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: '01',
                  title: 'Faça Upload',
                  description: 'Envie seu documento PDF ou crie um novo do zero usando nossos templates.',
                  icon: '📄',
                },
                {
                  step: '02',
                  title: 'Configure Signatários',
                  description: 'Adicione os signatários, defina a ordem e personalize campos de assinatura.',
                  icon: '✍️',
                },
                {
                  step: '03',
                  title: 'Assine e Valide',
                  description: 'Assine digitalmente com certificado ICP-Brasil e valide com QR Code.',
                  icon: '✅',
                },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all">
                    <div className="absolute -top-4 left-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      {step.step}
                    </div>
                    <div className="text-5xl mb-4 mt-4">{step.icon}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1M+', label: 'Documentos Assinados' },
              { value: '50K+', label: 'Usuários Ativos' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Suporte' },
            ].map((stat, idx) => (
              <div key={idx} className="text-white">
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Planos para Todos os Tamanhos
            </h2>
            <p className="text-xl text-slate-600">
              Do uso pessoal a grandes empresas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Gratuito',
                price: 'R$ 0',
                period: '/mês',
                features: ['3 assinaturas/mês', '10 documentos', 'Validação básica'],
                cta: 'Começar Grátis',
                popular: false,
              },
              {
                name: 'Starter',
                price: 'R$ 29',
                period: '/mês',
                features: ['50 assinaturas/mês', 'Certificado ICP-Brasil', 'Templates customizados'],
                cta: 'Iniciar Teste',
                popular: true,
              },
              {
                name: 'Profissional',
                price: 'R$ 99',
                period: '/mês',
                features: ['500 assinaturas/mês', 'API completa', 'Até 10 usuários'],
                cta: 'Iniciar Teste',
                popular: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all ${
                  plan.popular ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-sm font-bold text-white shadow-lg">
                      <Star className="h-4 w-4" />
                      Mais Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700">
                      <Check className="h-5 w-5 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full rounded-xl px-6 py-3 text-center font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
              Ver todos os planos
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pronto para Transformar Suas Assinaturas?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Junte-se a milhares de empresas que já confiam no SignFlow para assinar documentos digitalmente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl hover:bg-blue-50 transition-all hover:scale-105"
            >
              Começar Gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
            >
              Falar com Vendas
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            ✨ Sem cartão de crédito • 🚀 Teste grátis por 14 dias • 🔒 Cancele quando quiser
          </p>
        </div>
      </section>
    </main>
  )
}
