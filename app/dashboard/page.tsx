'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name?: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const nextParam = useMemo(() => sp.get('next') || '/dashboard', [sp])

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])

  // auth + login form state
  const [isLogged, setIsLogged] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authInfo, setAuthInfo] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const session = data?.session ?? null
    setIsLogged(!!session)
    setUserEmail(session?.user?.email ?? null)
    return session
  }, [])

  const fetchDocs = useCallback(async () => {
    setErrorMsg(null)
    // 1) tenta com mais colunas
    let { data, error } = await supabase
      .from('documents')
      .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name')
      .order('created_at', { ascending: false })
      .limit(100)

    // 2) fallback se faltar coluna
    if (error) {
      const msg = String(error.message || '')
      const missingCol = msg.includes('column') && (msg.includes('does not exist') || msg.includes('não existe'))
      if (missingCol) {
        const retry = await supabase
          .from('documents')
          .select('id, status, created_at, signed_pdf_url, qr_code_url')
          .order('created_at', { ascending: false })
          .limit(100)
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      setErrorMsg('Seu acesso está OK, mas não consegui listar documentos agora. Detalhe: ' + (error.message ?? 'desconhecido'))
      return
    }
    setDocs((data ?? []) as Doc[])
  }, [])

  // boot: pega sessão, carrega docs e escuta mudanças de auth
  useEffect(() => {
    let unsub: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null

    const boot = async () => {
      setLoading(true)
      await fetchSession()
      await fetchDocs()
      setLoading(false)

      unsub = supabase.auth.onAuthStateChange(async (event, session) => {
        // quando logar/deslogar em tempo real, atualiza UI e lista
        setIsLogged(!!session)
        setUserEmail(session?.user?.email ?? null)
        await fetchDocs()
      })
    }

    boot()

    // também atualiza ao focar a aba (pega sessão recente do link mágico)
    const onFocus = async () => {
      const s = await fetchSession()
      if (s) await fetchDocs()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      unsub?.data?.subscription?.unsubscribe()
    }
  }, [fetchDocs, fetchSession])

  // ===== Ações de autenticação =====
  const signInWithPassword = async () => {
    try {
      setAuthBusy(true); setAuthInfo(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setAuthInfo('Erro ao entrar: ' + error.message)
        return
      }
      setAuthInfo('Login realizado!')
      setEmail(''); setPassword('')
      // depois de logar, se o user veio pra Dashboard, fica; se veio pra criar, manda pro editor
      const next = nextParam || '/dashboard'
      router.replace(next === '/dashboard' ? '/dashboard' : next)
    } finally {
      setAuthBusy(false)
    }
  }

  const sendMagicLink = async () => {
    try {
      setAuthBusy(true); setAuthInfo(null)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
        }
      })
      if (error) {
        setAuthInfo('Erro ao enviar link: ' + error.message)
        return
      }
      setAuthInfo('Link enviado! Verifique sua caixa de entrada.')
    } finally {
      setAuthBusy(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthInfo('Você saiu da conta.')
    router.replace('/dashboard')
  }

  // ===== Navegação =====
  const handleNew = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      // leva para login e, depois de logar, volta ao editor
      router.push('/login?next=/editor')
      return
    }
    router.push('/editor')
  }

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleNew}>+ Novo documento</button>
          {isLogged ? (
            <button onClick={signOut}>Sair</button>
          ) : (
            <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Entrar
            </button>
          )}
        </div>
      </div>
      {isLogged && (
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          Logado como: {userEmail ?? 'usuário'}
        </div>
      )}

      {/* Lista */}
      {errorMsg && (
        <div style={{ padding: 12, border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 8, marginTop: 12 }}>
          <div style={{ fontWeight: 600, color: '#991b1b' }}>Seu acesso está OK, mas não consegui listar documentos agora.</div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#7f1d1d' }}>{errorMsg}</div>
          <button style={{ marginTop: 8 }} onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      )}

      {!errorMsg && (
        <>
          <div style={{ margin: '12px 0', fontSize: 12, opacity: 0.8 }}>
            {docs.length} documento(s) encontrado(s).
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Criado em</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace' }}>
                      {d.id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      {d.original_pdf_name ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      {d.status ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <a href={`/validate/${d.id}`} style={{ textDecoration: 'underline' }}>Validar</a>
                      {d.signed_pdf_url ? (
                        <a href={d.signed_pdf_url} target="_blank" style={{ textDecoration: 'underline' }}>Baixar</a>
                      ) : (
                        <span style={{ opacity: 0.6 }}>Sem PDF</span>
                      )}
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                      Nenhum documento ainda. Clique em <button onClick={handleNew} style={{ textDecoration: 'underline' }}>Novo documento</button>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Rodapé de Login — aparece apenas se NÃO logado */}
      {!isLogged && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Entrar</h2>
          <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <input
              type="password"
              placeholder="sua senha (opcional se for usar link mágico)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={signInWithPassword} disabled={authBusy || !email || !password}>Entrar com senha</button>
              <button onClick={sendMagicLink} disabled={authBusy || !email}>Enviar link mágico</button>
            </div>
            {authInfo && <div style={{ fontSize: 12, color: '#374151' }}>{authInfo}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
