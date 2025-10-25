// components/HeaderClient.tsx
'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import classNames from 'classnames'
import { Building2, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Settings, UserRound } from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'

type SessionUser = {
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Configurações' },
  { href: '/orgs', label: 'Organizações' },
  { href: '/contato', label: 'Contato' },
]

export default function HeaderClient() {
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setUser(data?.session?.user ?? null)
  }, [])

  useEffect(() => {
    let isMounted = true

    fetchSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const maybeSubscription: any = subscription
      maybeSubscription?.subscription?.unsubscribe?.()
      maybeSubscription?.unsubscribe?.()
    }
  }, [fetchSession])

  useEffect(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const displayName = useMemo(() => {
    if (!user) return null
    return user.user_metadata?.full_name || user.email || 'Usuário'
  }, [user])

  const handleAuth = useCallback(async () => {
    if (user) {
      await supabase.auth.signOut()
      setMenuOpen(false)
      router.refresh()
      return
    }

    const next = encodeURIComponent('/dashboard')
    router.push(`/login?next=${next}`)
  }, [router, user])

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
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
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
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <UserRound className="h-4 w-4" aria-hidden />
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
        <nav className="border-t border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:hidden" aria-label="Menu móvel">
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={classNames(
                      'flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                      isActive && 'bg-slate-100 text-slate-900'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={handleAuth}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
              >
                {user ? 'Sair' : 'Entrar'}
                {user ? <LogOut className="h-4 w-4" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          </ul>
        </nav>
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
