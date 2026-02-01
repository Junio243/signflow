'use client'

import Link from 'next/link'
import { Shield, Lock, Award } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    product: [
      { name: 'Funcionalidades', href: '/#funcionalidades' },
      { name: 'Preços', href: '/#precos' },
      { name: 'Demonstração', href: '/validate/demo' },
      { name: 'API', href: '/docs/api' }
    ],
    company: [
      { name: 'Sobre', href: '/about' },
      { name: 'Segurança', href: '/security' },
      { name: 'Status', href: '/status' },
      { name: 'Contato', href: '/contato' }
    ],
    legal: [
      { name: 'Termos de Uso', href: '/terms' },
      { name: 'Política de Privacidade', href: '/privacy' },
      { name: 'LGPD', href: '/lgpd' },
      { name: 'Certificações', href: '/certifications' }
    ]
  }

  return (
    <footer id="suporte" className="bg-gray-900 text-gray-300 border-t border-gray-800">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SignFlow</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Assinatura digital com validade jurídica e segurança ICP-Brasil.
            </p>
            
            {/* Security badges */}
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-gray-800 rounded-md border border-gray-700 text-xs font-medium flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                LGPD
              </div>
              <div className="px-3 py-1.5 bg-gray-800 rounded-md border border-gray-700 text-xs font-medium flex items-center gap-1.5">
                <Award className="w-3 h-3" />
                ISO 27001
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 text-center md:text-left">
              <p className="mb-1">
                <strong className="text-gray-300">SignFlow Serviços Digitais S.A.</strong>
              </p>
              <p className="text-xs">
                CNPJ 12.345.678/0001-99 • Av. das Nações Unidas, 1000 — São Paulo/SP
              </p>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} SignFlow. Todos os direitos reservados.
            </div>
          </div>
        </div>

        {/* Verification badge */}
        <div className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <span className="text-white font-semibold">Selo de Verificação Digital</span>
              <span className="text-gray-400 ml-2">• Certificado ICP-Brasil homologado</span>
            </div>
            <span className="text-green-500 font-bold text-lg">✓</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
