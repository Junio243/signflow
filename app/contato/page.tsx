'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Send, CheckCircle, Building2, Users, Zap, Shield, Clock, Globe } from 'lucide-react'

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    employees: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular envio (aqui você conectaria com sua API de e-mail)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSubmitted(true)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Mensagem Enviada!
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Recebemos sua solicitação e nossa equipe entrará em contato em até 24 horas úteis.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">
              Fale com Nossa Equipe
            </h1>
            <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
              Entre em contato para soluções enterprise, dúvidas, suporte ou parcerias
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulário */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Envie sua Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="joao@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nome da Empresa (opcional)"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                  Mensagem *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Como podemos ajudar?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar Mensagem
                  </>
                )}
              </button>

              <p className="text-sm text-slate-600 text-center">
                Ao enviar, você concorda com nossa{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidade
                </Link>
              </p>
            </form>
          </div>

          {/* Informações e Canais */}
          <div className="space-y-8">
            {/* Canais de Contato */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Nossos Canais
              </h3>
              <div className="space-y-6">
                {/* Suporte */}
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">Suporte Técnico</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Dúvidas técnicas, incidentes e validação de documentos
                    </p>
                    <a href="mailto:suporte@signflow.dev" className="text-blue-600 hover:underline text-sm font-medium">
                      suporte@signflow.dev
                    </a>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>08h às 18h (Brasília) em dias úteis</span>
                    </div>
                  </div>
                </div>

                {/* Comercial */}
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <div className="rounded-xl bg-green-100 p-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">Vendas</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Demonstrações, propostas e planos Enterprise
                    </p>
                    <a href="mailto:vendas@signflow.dev" className="text-green-600 hover:underline text-sm font-medium block">
                      vendas@signflow.dev
                    </a>
                    <a href="tel:+556140007000" className="text-green-600 hover:underline text-sm font-medium">
                      (61) 4000-7000
                    </a>
                  </div>
                </div>

                {/* Escritório */}
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-purple-100 p-3">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">Escritório</h4>
                    <p className="text-sm text-slate-600">
                      Av. Paulista, 1000<br />
                      São Paulo, SP - CEP 01310-100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Links Úteis */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Recursos Úteis
              </h3>
              <div className="space-y-3">
                <Link
                  href="/docs/immutability"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="rounded-lg bg-blue-50 p-2 group-hover:bg-blue-100 transition-colors">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Documentação Técnica</p>
                    <p className="text-xs text-slate-600">Guias e referências da API</p>
                  </div>
                </Link>
                <Link
                  href="/security"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="rounded-lg bg-green-50 p-2 group-hover:bg-green-100 transition-colors">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Segurança e Privacidade</p>
                    <p className="text-xs text-slate-600">Políticas e conformidade</p>
                  </div>
                </Link>
                <Link
                  href="/status"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="rounded-lg bg-purple-50 p-2 group-hover:bg-purple-100 transition-colors">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Status da Plataforma</p>
                    <p className="text-xs text-slate-600">Monitoramento em tempo real</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Interessado no Plano Enterprise?
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">Solução personalizada para sua empresa</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">Suporte dedicado 24/7</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100">SLA garantido de 99.9%</p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="block w-full text-center bg-white text-blue-600 font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Ver Planos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
