// app/(marketing)/faq/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'Geral',
      questions: [
        {
          q: 'O que é o SignFlow?',
          a: 'O SignFlow é uma plataforma de assinatura digital que permite assinar documentos de forma segura, rápida e juridicamente válida. Nossa solução utiliza criptografia avançada e está em conformidade com a legislação brasileira (MP 2.200-2/2001 e ICP-Brasil).'
        },
        {
          q: 'As assinaturas do SignFlow têm validade jurídica?',
          a: 'Sim! Nossas assinaturas seguem os padrões da Medida Provisória 2.200-2/2001 e são compatíveis com ICP-Brasil. Para documentos que exigem certificação digital qualificada, recomendamos usar certificados A1/A3.'
        },
        {
          q: 'Quanto custa usar o SignFlow?',
          a: 'Oferecemos um plano gratuito com funcionalidades básicas e planos pagos para uso empresarial. Entre em contato para conhecer nossos planos corporativos.'
        },
      ]
    },
    {
      category: 'Segurança',
      questions: [
        {
          q: 'Como o SignFlow protege meus documentos?',
          a: 'Utilizamos criptografia SHA-256 para hash de documentos, HTTPS/TLS para transmissão, e armazenamento seguro em cloud com backup. Todos os acessos são registrados em logs de auditoria.'
        },
        {
          q: 'Quem pode acessar meus documentos?',
          a: 'Apenas você e pessoas com quem você compartilha o link de validação podem acessar seus documentos. Nossa equipe não tem acesso ao conteúdo dos seus arquivos.'
        },
        {
          q: 'Por quanto tempo meus documentos ficam armazenados?',
          a: 'Documentos não assinados são mantidos por 7 dias. Documentos assinados permanecem enquanto sua conta estiver ativa. Você pode excluir documentos a qualquer momento.'
        },
      ]
    },
    {
      category: 'Funcionalidades',
      questions: [
        {
          q: 'Quais formatos de arquivo são suportados?',
          a: 'Atualmente suportamos apenas arquivos PDF. As imagens de assinatura devem estar em formato PNG ou JPG.'
        },
        {
          q: 'Qual o tamanho máximo de arquivo?',
          a: 'O limite é de 20 MB para PDFs e 5 MB para imagens de assinatura.'
        },
        {
          q: 'Posso assinar múltiplos documentos de uma vez?',
          a: 'Sim! Oferecemos a funcionalidade de assinatura em lote (batch signing) para assinar vários documentos simultaneamente.'
        },
        {
          q: 'Como funciona a validação de documentos?',
          a: 'Cada documento assinado recebe um QR Code único. Qualquer pessoa pode escanear o QR Code ou acessar o link de validação para verificar a autenticidade do documento, data de assinatura e signatários.'
        },
      ]
    },
    {
      category: 'Assinatura',
      questions: [
        {
          q: 'Como criar uma assinatura digital?',
          a: 'Você pode desenhar sua assinatura diretamente na plataforma, fazer upload de uma imagem ou digitar seu nome. Recomendamos usar uma imagem clara e legível da sua assinatura manuscrita.'
        },
        {
          q: 'Posso usar diferentes assinaturas para diferentes documentos?',
          a: 'Sim! Você pode fazer upload de múltiplas assinaturas e escolher qual usar em cada documento.'
        },
        {
          q: 'É possível ter múltiplos signatários?',
          a: 'Sim! Você pode adicionar múltiplos signatários ao documento e definir a ordem de assinatura (workflow sequencial ou paralelo).'
        },
      ]
    },
    {
      category: 'Conformidade',
      questions: [
        {
          q: 'O SignFlow está em conformidade com a LGPD?',
          a: 'Sim! Seguimos rigorosamente a Lei Geral de Proteção de Dados (LGPD). Veja nossa Política de Privacidade para detalhes sobre como tratamos seus dados.'
        },
        {
          q: 'Vocês oferecem certificado digital ICP-Brasil?',
          a: 'Atualmente oferecemos assinaturas digitais seguras. Para certificados ICP-Brasil (e-CPF, e-CNPJ), estamos trabalhando em integrações com autoridades certificadoras.'
        },
        {
          q: 'Como funciona a auditoria de documentos?',
          a: 'Todos os eventos (upload, assinatura, validação, download) são registrados com timestamp, IP e identificação do usuário. Você pode acessar o histórico completo no dashboard.'
        },
      ]
    },
    {
      category: 'Integrações',
      questions: [
        {
          q: 'O SignFlow tem API?',
          a: 'Sim! Oferecemos API REST para integração com seus sistemas. Também temos webhooks para notificações em tempo real de eventos.'
        },
        {
          q: 'Posso integrar com Zapier?',
          a: 'Sim! Através de webhooks você pode conectar o SignFlow com Zapier, Make.com e outras ferramentas de automação.'
        },
        {
          q: 'Como recebo notificações de documentos assinados?',
          a: 'Você pode configurar webhooks para receber notificações HTTP quando documentos forem assinados, validados ou outros eventos ocorrerem.'
        },
      ]
    },
    {
      category: 'Suporte',
      questions: [
        {
          q: 'Como entrar em contato com o suporte?',
          a: 'Você pode nos contatar por e-mail (suporte@signflow.com) ou através do formulário de contato. Respondemos em até 24 horas úteis.'
        },
        {
          q: 'Oferecem treinamento?',
          a: 'Para contas corporativas, oferecemos onboarding e treinamento da equipe. Entre em contato para agendar.'
        },
        {
          q: 'Posso usar o SignFlow no celular?',
          a: 'Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em smartphones e tablets.'
        },
      ]
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-brand-600">
              SignFlow
            </Link>
            <nav className="flex gap-4">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-brand-600">
                Início
              </Link>
              <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-brand-600">
                Sobre
              </Link>
              <Link href="/faq" className="text-sm font-medium text-brand-600">
                FAQ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Perguntas Frequentes
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Encontre respostas para as dúvidas mais comuns sobre o SignFlow
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-2xl font-bold text-slate-900">{section.category}</h2>
              <div className="mt-4 space-y-2">
                {section.questions.map((faq, questionIndex) => {
                  const currentIndex = globalIndex++;
                  const isOpen = openIndex === currentIndex;

                  return (
                    <div
                      key={questionIndex}
                      className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFAQ(currentIndex)}
                        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
                      >
                        <span className="font-semibold text-slate-900">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 flex-shrink-0 text-brand-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-brand-600 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Não encontrou sua resposta?</h2>
          <p className="mt-2 text-brand-100">
            Entre em contato conosco e teremos prazer em ajudar!
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-600 transition hover:bg-slate-100"
            >
              Fale Conosco
            </Link>
            <Link
              href="mailto:suporte@signflow.com"
              className="rounded-xl border-2 border-white px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Enviar E-mail
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-8 text-sm text-slate-600">
            <Link href="/about" className="hover:text-brand-600">Sobre</Link>
            <Link href="/terms" className="hover:text-brand-600">Termos</Link>
            <Link href="/privacy" className="hover:text-brand-600">Privacidade</Link>
            <Link href="/contact" className="hover:text-brand-600">Contato</Link>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SignFlow. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
