'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)
const IconExit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 17l5-5-5-5M3 12h12" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)
const IconDownload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M6 21h12" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6l1-2h6l1 2m-1 0-1 14H9L8 6" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const IconCheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const IconClock = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 8v5l3 2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#1f2937" strokeWidth="2" fill="none"/></svg>)
const IconBan = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#7f1d1d" strokeWidth="2" fill="none"/><path d="M6 6l12 12" stroke="#7f1d1d" strokeWidth="2"/></svg>)
const IconExpired = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#92400e" strokeWidth="2" fill="none"/></svg>)

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name?: string | null
  canceled_at?: string | null
}

function statusPt(status?: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'signed': return { label: 'Assinado', icon: <IconCheck/>, color: '#065f46', bg: '#ecfdf5' }
    case 'draft': return { label: 'Rascunho', icon: <IconClock/>, color: '#1f2937', bg: '#f3f4f6' }
    case 'canceled': return { label: 'Cancelado', icon: <IconBan/>, color: '#7f1d1d', bg: '#fef2f2' }
    case 'expired': return { label: 'Expirado', icon: <IconExpired/>, color: '#92400e', bg: '#fffbeb' }
    default: return { label: status || '—', icon: null, color: '#374151', bg: '#f3f4f6' }
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [isLogged, setIsLogged] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

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
      .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, canceled_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) {
      const msg = String(error.message || '')
      const missing = msg.includes('column') && (msg.includes('does not exist') || msg.includes('não existe'))
      if (missing) {
        const retry = await supabase
          .from('documents')
          .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name')
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

    const chan = supabase.channel('realtime-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchDocs())
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

  const cancelDoc = async (doc: Doc) => {
    if (!isLogged) { router.push('/login?next=/dashboard'); return }
    if (!confirm('Tem certeza que deseja CANCELAR este documento? Essa ação marca como inválido para validação.')) return
    try {
      setActionBusyId(doc.id)
      const { error } = await supabase
        .from('documents')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', doc.id)
      if (error) alert('Erro ao cancelar: ' + error.message)
      else await fetchDocs()
    } finally {
      setActionBusyId(null)
    }
  }

  if (loading) return <p style={{ padding:16 }}>Carregando…</p>

  const btn = (children: React.ReactNode, style: any = {}) => (
    <button style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff',
      boxShadow:'0 1px 1px rgba(0,0,0,.02)', cursor:'pointer'
    , ...style}}>{children}</button>
  )

  return (
    <div style={{ maxWidth: 980, margin:'24px auto', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:22, margin:0, fontWeight:700 }}>Dashboard</h1>
        <div style={{ display:'flex', gap:8 }}>
          {btn(<><IconPlus/> Novo</>, {})}
          <div onClick={handleNew} style={{ position:'relative', marginLeft:'-86px', width:86, height:34 }} />
          {btn(<>{isLogged ? <IconExit/> : null}{isLogged ? 'Sair' : 'Entrar'}</>)}
          <div onClick={handleAuth} style={{ position:'relative', marginLeft:'-78px', width:78, height:34 }} />
        </div>
      </div>
      {isLogged && <div style={{ fontSize:12, opacity:.8, marginTop:4 }}>Logado como: {userEmail}</div>}

      {errorMsg && (
        <div style={{ marginTop:12, padding:12, border:'1px solid #fca5a5', background:'#fef2f2', borderRadius:8 }}>
          <div style={{ fontWeight:600, color:'#991b1b' }}>Não consegui listar documentos agora.</div>
          <div style={{ fontSize:12, marginTop:4, color:'#7f1d1d' }}>{errorMsg}</div>
          {btn('Recarregar')}
          <div onClick={()=>window.location.reload()} style={{ position:'relative', marginTop:'-34px', width:96, height:34 }} />
        </div>
      )}

      {!errorMsg && (
        <>
          <div style={{ margin:'12px 0', fontSize:12, opacity:.8 }}>{docs.length} documento(s) encontrado(s).</div>
          <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', background:'#fff' }}>
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
                {docs.map(d => {
                  const S = statusPt(d.status)
                  return (
                    <tr key={d.id}>
                      <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6', fontFamily:'monospace' }}>{d.id.slice(0,8)}…</td>
                      <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>{d.original_pdf_name ?? '—'}</td>
                      <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:999, color:S.color, background:S.bg }}>
                          {S.icon}{S.label}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6' }}>{new Date(d.created_at).toLocaleString()}</td>
                      <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6', display:'flex', gap:8, alignItems:'center' }}>
                        <a href={`/validate/${d.id}`} style={{ textDecoration:'underline' }}>Validar</a>
                        {d.signed_pdf_url ? (
                          <a href={d.signed_pdf_url} target="_blank" style={{ display:'inline-flex', gap:6, alignItems:'center', textDecoration:'underline' }}>
                            <IconDownload/> Baixar
                          </a>
                        ) : <span style={{ opacity:.6 }}>Sem PDF</span>}
                        {/* Cancelar: só mostra se não estiver cancelado */}
                        {(d.status || '').toLowerCase() !== 'canceled' && (
                          <button
                            onClick={()=>cancelDoc(d)}
                            disabled={actionBusyId===d.id}
                            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', border:'1px solid #fecaca', background:'#fff', color:'#b91c1c', borderRadius:8 }}
                          >
                            <IconTrash/>{actionBusyId===d.id ? 'Cancelando…' : 'Cancelar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding:16, textAlign:'center', color:'#6b7280' }}>
                      Nenhum documento ainda. Clique em{' '}
                      <button onClick={handleNew} style={{ textDecoration:'underline' }}>Novo</button>.
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
