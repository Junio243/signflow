'use client'

import { Upload, Users, Download } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Carregue seu PDF',
      description: 'Faça upload do documento que precisa ser assinado',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Indique os Signatários',
      description: 'Envie por WhatsApp ou E-mail para os responsáveis',
      color: 'green'
    },
    {
      icon: Download,
      title: 'Baixe o documento assinado',
      description: 'Receba o PDF com assinaturas válidas e QR Code',
      color: 'purple'
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600'
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600'
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600'
    }
  }

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Assine documentos em 3 passos simples
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting lines */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-green-200 to-purple-200 opacity-30" 
               style={{ width: 'calc(100% - 200px)', left: '100px' }} 
          />

          {steps.map((step, i) => {
            const colors = colorClasses[step.color as keyof typeof colorClasses]
            
            return (
              <div key={i}>
                <div className="relative">
                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full">
                    {/* Step number */}
                    <div className={`absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-r ${colors.gradient} text-white flex items-center justify-center font-bold shadow-lg`}>
                      {i + 1}
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-6`}>
                      <step.icon className={`w-8 h-8 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
