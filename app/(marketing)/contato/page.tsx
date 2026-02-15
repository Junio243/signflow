'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Send, CheckCircle, Building2, Users, Zap, Shield } from 'lucide-react'

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
              Entre em contato para soluções enterprise, dúvidas ou parcerias
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
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="joao@empresa.com.br"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                  Empresa *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nome da Empresa"
                />
              </div>

              <div>
                <label htmlFor="employees" className="block text-sm font-semibold text-slate-700 mb-2">
                  Número de Colaboradores *
                </label>
                <select
                  id="employees"
                  name="employees"
                  required
                  value={formData.employees}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="1-10">1-10 colaboradores</option>
                  <option value="11-50">11-50 colaboradores</option>
                  <option value="51-200">51-200 colaboradores</option>
                  <option value="201-500">201-500 colaboradores</option>
                  <option value="501+">Mais de 500 colaboradores</option>
                </select>
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
                  placeholder="Conte-nos sobre suas necessidades..."
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

          {/* Informações e Benefícios */}
          <div className="space-y-8">
            {/* Informações de Contato */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Outras Formas de Contato
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">E-mail</p>
                    <a href="mailto:vendas@signflow.com.br" className="text-blue-600 hover:underline">
                      vendas@signflow.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-green-100 p-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Telefone</p>
                    <a href="tel:+551140007000" className="text-green-600 hover:underline">
                      (11) 4000-7000
                    </a>
                    <p className="text-sm text-slate-600">Seg-Sex: 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-purple-100 p-3">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Escritório</p>
                    <p className="text-slate-600">
                      Av. Paulista, 1000 - São Paulo, SP<br />
                      CEP 01310-100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios Enterprise */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">
                Por que escolher o Plano Enterprise?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/20 p-2 mt-1">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Solução Personalizada</p>
                    <p className="text-blue-100 text-sm">Customizamos a plataforma para suas necessidades específicas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/20 p-2 mt-1">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Equipe Dedicada</p>
                    <p className="text-blue-100 text-sm">Gerente de conta e suporte 24/7 exclusivo para sua empresa</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/20 p-2 mt-1">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Integração Completa</p>
                    <p className="text-blue-100 text-sm">APIs avançadas e integração com seus sistemas atuais</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/20 p-2 mt-1">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Máxima Segurança</p>
                    <p className="text-blue-100 text-sm">SLA de 99.9%, compliance total e auditoria completa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empresas que Confiam */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Empresas que Confiam no SignFlow
              </h3>
              <div className="grid grid-cols-2 gap-6 items-center opacity-60">
                <div className="text-center">
                  <div className="h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-slate-400">Empresa 1</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-slate-400">Empresa 2</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-slate-400">Empresa 3</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-slate-400">Empresa 4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
