import type { ComponentType, SVGProps } from 'react'
import { Clock3, Database, Download, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Status e uptime — SignFlow',
}

type StatusCard = {
  title: string
  status: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const STATUS_ITEMS: StatusCard[] = [
  {
    title: 'API de assinatura',
    status: 'Operando normalmente',
    description: 'Criação de documentos, inserção de QR Code e geração de hash.',
    icon: ShieldCheck,
  },
  {
    title: 'Storage público',
    status: 'Operando normalmente',
    description: 'Distribuição de PDFs assinados e QR Codes com cache em CDN.',
    icon: Download,
  },
  {
    title: 'Banco de dados Supabase',
    status: 'Monitorando',
    description: 'Replique de leitura em atualização. Monitoramento reforçado.',
    icon: Database,
  },
]

export default function StatusPage() {
  return (
    <div className="max-w-4xl space-y-6 text-slate-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Status em tempo real</h1>
        <p>Resumo do estado atual da plataforma e janelas de manutenção planejadas.</p>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 className="h-4 w-4" aria-hidden /> Última atualização: {new Date().toLocaleString('pt-BR')}
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {STATUS_ITEMS.map(item => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <item.icon className="h-4 w-4 text-brand-600" aria-hidden />
              {item.title}
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-600">{item.status}</p>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Manutenções planejadas</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nenhuma manutenção programada nas próximas 72 horas. Quando houver, notificaremos usuários via e-mail e no painel.
        </p>
      </section>
    </div>
  )
}
