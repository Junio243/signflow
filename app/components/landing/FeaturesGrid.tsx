'use client'

import { FileCheck2, QrCode, Users, BarChart3, Lock, Zap } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}

const features: Feature[] = [
  {
    icon: <FileCheck2 className="h-6 w-6" />,
    title: "Upload e assinatura rápida",
    description: "Faça upload do seu PDF e assine em segundos com interface intuitiva. Dois modos: rápido ou avançado.",
    badge: "Rápido"
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: "QR Code de validação pública",
    description: "Cada documento gerado recebe um QR Code único. Qualquer pessoa pode escanear e validar a autenticidade.",
    badge: "Transparente"
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Hash criptográfico SHA-256",
    description: "Assinaturas protegidas com hash criptográfico. Garante integridade e autenticidade do documento.",
    badge: "Seguro"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Múltiplos signatários",
    description: "Fluxo colaborativo com suporte a múltiplos signatários em sequência ou paralelo. Rastreamento completo.",
    badge: "Colaborativo"
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Dashboard em tempo real",
    description: "Centralize todos os seus documentos. Filtros por status, busca rápida e atualização instantânea.",
    badge: "Gestão"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Certificado digital personalizado",
    description: "Adicione dados do signatário, empresa e personalize o certificado. Incluso em cada assinatura.",
    badge: "Profissional"
  },
]

export default function FeaturesGrid() {
  return (
    <section id="recursos" className="border-t border-white/5 bg-slate-950/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Seção header */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            Recursos profissionais pensados para seu fluxo
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Do assinante individual à empresa com múltiplas assinaturas, o SignFlow se adapta ao seu contexto.
          </p>
        </div>

        {/* Grid de features */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              {/* Badge */}
              {feature.badge && (
                <span className="mb-3 inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                  {feature.badge}
                </span>
              )}

              {/* Icon */}
              <div className="mb-4 inline-flex rounded-lg bg-cyan-500/10 p-3 text-cyan-300 group-hover:bg-cyan-500/20 transition">
                {feature.icon}
              </div>

              {/* Título */}
              <h3 className="mb-2 text-lg font-semibold text-slate-50">
                {feature.title}
              </h3>

              {/* Descrição */}
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
