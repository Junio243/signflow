// app/(marketing)/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade - SignFlow',
  description: 'Política de Privacidade e Proteção de Dados do SignFlow conforme LGPD',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            SignFlow
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-bold text-slate-900">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-slate-600">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Esta Política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
        </p>

        <div className="prose prose-slate mt-8 max-w-none">
          <section>
            <h2>1. Informações Gerais</h2>
            <p>
              O SignFlow respeita sua privacidade e está comprometido em proteger seus dados pessoais.
              Esta política explica como coletamos, usamos, armazenamos e compartilhamos suas informações.
            </p>
          </section>

          <section>
            <h2>2. Dados Coletados</h2>
            <h3>2.1 Dados Fornecidos por Você</h3>
            <ul>
              <li><strong>Cadastro:</strong> Nome, e-mail, senha (criptografada)</li>
              <li><strong>Perfil:</strong> CPF/CNPJ, telefone, empresa (opcionais)</li>
              <li><strong>Documentos:</strong> Arquivos PDF e assinaturas que você faz upload</li>
            </ul>

            <h3>2.2 Dados Coletados Automaticamente</h3>
            <ul>
              <li><strong>Logs de Acesso:</strong> Endereço IP, navegador, data/hora</li>
              <li><strong>Cookies:</strong> Preferências e sessão de autenticação</li>
              <li><strong>Auditoria:</strong> Histórico de ações na plataforma</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul>
              <li>Fornecer e manter o serviço de assinatura digital</li>
              <li>Autenticar e autorizar acessos</li>
              <li>Processar e armazenar documentos assinados</li>
              <li>Validar autenticidade de assinaturas</li>
              <li>Melhorar a segurança e prevenir fraudes</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Comunicar sobre atualizações e suporte</li>
            </ul>
          </section>

          <section>
            <h2>4. Base Legal (LGPD)</h2>
            <p>Tratamos seus dados com base em:</p>
            <ul>
              <li><strong>Consentimento:</strong> Ao criar conta e usar o serviço</li>
              <li><strong>Execução de Contrato:</strong> Prestação do serviço de assinatura</li>
              <li><strong>Legitímo Interesse:</strong> Segurança, prevenção a fraudes</li>
              <li><strong>Obrigação Legal:</strong> Compliance e auditoria</li>
            </ul>
          </section>

          <section>
            <h2>5. Compartilhamento de Dados</h2>
            <p>Podemos compartilhar seus dados com:</p>
            <ul>
              <li><strong>Provedores de Infraestrutura:</strong> Vercel (hospedagem), Supabase (banco de dados)</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Destinatários de Documentos:</strong> Quando você compartilha documentos assinados</li>
            </ul>
            <p>
              <strong>Não vendemos</strong> seus dados pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2>6. Armazenamento e Segurança</h2>
            <h3>6.1 Localização dos Dados</h3>
            <p>
              Seus dados são armazenados em servidores localizados no Brasil e/ou nos Estados Unidos,
              conforme a infraestrutura de nossos provedores.
            </p>

            <h3>6.2 Medidas de Segurança</h3>
            <ul>
              <li>Criptografia em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de senhas (bcrypt)</li>
              <li>Hashing de documentos (SHA-256)</li>
              <li>Controles de acesso e autenticação</li>
              <li>Logs de auditoria</li>
              <li>Backup periódico</li>
            </ul>

            <h3>6.3 Retenção de Dados</h3>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para:
            </p>
            <ul>
              <li>Fornecer o serviço</li>
              <li>Cumprir obrigações legais</li>
              <li>Resolver disputas</li>
            </ul>
            <p>
              Após a exclusão da conta, dados podem ser mantidos em logs de auditoria por até 5 anos
              para fins de compliance.
            </p>
          </section>

          <section>
            <h2>7. Seus Direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul>
              <li><strong>Acesso:</strong> Solicitar cópia dos seus dados</li>
              <li><strong>Retificação:</strong> Corrigir dados inexatos</li>
              <li><strong>Exclusão:</strong> Solicitar remoção de dados (exceto quando houver base legal)</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação de Consentimento:</strong> Retirar consentimento previamente dado</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento baseado em legitímo interesse</li>
              <li><strong>Informação:</strong> Solicitar esclarecimentos sobre o tratamento</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato: <strong>privacidade@signflow.com</strong>
            </p>
          </section>

          <section>
            <h2>8. Cookies e Tecnologias Semelhantes</h2>
            <p>Utilizamos cookies para:</p>
            <ul>
              <li>Manter sua sessão autenticada</li>
              <li>Lembrar preferências</li>
              <li>Analisar uso da plataforma</li>
            </ul>
            <p>
              Você pode desabilitar cookies nas configurações do navegador, mas isso pode afetar
              funcionalidades.
            </p>
          </section>

          <section>
            <h2>9. Menores de Idade</h2>
            <p>
              O SignFlow não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados
              de crianças ou adolescentes.
            </p>
          </section>

          <section>
            <h2>10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas
              por e-mail ou aviso na plataforma.
            </p>
          </section>

          <section>
            <h2>11. Encarregado de Dados (DPO)</h2>
            <p>
              Para questões sobre proteção de dados, entre em contato com nosso Encarregado:
            </p>
            <ul>
              <li><strong>E-mail:</strong> dpo@signflow.com</li>
              <li><strong>Formulário:</strong> <Link href="/contact" className="text-brand-600 hover:underline">Fale Conosco</Link></li>
            </ul>
          </section>

          <section>
            <h2>12. Reclamações à ANPD</h2>
            <p>
              Você tem o direito de apresentar reclamações à Autoridade Nacional de Proteção de Dados (ANPD):
            </p>
            <ul>
              <li><strong>Site:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">www.gov.br/anpd</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Link href="/terms" className="text-sm font-medium text-brand-600 hover:underline">
            Termos de Uso
          </Link>
          <Link href="/about" className="text-sm font-medium text-brand-600 hover:underline">
            Sobre nós
          </Link>
          <Link href="/contact" className="text-sm font-medium text-brand-600 hover:underline">
            Contato
          </Link>
        </div>
      </main>
    </div>
  );
}
