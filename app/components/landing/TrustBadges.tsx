'use client'

import Image from 'next/image'
import { Shield, Lock, Award, FileCheck } from 'lucide-react'

export default function TrustBadges() {
  const companies = [
    { name: 'Banco do Brasil', logo: '/logos/banco-do-brasil.png', width: 140, height: 40 },
    { name: 'Magazine Luiza', logo: '/logos/magazine-luiza.png', width: 120, height: 40 },
    { name: 'Hospital Einstein', logo: '/logos/hospital-einstein.png', width: 130, height: 40 },
    { name: 'Gov.br', logo: '/logos/govbr.png', width: 100, height: 40 },
  ]

  const badges = [
    { icon: Shield, label: 'LGPD', description: 'Conforme à legislação' },
    { icon: Award, label: 'ISO 27001', description: 'Certificação de segurança' },
    { icon: FileCheck, label: 'ICP-Brasil', description: 'Validade jurídica' },
    { icon: Lock, label: 'Criptografia', description: 'Hash SHA-256' }
  ]

  return (
    <section id="seguranca" className="py-12 sm:py-16 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 sm:mb-8">
              Mais de 1.000 empresas confiam
            </h2>
            
            {/* Company logos - AGORA COM IMAGENS REAIS */}
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
              {companies.map((company, i) => (
                <div 
                  key={i}
                  className="relative grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                  title={company.name}
                >
                  <Image
                    src={company.logo}
                    alt={`Logo ${company.name}`}
                    width={company.width}
                    height={company.height}
                    className="object-contain"
                    priority={i < 2} // Prioriza primeiras 2 logos
                  />
                </div>
              ))}
            </div>

            {/* Security badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {badges.map((badge, i) => (
                <div key={i}>
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <badge.icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                      {badge.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {badge.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
