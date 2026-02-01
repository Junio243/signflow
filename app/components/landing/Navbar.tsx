'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
            <span className="text-lg font-bold text-white">SF</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-50">SignFlow</span>
            <span className="text-[10px] text-cyan-300">Assinatura digital</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <Link href="#recursos" className="hover:text-cyan-300 transition-colors">
            Recursos
          </Link>
          <Link href="#como-funciona" className="hover:text-cyan-300 transition-colors">
            Como funciona
          </Link>
          <Link href="/docs" className="hover:text-cyan-300 transition-colors">
            Documentação
          </Link>
          <Link href="/contato" className="hover:text-cyan-300 transition-colors">
            Suporte
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden text-sm text-slate-300 hover:text-white transition-colors md:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105"
          >
            Criar conta
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/50 backdrop-blur px-4 py-4">
          <nav className="flex flex-col gap-4 text-sm text-slate-300">
            <Link href="#recursos" className="hover:text-cyan-300 transition-colors py-2">
              Recursos
            </Link>
            <Link href="#como-funciona" className="hover:text-cyan-300 transition-colors py-2">
              Como funciona
            </Link>
            <Link href="/docs" className="hover:text-cyan-300 transition-colors py-2">
              Documentação
            </Link>
            <Link href="/contato" className="hover:text-cyan-300 transition-colors py-2">
              Suporte
            </Link>
            <hr className="border-white/10 my-2" />
            <Link href="/auth/login" className="hover:text-cyan-300 transition-colors py-2">
              Entrar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
