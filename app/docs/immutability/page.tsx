export const metadata = {
  title: 'Imutabilidade de documentos — SignFlow',
}

const GUARANTEES = [
  {
    title: 'Hash criptográfico',
    description:
      'Cada versão de documento gera um hash SHA-256 armazenado em tabela de auditoria. O hash é assinado junto ao QR Code.',
  },
  {
    title: 'QR Code público',
    description:
      'O QR aponta para a rota /validate/{id}, onde o hash original é conferido com o arquivo enviado pelo usuário.',
  },
  {
    title: 'Trilha de auditoria',
    description:
      'Atualizações (assinatura, cancelamento, expiração) são gravadas com timestamp e autor para rastreabilidade completa.',
  },
]

export default function ImmutabilityPage() {
  return (
    <div className="max-w-4xl space-y-6 text-slate-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Imutabilidade de documentos</h1>
        <p>
          Entenda como garantimos que um documento assinado no SignFlow não sofra alteração sem que seja detectado.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {GUARANTEES.map(item => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Validação</h2>
        <p>
          Ao acessar a rota de validação, o sistema recalcula o hash do PDF enviado e compara com o valor armazenado no
          Supabase. Qualquer divergência marca o documento como inválido.
        </p>
        <p>
          Além disso, cancelamentos registram o timestamp e o motivo, impedindo novas validações e informando usuários
          finais.
        </p>
      </section>
    </div>
  )
}
