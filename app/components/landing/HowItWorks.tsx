import { Upload, PenTool, Users, CheckCircle } from 'lucide-react'

interface Step {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  details: string[]
}

const steps: Step[] = [
  {
    number: 1,
    icon: <Upload className="h-6 w-6" />,
    title: "Upload do documento",
    description: "Faça upload do seu PDF (até 10MB) ou escolha um dos templates disponíveis.",
    details: [
      "Suporta PDF de qualquer tamanho",
      "Visualização instantânea",
      "Sem conversão de formato"
    ]
  },
  {
    number: 2,
    icon: <PenTool className="h-6 w-6" />,
    title: "Crie sua assinatura",
    description: "Escolha entre desenho à mão, texto personalizado ou upload de imagem.",
    details: [
      "Desenho com rastreamento suave",
      "Fontes customizáveis",
      "Remoção de fundo automática"
    ]
  },
  {
    number: 3,
    icon: <Users className="h-6 w-6" />,
    title: "Adicione signatários",
    description: "Convide múltiplos signatários com email. Defina a ordem de assinatura.",
    details: [
      "Fluxo sequencial ou paralelo",
      "Convites automáticos por email",
      "Rastreamento de progresso"
    ]
  },
  {
    number: 4,
    icon: <CheckCircle className="h-6 w-6" />,
    title: "Finalize e valide",
    description: "Receba o PDF assinado com QR Code. Compartilhe o link de validação.",
    details: [
      "Hash SHA-256 único",
      "Certificado digital incluso",
      "Página pública de validação"
    ]
  }
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          Como funciona em 4 passos
        </h2>
        <p className="mt-4 text-lg text-slate-300">
          Do upload à assinatura final, tudo integrado em uma única plataforma.
        </p>
      </div>

      {/* Timeline / Passos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Conector (linha entre passos) */}
            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
            )}

            {/* Card do passo */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-cyan-500/50 hover:bg-slate-900/80 transition">
              {/* Número do passo */}
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-sm font-bold text-white">
                {step.number}
              </div>

              {/* Ícone */}
              <div className="mb-4 inline-flex rounded-lg bg-cyan-500/10 p-3 text-cyan-300">
                {step.icon}
              </div>

              {/* Título */}
              <h3 className="mb-2 text-lg font-semibold text-slate-50">
                {step.title}
              </h3>

              {/* Descrição principal */}
              <p className="mb-4 text-sm text-slate-300">
                {step.description}
              </p>

              {/* Detalhes (lista) */}
              <ul className="space-y-2 border-t border-slate-800 pt-4">
                {step.details.map((detail, detailIdx) => (
                  <li key={detailIdx} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="h-4 w-4 text-cyan-300 flex-shrink-0 mt-0.5">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA adicional */}
      <div className="mt-12 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/60 to-cyan-950/40 p-8 text-center">
        <h3 className="text-xl font-semibold text-slate-50">
          Pronto para começar?
        </h3>
        <p className="mt-2 text-slate-300">
          Crie sua primeira assinatura digital agora. Leva menos de 5 minutos.
        </p>
        <a
          href="/create-document"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-700 transition"
        >
          Criar documento
        </a>
      </div>
    </section>
  )
}
