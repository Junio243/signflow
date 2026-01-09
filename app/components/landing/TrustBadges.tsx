'use client'

import AnimatedSection from '../ui/AnimatedSection'
import { Shield, Lock, Award, FileCheck } from 'lucide-react'

export default function TrustBadges() {
  const companies = [
    'Banco do Brasil',
    'Magazine Luiza',
    'Hospital Einstein',
    'Gov.br',
    'Dataprev'
  ]

  const badges = [
    { icon: Shield, label: 'LGPD', description: 'Conforme à legislação' },
    { icon: Award, label: 'ISO 27001', description: 'Certificação de segurança' },
    { icon: FileCheck, label: 'ICP-Brasil', description: 'Validade jurídica' },
    { icon: Lock, label: 'Criptografia', description: 'Hash SHA-256' }
  ]

  return (
    <section className="py-12 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Mais de 1.000 empresas confiam
            </h2>
            
            {/* Company logos (placeholder text) */}
            <div className="flex flex-wrap justify-center gap-8 mb-8 opacity-50">
              {companies.map((company, i) => (
                <div 
                  key={i}
                  className="px-6 py-3 text-gray-600 font-semibold text-sm bg-white rounded-lg border border-gray-200"
                >
                  {company}
                </div>
              ))}
            </div>

            {/* Security badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {badges.map((badge, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <badge.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">
                      {badge.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {badge.description}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
