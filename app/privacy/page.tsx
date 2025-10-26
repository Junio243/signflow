import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade — SignFlow',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-slate-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Política de Privacidade</h1>
        <p>
          Tratamos seus dados com segurança e transparência. Utilizamos as informações apenas para
          oferecer e aprimorar os serviços da SignFlow, seguindo a legislação vigente e as melhores
          práticas do mercado.
        </p>
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento. Nosso
          time está comprometido em garantir seus direitos de privacidade.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p>
          Para mais detalhes sobre o tratamento dos seus dados pessoais, entre em contato com o
          encarregado de proteção de dados pelo canal oficial disponível no painel da plataforma.
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
