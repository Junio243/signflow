import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso — SignFlow',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-slate-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Termos de Uso</h1>
        <p>
          Ao utilizar a SignFlow você concorda com estes termos, incluindo o uso adequado da
          plataforma, o respeito às leis aplicáveis e a responsabilidade pelas ações realizadas na
          sua conta.
        </p>
        <p>
          Podemos atualizar estes termos periodicamente para refletir melhorias no serviço ou
          mudanças regulatórias. Sempre comunicaremos alterações relevantes com antecedência.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p>
          Caso tenha dúvidas sobre como utilizamos seus dados ou sobre suas obrigações como
          usuário, entre em contato com nossa equipe de suporte. Estamos disponíveis para ajudar e
          esclarecer qualquer ponto.
        </p>
      </section>
      <Link
        href="/"
        className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        ← Voltar para a página inicial
      </Link>
    </div>
  )
}
