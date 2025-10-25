// components/HeaderClient.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function HeaderClient() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data?.session?.user ?? null)
    })()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      // cleanup subscription: supabase v2 returns subscription or { subscription }
      if (subscription?.subscription?.unsubscribe) subscription.subscription.unsubscribe()
      if ((subscription as any)?.unsubscribe) (subscription as any).unsubscribe()
    }
  }, [])

  async function handleAuth() {
    if (user) {
      // sign out
      await supabase.auth.signOut()
      setUser(null)
      setMenuOpen(false)
      // rota de retorno
      router.refresh()
    } else {
      router.push('/login?next=/dashboard')
    }
  }

  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-indigo-600">Sign</span>Flow
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:text-indigo-600" href="/dashboard">Dashboard</Link>

          {/* link rápido para configurações do usuário */}
          <Link className="hover:text-indigo-600" href="/settings">Configurações</Link>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{ display: 'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:'#fff', border:'1px solid #e5e7eb', cursor:'pointer' }}
                aria-expanded={menuOpen}
              >
                <span style={{ fontSize:13 }}>{user.email ?? user.user_metadata?.full_name ?? 'Usuário'}</span>
                <span style={{ fontSize:12, opacity:0.7 }}>▾</span>
              </button>

              {menuOpen && (
                <div style={{
                  position:'absolute', right:0, marginTop:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 6px 18px rgba(0,0,0,0.08)', minWidth:180, zIndex:60
                }}>
                  <div style={{ padding:8, display:'grid', gap:6 }}>
                    <Link href="/settings" style={{ padding:'8px 10px', borderRadius:6, textDecoration:'none', color:'#111' }}>Meu perfil</Link>
                    <Link href="/dashboard" style={{ padding:'8px 10px', borderRadius:6, textDecoration:'none', color:'#111' }}>Meus documentos</Link>
                    <Link href="/orgs" style={{ padding:'8px 10px', borderRadius:6, textDecoration:'none', color:'#111' }}>Organizações</Link>
                    <button onClick={handleAuth} style={{ padding:'8px 10px', borderRadius:6, background:'#fff', border:'1px solid #e5e7eb', cursor:'pointer' }}>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleAuth} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, background:'#fff', border:'1px solid #e5e7eb' }}>
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
