import Link from 'next/link'

export const metadata = {
  title: 'Segurança e conformidade — SignFlow',
}

export default function SecurityPage() {
  return (
    <div className="max-w-3xl space-y-6 text-slate-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Segurança e conformidade</h1>
        <p>
          Operamos com práticas rígidas de segurança para proteger documentos assinados digitalmente e dados pessoais
          sensíveis.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Camadas de proteção</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Criptografia AES-256 em repouso e TLS 1.3 em trânsito.</li>
          <li>Controle de acesso baseado em papéis (RBAC) integrado ao Supabase.</li>
          <li>Monitoramento contínuo de anomalias com trilhas de auditoria completas.</li>
          <li>Backups automáticos com retenção georredundante.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Conformidade</h2>
        <p>
          Adequação às normas LGPD, ICP-Brasil e ISO 27001. Logs de auditoria podem ser exportados para comprovação em
          fiscalizações.
        </p>
        <p>
          Consulte também nossa documentação sobre{' '}
          <Link className="text-brand-600 underline" href="/docs/immutability">
            imutabilidade de documentos
          </Link>{' '}
          para entender como preservamos a integridade dos arquivos.
        </p>
      </section>
    </div>
  )
}
