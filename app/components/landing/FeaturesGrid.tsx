'use client'

import AnimatedSection from '../ui/AnimatedSection'
import { MessageCircle, Scale, FolderKanban, FileText, ShieldCheck, Code } from 'lucide-react'

export default function FeaturesGrid() {
  const features = [
    {
      icon: MessageCircle,
      title: 'Assinatura via WhatsApp',
      description: 'Envie documentos e colete assinaturas diretamente pelo WhatsApp de forma rápida e segura.'
    },
    {
      icon: Scale,
      title: 'Validade Jurídica',
      description: 'Certificação ICP-Brasil garante validade legal para contratos e documentos oficiais.'
    },
    {
      icon: FolderKanban,
      title: 'Gestão de Contratos',
      description: 'Organize e acompanhe todos os seus documentos em um painel intuitivo e completo.'
    },
    {
      icon: FileText,
      title: 'Trilha de Auditoria',
      description: 'Histórico completo e imutável de todas as ações realizadas em cada documento.'
    },
    {
      icon: ShieldCheck,
      title: 'Segurança LGPD',
      description: 'Conformidade total com a legislação brasileira de proteção de dados pessoais.'
    },
    {
      icon: Code,
      title: 'API para Integração',
      description: 'Integre facilmente com seus sistemas através de nossa API REST completa.'
    }
  ]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades inteligentes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para assinar documentos com segurança e praticidade
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={i} delay={i * 0.08}>
              <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
