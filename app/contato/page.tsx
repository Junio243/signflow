import Link from 'next/link'

export const metadata = {
  title: 'Contato — SignFlow',
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl space-y-6 text-slate-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Contato</h1>
        <p>Fale com nossa equipe comercial ou de suporte técnico.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Suporte</h2>
          <p className="mt-2 text-sm text-slate-600">
            Acompanhe incidentes, dúvidas de integração e solicitações sobre validação de documentos.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>E-mail: <a className="text-brand-600 underline" href="mailto:suporte@signflow.dev">suporte@signflow.dev</a></li>
            <li>Horário: 08h às 18h (Brasília) em dias úteis.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Comercial</h2>
          <p className="mt-2 text-sm text-slate-600">
            Demonstrações, propostas personalizadas e integrações corporativas.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              E-mail: <a className="text-brand-600 underline" href="mailto:vendas@signflow.dev">vendas@signflow.dev</a>
            </li>
            <li>Telefone: (61) 0000-0000</li>
          </ul>
        </article>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Recursos úteis</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            <Link className="text-brand-600 underline" href="/security">
              Política de segurança e privacidade
            </Link>
          </li>
          <li>
            <Link className="text-brand-600 underline" href="/docs/immutability">
              Documentação técnica de imutabilidade
            </Link>
          </li>
          <li>
            <Link className="text-brand-600 underline" href="/status">
              Status operacional da plataforma
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
