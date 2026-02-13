// app/(marketing)/about/page.tsx
import Link from 'next/link';
import { Shield, Zap, Lock, Users, CheckCircle, Award } from 'lucide-react';

export const metadata = {
  title: 'Sobre - SignFlow',
  description: 'Conheça o SignFlow: plataforma moderna de assinatura digital segura e conforme ICP-Brasil.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
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
              <Link href="/about" className="text-sm font-medium text-brand-600">
                Sobre
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-600">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Sobre o SignFlow
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Simplificando assinaturas digitais com segurança e conformidade
          </p>
        </div>
      </section>

      {/* Missão */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand-50 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-brand-600 p-3 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Nossa Missão</h2>
              <p className="mt-2 text-slate-700">
                Democratizar o acesso a assinaturas digitais seguras e juridicamente válidas,
                tornando o processo simples, rápido e acessível para todos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900">Nossos Valores</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Segurança */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Segurança</h3>
            <p className="mt-2 text-sm text-slate-600">
              Protegemos seus documentos com criptografia avançada e conformidade com ICP-Brasil.
            </p>
          </div>

          {/* Velocidade */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Velocidade</h3>
            <p className="mt-2 text-sm text-slate-600">
              Assine documentos em segundos, sem burocracias ou processos complicados.
            </p>
          </div>

          {/* Transparência */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Transparência</h3>
            <p className="mt-2 text-sm text-slate-600">
              Validação pública e rastreamento completo de todas as assinaturas.
            </p>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900">Por Que Escolher o SignFlow?</h2>
        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-slate-900">Conformidade Legal</h4>
              <p className="text-sm text-slate-600">
                Assinaturas válidas juridicamente conforme MP 2.200-2/2001 e ICP-Brasil
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-slate-900">Validação Transparente</h4>
              <p className="text-sm text-slate-600">
                QR Codes e links públicos permitem verificação instantânea de autenticidade
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-slate-900">Facilidade de Uso</h4>
              <p className="text-sm text-slate-600">
                Interface intuitiva que não exige treinamento ou conhecimento técnico
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-slate-900">Armazenamento Seguro</h4>
              <p className="text-sm text-slate-600">
                Documentos protegidos em infraestrutura com backup automático
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-slate-900">Auditoria Completa</h4>
              <p className="text-sm text-slate-600">
                Registro detalhado de todas as ações para compliance e rastreabilidade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tecnologia */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-900 p-8 text-white">
          <h2 className="text-center text-3xl font-bold">Tecnologia de Ponta</h2>
          <p className="mt-4 text-center text-slate-300">
            Desenvolvido com as melhores práticas de segurança e performance
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Segurança</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>• Criptografia SHA-256</li>
                <li>• Autenticação multifator</li>
                <li>• Rate limiting</li>
                <li>• Security headers (CSP, HSTS)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Infraestrutura</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>• Hospedagem em cloud global</li>
                <li>• Backup automático</li>
                <li>• CDN para performance</li>
                <li>• Monitoramento 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900">Pronto para Assinar Digitalmente?</h2>
        <p className="mt-4 text-lg text-slate-600">
          Comece gratuitamente e transforme a forma como você gerencia documentos
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-700"
          >
            Criar Conta Grátis
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fale Conosco
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-semibold text-slate-900">SignFlow</h3>
              <p className="mt-2 text-sm text-slate-600">
                Assinaturas digitais simples e seguras
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Empresa</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li><Link href="/about" className="hover:text-brand-600">Sobre</Link></li>
                <li><Link href="/contact" className="hover:text-brand-600">Contato</Link></li>
                <li><Link href="/faq" className="hover:text-brand-600">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Legal</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li><Link href="/terms" className="hover:text-brand-600">Termos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-brand-600">Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Suporte</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li><Link href="/faq" className="hover:text-brand-600">Central de Ajuda</Link></li>
                <li><Link href="/contact" className="hover:text-brand-600">Fale Conosco</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            <p>© {new Date().getFullYear()} SignFlow. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
