import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Shield, Zap, FileCheck, Users, Globe, Lock, Sparkles, Play, ChevronRight, Star, TrendingUp, Award, BarChart3, Cloud, Puzzle, Code, Mail, Building2, Clock, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white font-semibold text-sm sm:text-base">
            🎉 Promoção Especial: Teste GRÁTIS por 30 dias + 50 assinaturas de bônus! 
            <Link href="/signup" className="underline ml-2 hover:text-emerald-100 transition-colors">
              Começar Agora →
            </Link>
          </p>
        </div>
      </div>

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
                  href="/contato"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  <Play className="h-5 w-5" />
                  Falar com Vendas
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
                    <p className="text-2xl font-bold text-slate-900">+2M</p>
                    <p className="text-sm text-slate-600">Documentos assinados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Numbers Section - NOVO */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                +100K
              </div>
              <div className="text-slate-600 font-medium">Usuários Ativos</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                +2M
              </div>
              <div className="text-slate-600 font-medium">Documentos Assinados</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                30+
              </div>
              <div className="text-slate-600 font-medium">Países Atendidos</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                99.9%
              </div>
              <div className="text-slate-600 font-medium">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-600 mb-10">
            Empresas e instituições que confiam no SignFlow
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center">
            <div className="relative h-16 w-full flex items-center justify-center">
              <div className="text-2xl font-bold text-slate-400">Banco do Brasil</div>
            </div>
            <div className="relative h-16 w-full flex items-center justify-center">
              <div className="text-2xl font-bold text-slate-400">Magazine Luiza</div>
            </div>
            <div className="relative h-16 w-full flex items-center justify-center">
              <div className="text-2xl font-bold text-slate-400">Einstein</div>
            </div>
            <div className="relative h-16 w-full flex items-center justify-center">
              <div className="text-2xl font-bold text-slate-400">Gov.br</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 5 Steps - MELHORADO */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-white to-slate-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Com o SignFlow, você fecha negócios em minutos
            </h2>
            <p className="text-xl text-slate-600">
              Processo simples e intuitivo em 5 passos
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 -translate-y-1/2 z-0"></div>
            
            <div className="grid md:grid-cols-5 gap-6 relative z-10">
              {[
                {
                  step: '01',
                  title: 'Crie',
                  description: 'Faça upload do PDF ou crie do zero com templates personalizados',
                  icon: FileCheck,
                  color: 'blue',
                },
                {
                  step: '02',
                  title: 'Envie',
                  description: 'Compartilhe via WhatsApp, email ou SMS em segundos',
                  icon: Mail,
                  color: 'purple',
                },
                {
                  step: '03',
                  title: 'Valide',
                  description: 'Defina o nível de verificação conforme o risco do documento',
                  icon: Shield,
                  color: 'emerald',
                },
                {
                  step: '04',
                  title: 'Assine',
                  description: 'Assinatura com validade jurídica em questão de segundos',
                  icon: CheckCircle2,
                  color: 'amber',
                },
                {
                  step: '05',
                  title: 'Acompanhe',
                  description: 'Monitore em tempo real com lembretes automáticos',
                  icon: Clock,
                  color: 'red',
                },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      {step.step}
                    </div>
                    <div className={`inline-flex rounded-xl bg-${step.color}-100 p-3 mb-4 mt-3`}>
                      <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
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

      {/* Success Cases - NOVO */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Resultados Reais de Nossos Clientes
            </h2>
            <p className="text-xl text-slate-600">
              Empresas que transformaram seus processos com o SignFlow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                company: "Banco Regional do Brasil",
                result: "75%",
                metric: "Redução no tempo de assinatura",
                description: "De 8 dias para 2 dias na aprovação de contratos",
                icon: Building2,
                color: "blue"
              },
              {
                company: "Construtora Horizonte",
                result: "+85K",
                metric: "Contratos assinados em 2025",
                description: "Economia de R$ 340 mil em papel e impressão",
                icon: TrendingUp,
                color: "emerald"
              },
              {
                company: "Clínica Vida & Saúde",
                result: "3 dias",
                metric: "De 10 para 3 dias no onboarding",
                description: "Pacientes começam tratamento mais rápido",
                icon: BarChart3,
                color: "purple"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`inline-flex rounded-xl bg-${item.color}-100 p-3 mb-6`}>
                  <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                </div>
                <div className="text-sm font-semibold text-slate-500 mb-2">{item.company}</div>
                <div className={`text-6xl font-bold bg-gradient-to-r from-${item.color}-600 to-${item.color}-700 bg-clip-text text-transparent mb-3`}>
                  {item.result}
                </div>
                <div className="text-lg font-semibold text-slate-900 mb-3">{item.metric}</div>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Compliance - NOVO */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Segurança e Compliance de Classe Mundial
            </h2>
            <p className="text-xl text-slate-600">
              Seguimos os mais altos padrões globais de segurança
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "ISO 27001",
                subtitle: "Certificado",
                description: "Segurança da informação auditada e certificada internacionalmente",
                color: "blue"
              },
              {
                icon: Award,
                title: "ICP-Brasil",
                subtitle: "A1 e A3",
                description: "Assinatura digital com validade jurídica total no Brasil",
                color: "emerald"
              },
              {
                icon: FileCheck,
                title: "LGPD",
                subtitle: "Compliance Total",
                description: "100% em conformidade com a Lei Geral de Proteção de Dados",
                color: "purple"
              },
              {
                icon: Lock,
                title: "MP 2.200-2",
                subtitle: "Validade Legal",
                description: "Reconhecido pela Medida Provisória e legislação brasileira",
                color: "red"
              }
            ].map((cert, i) => (
              <div key={i} className="text-center p-8 rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all">
                <div className={`inline-flex rounded-xl bg-${cert.color}-100 p-4 mb-4`}>
                  <cert.icon className={`h-10 w-10 text-${cert.color}-600`} />
                </div>
                <div className="font-bold text-xl text-slate-900 mb-1">{cert.title}</div>
                <div className={`text-sm font-semibold text-${cert.color}-600 mb-3`}>{cert.subtitle}</div>
                <p className="text-slate-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/docs" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
              Ver Trust Center Completo
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations Section - NOVO */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Integrado com Suas Ferramentas Favoritas
            </h2>
            <p className="text-xl text-slate-600">
              Conecte o SignFlow com mais de 50+ aplicações e sistemas
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {/* Categoria 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all">
              <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">CRM & ERP</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Salesforce</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>HubSpot</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Pipedrive</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>SAP</span>
                </li>
              </ul>
            </div>
            
            {/* Categoria 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all">
              <div className="inline-flex rounded-xl bg-purple-100 p-3 mb-4">
                <Cloud className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Armazenamento</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Google Drive</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>OneDrive</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Dropbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Box</span>
                </li>
              </ul>
            </div>
            
            {/* Categoria 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all">
              <div className="inline-flex rounded-xl bg-emerald-100 p-3 mb-4">
                <Puzzle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Automação</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Zapier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Make</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Pluga</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>n8n</span>
                </li>
              </ul>
            </div>
            
            {/* Categoria 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all">
              <div className="inline-flex rounded-xl bg-amber-100 p-3 mb-4">
                <Code className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Desenvolvedores</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>API REST</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>SDK JavaScript</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>SDK Python</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/docs" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg">
              Ver Todas as Integrações
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - NOVO */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-blue-100">
              Mais de 100 mil empresas confiam no SignFlow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                role: "Diretora Jurídica",
                company: "TechCorp Brasil",
                text: "O SignFlow reduziu nosso tempo de aprovação de contratos em 80%. A integração com nosso CRM foi perfeita. Simplesmente incrível!",
                rating: 5
              },
              {
                name: "Carlos Oliveira",
                role: "CEO",
                company: "Construtora Horizonte",
                text: "Economizamos mais de R$ 300 mil por ano em papel, impressão e logística. O ROI foi alcançado em menos de 2 meses.",
                rating: 5
              },
              {
                name: "Ana Paula Costa",
                role: "Gerente de RH",
                company: "Hospital Vida",
                text: "Nossos processos de contratação ficaram 5x mais rápidos. A experiência do candidato melhorou muito com a assinatura digital.",
                rating: 5
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 italic mb-6 leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-sm text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2M+', label: 'Documentos Assinados' },
              { value: '100K+', label: 'Usuários Ativos' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Suporte' },
            ].map((stat, idx) => (
              <div key={idx} className="text-white">
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="precos" className="py-24 bg-gradient-to-b from-slate-50 to-white scroll-mt-20">
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
                features: ['10 assinaturas/mês', '5 documentos', 'Validação básica', 'Suporte por email'],
                cta: 'Começar Grátis',
                popular: false,
              },
              {
                name: 'Profissional',
                price: 'R$ 49',
                period: '/mês',
                features: ['100 assinaturas/mês', 'Certificado ICP-Brasil', 'Templates customizados', 'API completa', 'Suporte prioritário'],
                cta: 'Teste 30 Dias Grátis',
                popular: true,
              },
              {
                name: 'Empresarial',
                price: 'R$ 199',
                period: '/mês',
                features: ['Assinaturas ilimitadas', 'Até 50 usuários', 'SSO e SAML', 'SLA garantido', 'Account Manager'],
                cta: 'Falar com Vendas',
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
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.popular ? "/signup" : "/contato"}
                  className={`block w-full rounded-xl px-6 py-3 text-center font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                      : 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg">
              Ver todos os planos e recursos detalhados
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Support/Help Section */}
      <section id="suporte" className="py-24 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Precisa de Ajuda?
            </h2>
            <p className="text-xl text-slate-600">
              Estamos aqui para ajudar você a começar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
              <div className="inline-flex rounded-xl bg-blue-100 p-4 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Documentação</h3>
              <p className="text-slate-600 mb-4">Guias completos e referências da API</p>
              <Link href="/docs" className="text-blue-600 hover:text-blue-700 font-semibold">
                Acessar Docs →
              </Link>
            </div>

            <div className="text-center p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
              <div className="inline-flex rounded-xl bg-purple-100 p-4 mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Suporte</h3>
              <p className="text-slate-600 mb-4">Fale com nossa equipe de suporte</p>
              <Link href="/contato" className="text-purple-600 hover:text-purple-700 font-semibold">
                Abrir Ticket →
              </Link>
            </div>

            <div className="text-center p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
              <div className="inline-flex rounded-xl bg-emerald-100 p-4 mb-4">
                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Comunidade</h3>
              <p className="text-slate-600 mb-4">Conecte-se com outros usuários</p>
              <Link href="/contato" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Participar →
              </Link>
            </div>
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
            Junte-se a mais de 100 mil empresas que já confiam no SignFlow para assinar documentos digitalmente
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
            ✨ Sem cartão de crédito • 🚀 Teste grátis por 30 dias • 🔒 Cancele quando quiser
          </p>
        </div>
      </section>
    </main>
  )
}
