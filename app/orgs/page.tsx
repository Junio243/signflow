import Link from 'next/link'

export const metadata = {
  title: 'Organizações — SignFlow',
}

const features = [
  {
    title: 'Perfis customizados',
    description: 'Defina logotipo, cor primária e rodapé específicos por unidade ou departamento.',
  },
  {
    title: 'Fluxos aprovadores',
    description: 'Configure múltiplos assinantes, ordem de assinatura e notificações automáticas.',
  },
  {
    title: 'Auditoria completa',
    description: 'Rastreabilidade por usuário com exportação em CSV para compliance.',
  },
]

export default function OrgsPage() {
  return (
    <div className="max-w-4xl space-y-6 text-slate-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Organizações</h1>
        <p>Gerencie unidades, políticas e perfis visuais do seu time.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(feature => (
          <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Próximos passos</h2>
        <p className="mt-2 text-sm text-slate-600">
          Acesse uma organização existente ou cadastre uma nova para começar a convidar membros e aplicar políticas.
        </p>
        <Link
          href="/orgs/new"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          Criar organização
        </Link>
      </section>
    </div>
  )
}
