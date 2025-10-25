'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErrorMsg(null)

      // 1) exige login
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) {
        setErrorMsg('Não consegui validar sua sessão. Entre novamente.')
        setLoading(false)
        return
      }
      if (!sessionData?.session) {
        router.replace('/login?next=/dashboard')
        return
      }

      // 2) tenta com conjunto completo
      let { data, error } = await supabase
        .from('documents')
        .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name')
        .order('created_at', { ascending: false })
        .limit(100)

      // 3) se der erro de coluna inexistente, re-tenta com menos campos
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
        setLoading(false)
        return
      }

      setDocs((data ?? []) as Doc[])
      setLoading(false)
    }

    run()
  }, [router])

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Dashboard</h1>

      {errorMsg && (
        <div style={{ padding: 12, border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#991b1b' }}>Seu acesso está OK, mas não consegui listar documentos agora.</div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#7f1d1d' }}>{errorMsg}</div>
          <button style={{ marginTop: 8 }} onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      )}

      {!errorMsg && (
        <>
          <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.8 }}>
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
                      Nenhum documento ainda. Vá em <a href="/editor" style={{ textDecoration: 'underline' }}>/editor</a> para assinar.
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
