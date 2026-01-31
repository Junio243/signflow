// components/HeaderClient.tsx
'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import classNames from 'classnames'
import { Building2, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Settings, User } from 'lucide-react'
// REMOVIDO: import NotificationBell from '../app/components/notifications/NotificationBell'

import { supabase } from '@/lib/supabaseClient'

type SessionUser = {
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
  { href: '/settings', label: 'Configurações', requiresAuth: true },
  { href: '/orgs', label: 'Organizações', requiresAuth: true },
  { href: '/contato', label: 'Contato', requiresAuth: false },
]

const LANDING_LINKS = [
  { href: '/#como-funciona', label: 'Como Funciona' },
  { href: '/#seguranca', label: 'Segurança' },
  { href: '/#precos', label: 'Preços' },
  { href: '/#suporte', label: 'Suporte/Ajuda' },
  { href: '/contato', label: 'Contato' },
]

export default function HeaderClient() {
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const authConfigured = Boolean(supabase)

  const fetchSession = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    setUser(data?.session?.user ?? null)
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    fetchSession()

    if (!supabase) return () => {}

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return
      if (dropdownRef.current.contains(event.target as Node)) return
      setMenuOpen(false)
    }

    window.addEventListener('click', handleClickOutside)

    return () => {
      isMounted = false
      window.removeEventListener('click', handleClickOutside)
      authListener?.subscription?.unsubscribe()
    }
  }, [fetchSession, supabase])

  useEffect(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const displayName = useMemo(() => {
    if (!user) return null
    return user.user_metadata?.full_name || user.email || 'Usuário'
  }, [user])

  const handleAuth = useCallback(async () => {
    if (!supabase) {
      alert('Serviço de autenticação indisponível. Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }
    if (user) {
      await supabase.auth.signOut()
      setMenuOpen(false)
      router.refresh()
      return
    }

    const next = encodeURIComponent('/dashboard')
    router.push(`/login?next=${next}`)
  }, [router, supabase, user])

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === '/' && href.startsWith('/#')) {
      e.preventDefault()
      const id = href.replace('/#', '')
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setMobileOpen(false)
      }
    }
  }, [pathname])

  const navLinks = useMemo(() => {
    const filteredNavLinks = user ? NAV_LINKS : NAV_LINKS.filter(link => !link.requiresAuth)

    if (pathname === '/') {
      return [...LANDING_LINKS, ...filteredNavLinks]
    }

    return filteredNavLinks
  }, [pathname, user])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900" aria-label="SignFlow - página inicial">
            <span className="rounded-md border border-slate-900 px-1.5 py-0.5 text-xs font-bold uppercase">Sign</span>
            Flow
          </Link>
        </div>

        <nav aria-label="Principal" className="hidden items-center gap-3 text-sm font-medium text-slate-700 md:flex">
          {navLinks.map(link => {
            const isActive =
              !link.href.includes('#') && (pathname === link.href || pathname.startsWith(`${link.href}/`))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={classNames(
                  'rounded-lg px-3 py-2 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                  isActive && 'bg-slate-100 text-slate-900'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {!user && pathname === '/' && (
            <Link
              href="/signup"
              className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 md:inline-flex"
            >
              Criar conta
            </Link>
          )}
          {!authConfigured && (
            <span className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
              Autenticação indisponível
            </span>
          )}
          
          {/* REMOVIDO TEMPORARIAMENTE - NotificationBell causando erro React #130 */}
          {/* {user && <NotificationBell />} */}
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <User className="h-4 w-4" aria-hidden />
                <span className="max-w-[150px] truncate text-left sm:max-w-[200px]">{displayName}</span>
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl"
                >
                  <HeaderMenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" aria-hidden />}>Meus documentos</HeaderMenuLink>
                  <HeaderMenuLink href="/settings" icon={<Settings className="h-4 w-4" aria-hidden />}>Meu perfil</HeaderMenuLink>
                  <HeaderMenuLink href="/orgs" icon={<Building2 className="h-4 w-4" aria-hidden />}>Organizações</HeaderMenuLink>
                  <button
                    type="button"
                    onClick={handleAuth}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAuth}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Entrar
            </button>
          )}
        </div>
      </div>

      {mobileOpen && (
        <>
          <div 
            className="mobile-overlay md:hidden" 
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <nav 
            className="fixed right-0 top-[65px] z-50 h-[calc(100vh-65px)] w-[280px] overflow-y-auto border-l border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-700 shadow-2xl transition-transform duration-300 ease-in-out md:hidden"
            aria-label="Menu móvel"
          >
            <ul className="flex flex-col gap-1">
              {navLinks.map(link => {
                const isActive =
                  !link.href.includes('#') && (pathname === link.href || pathname.startsWith(`${link.href}/`))
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleAnchorClick(e, link.href)}
                      className={classNames(
                        'flex min-h-[44px] items-center rounded-lg px-4 py-3 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                        isActive && 'bg-slate-100 text-slate-900 font-semibold'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
              {!user && pathname === '/' && (
                <li className="mt-4">
                  <Link
                    href="/signup"
                    className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    Criar conta
                  </Link>
                </li>
              )}
              <li className="mt-2">
                <button
                  type="button"
                  onClick={handleAuth}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-slate-700 transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  {user ? 'Sair' : 'Entrar'}
                  {user ? <LogOut className="h-4 w-4" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  )
}

function HeaderMenuLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
