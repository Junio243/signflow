// app/(marketing)/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso - SignFlow',
  description: 'Termos de Uso e Condições Gerais do SignFlow',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-slate-900">Termos de Uso</h1>
        <p className="mt-2 text-sm text-slate-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-slate mt-8 max-w-none">
          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o SignFlow, você concorda em cumprir e estar vinculado a estes
              Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve usar
              nossa plataforma.
            </p>
          </section>

          <section>
            <h2>2. Descrição do Serviço</h2>
            <p>
              O SignFlow é uma plataforma de assinatura digital que permite aos usuários:
            </p>
            <ul>
              <li>Fazer upload de documentos em formato PDF</li>
              <li>Adicionar assinaturas digitais aos documentos</li>
              <li>Validar a autenticidade de documentos assinados</li>
              <li>Armazenar documentos assinados de forma segura</li>
            </ul>
          </section>

          <section>
            <h2>3. Cadastro e Conta</h2>
            <h3>3.1 Responsabilidades do Usuário</h3>
            <ul>
              <li>Fornecer informações precisas e atualizadas durante o cadastro</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Não compartilhar sua conta com terceiros</li>
            </ul>

            <h3>3.2 Idade Mínima</h3>
            <p>
              Você deve ter pelo menos 18 anos de idade para usar o SignFlow. Ao criar uma conta,
              você declara que atende a esse requisito.
            </p>
          </section>

          <section>
            <h2>4. Uso Aceitável</h2>
            <h3>4.1 Usos Permitidos</h3>
            <p>Você pode usar o SignFlow para:</p>
            <ul>
              <li>Assinar documentos legítimos e lícitos</li>
              <li>Gerenciar workflows de assinatura de documentos</li>
              <li>Validar autenticidade de documentos</li>
            </ul>

            <h3>4.2 Usos Proibidos</h3>
            <p>É estritamente proibido:</p>
            <ul>
              <li>Fazer upload de conteúdo ilegal, difamatório ou que viole direitos de terceiros</li>
              <li>Usar a plataforma para fraude, falsificação ou qualquer atividade ilícita</li>
              <li>Tentar burlar medidas de segurança ou acessar sistemas não autorizados</li>
              <li>Fazer engenharia reversa, descompilar ou desmontar o software</li>
              <li>Enviar spam, malware ou código malicioso</li>
              <li>Sobrecarregar a infraestrutura com uso abusivo</li>
            </ul>
          </section>

          <section>
            <h2>5. Validade Jurídica</h2>
            <p>
              As assinaturas digitais geradas pelo SignFlow seguem os padrões estabelecidos pela
              Medida Provisória 2.200-2/2001 e pela infraestrutura ICP-Brasil. No entanto, a
              validade jurídica depende do contexto de uso e da legislação aplicável.
            </p>
            <p>
              <strong>Importante:</strong> O SignFlow não fornece consultoria jurídica. Consulte um
              advogado para casos específicos.
            </p>
          </section>

          <section>
            <h2>6. Propriedade Intelectual</h2>
            <h3>6.1 Conteúdo do SignFlow</h3>
            <p>
              Todo o conteúdo, design, logos, código-fonte e materiais do SignFlow são de
              propriedade exclusiva do SignFlow e estão protegidos por leis de direitos autorais.
            </p>

            <h3>6.2 Seu Conteúdo</h3>
            <p>
              Você mantém todos os direitos sobre os documentos que faz upload. Ao usar o SignFlow,
              você nos concede uma licença limitada para processar, armazenar e exibir seus
              documentos exclusivamente para fornecer o serviço.
            </p>
          </section>

          <section>
            <h2>7. Limitações de Responsabilidade</h2>
            <p>
              O SignFlow é fornecido "como está", sem garantias de qualquer tipo. Não garantimos que:
            </p>
            <ul>
              <li>O serviço estará disponível ininterruptamente</li>
              <li>Erros serão corrigidos imediatamente</li>
              <li>O serviço atenderá suas necessidades específicas</li>
            </ul>
            <p>
              Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais
              resultantes do uso ou incapacidade de usar o serviço.
            </p>
          </section>

          <section>
            <h2>8. Privacidade e Proteção de Dados</h2>
            <p>
              O tratamento de seus dados pessoais é regido por nossa{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">
                Política de Privacidade
              </Link>
              , que faz parte integrante destes Termos.
            </p>
          </section>

          <section>
            <h2>9. Modificações do Serviço</h2>
            <p>
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do
              SignFlow a qualquer momento, com ou sem aviso prévio.
            </p>
          </section>

          <section>
            <h2>10. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, se você
              violar estes Termos. Você pode encerrar sua conta a qualquer momento entrando em
              contato conosco.
            </p>
          </section>

          <section>
            <h2>11. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas
              no foro da comarca de São Paulo/SP.
            </p>
          </section>

          <section>
            <h2>12. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos, entre em contato:
            </p>
            <ul>
              <li>E-mail: suporte@signflow.com</li>
              <li>
                Formulário:{' '}
                <Link href="/contact" className="text-brand-600 hover:underline">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Link
            href="/privacy"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Política de Privacidade
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Sobre nós
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Contato
          </Link>
        </div>
      </main>
    </div>
  );
}
