'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)
const IconExit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 17l5-5-5-5M3 12h12" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)
const IconDownload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M6 21h12" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)

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
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [isLogged, setIsLogged] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const fetchSession = async () => {
    const { data } = await supabase.auth.getSession()
    const s = data?.session ?? null
    setIsLogged(!!s)
    setUserEmail(s?.user?.email ?? null)
    return s
  }

  const fetchDocs = async () => {
    setErrorMsg(null)
    let { data, error } = await supabase
      .from('documents')
      .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) {
      const msg = String(error.message || '')
      const missing = msg.includes('column') && (msg.includes('does not exist') || msg.includes('não existe'))
      if (missing) {
        const retry = await supabase
          .from('documents')
          .select('id, status, created_at, signed_pdf_url, qr_code_url')
          .order('created_at', { ascending: false }).limit(200)
        data = retry.data
        error = retry.error
      }
    }
    if (error) { setErrorMsg(error.message ?? 'erro desconhecido'); return }
    setDocs((data ?? []) as Doc[])
  }

  useEffect(() => {
    setLoading(true)
    fetchSession().then(() => fetchDocs().finally(() => setLoading(false)))

    // tempo real: atualiza quando INSERT/UPDATE em documents
    const chan = supabase.channel('realtime-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchDocs()
      })
      .subscribe()

    return () => { supabase.removeChannel(chan) }
  }, [])

  const handleNew = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data?.session) { router.push('/login?next=/editor'); return }
    router.push('/editor')
  }

  const handleAuth = async () => {
    const { data } = await supabase.auth.getSession()
    if (data?.session) { await supabase.auth.signOut(); router.refresh() }
    else { router.push('/login?next=/dashboard') }
  }

  if (loading) return <p style={{ padding:16 }}>Carregando…</p>

  return (
    <div style={{ maxWidth: 980, margin:'24px auto', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:22, margin:0, fontWeight:700 }}>Dashboard</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleNew} style={{ display:'inline-flex', gap:6, alignItems:'center' }}><IconPlus/> Novo</button>
          <button onClick={handleAuth} style={{ display:'inline-flex', gap:6, alignItems:'center' }}>{isLogged ? <IconExit/> : ''}{isLogged ? 'Sair' : 'Entrar'}</button>
        </div>
      </div>
      {isLogged && <div style={{ fontSize:12, opacity:.8, marginTop:4 }}>Logado como: {userEmail}</div>}

      {errorMsg && (
        <div style={{ marginTop:12, padding:12, border:'1px solid #fca5a5', background:'#fef2f2', borderRadius:8 }}>
          <div style={{ fontWeight:600, color:'#991b1b' }}>Não consegui listar documentos agora.</div>
          <div style={{ fontSize:12, marginTop:4, color:'#7f1d1d' }}>{errorMsg}</div>
          <button style={{ marginTop:8 }} onClick={()=>window.location.reload()}>Recarregar</button>
        </div>
      )}

      {!errorMsg && (
        <>
          <div style={{ margin:'12px 0', fontSize:12, opacity:.8 }}>{docs.length} documento(s) encontrado(s).</div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background:'#f9fafb' }}>
                <tr>
                  <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>ID</th>
                  <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>Nome</th>
                  <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>Status</th>
                  <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>Criado em</th>
                  <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6', fontFamily:'monospace' }}>{d.id.slice(0,8)}…</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>{d.original_pdf_name ?? '—'}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>{d.status ?? '—'}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>{new Date(d.created_at).toLocaleString()}</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6', display:'flex', gap:8 }}>
                      <a href={`/validate/${d.id}`} style={{ textDecoration:'underline' }}>Validar</a>
                      {d.signed_pdf_url ? (
                        <a href={d.signed_pdf_url} target="_blank" style={{ display:'inline-flex', gap:6, alignItems:'center', textDecoration:'underline' }}>
                          <IconDownload/> Baixar
                        </a>
                      ) : <span style={{ opacity:.6 }}>Sem PDF</span>}
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding:16, textAlign:'center', color:'#6b7280' }}>
                      Nenhum documento ainda. Clique em <button onClick={handleNew} style={{ textDecoration:'underline' }}>Novo</button>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
