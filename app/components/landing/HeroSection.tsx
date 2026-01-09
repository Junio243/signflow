'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Play, CheckCircle2 } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-60" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6"
            >
              <CheckCircle2 className="w-4 h-4" />
              Segurança LGPD • Validade Jurídica
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              A assinatura digital mais{' '}
              <span className="text-blue-600">simples e segura</span>{' '}
              para seus documentos
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Assine contratos em segundos pelo WhatsApp ou E-mail com validade jurídica (ICP-Brasil).
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-105 transition-all duration-200"
              >
                <Zap className="w-5 h-5" />
                Testar Grátis Agora
              </Link>
              <Link
                href="/validate/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-gray-700 font-semibold border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <Play className="w-5 h-5" />
                Ver Demonstração
              </Link>
            </div>

            {/* Benefits list */}
            <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
              {[
                'Assinatura manuscrita ou certificada com hash SHA-256',
                'QR Code em todas as páginas do PDF',
                'Trilha de auditoria completa e imutável'
              ].map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-sm text-gray-500 ml-auto">Documento Assinado</div>
              </div>
              
              {/* Document preview */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                
                {/* Signature box */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-xs font-semibold text-blue-900 mb-2">
                    Assinatura Digital Verificada
                  </div>
                  <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-80">
                    SignFlow ✓
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Hash: 7A1E-93C4-2BD0-FF12
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-end">
                  <div className="w-20 h-20 bg-gray-900 rounded-lg p-2">
                    <div className="w-full h-full bg-white rounded grid grid-cols-4 gap-0.5">
                      {[...Array(16)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`${i % 3 === 0 ? 'bg-gray-900' : 'bg-gray-300'} rounded-sm`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm"
            >
              ✓ Válido
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
