'use client'

import Link from 'next/link'
import { Zap, Play } from 'lucide-react'

export default function CTASection() {
  return (
    <section id="precos" className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronto para assinar com confiança?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Junte-se a mais de 1.000 empresas que já confiam no SignFlow para seus documentos
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <Zap className="w-5 h-5" />
                Começar Gratuitamente
              </Link>
              <Link
                href="/validate/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-transparent text-white font-semibold border-2 border-white hover:bg-white hover:text-blue-700 transition-all duration-200"
              >
                <Play className="w-5 h-5" />
                Ver Demonstração
              </Link>
            </div>

            <p className="text-sm text-blue-200 mt-6">
              Sem cartão de crédito • Comece em menos de 1 minuto
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
