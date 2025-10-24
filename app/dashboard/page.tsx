'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient' // se no seu projeto o nome for diferente, me diga

type Doc = { id: string; title?: string | null; status?: string | null; created_at?: string | null }

export default function DashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [docs, setDocs] = useState<Doc[]>([])
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        // 1) checar sessão
        const { data: sessionData, error: sErr } = await supabase.auth.getSession()
        if (sErr) {
          setInfo('Não foi possível validar sua sessão.')
          setChecking(false)
          return
        }
        if (!sessionData?.session) {
          router.replace('/login')
          return
        }

        // 2) tentar carregar documentos (se a tabela não existir, não quebrar)
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('id,title,status,created_at')
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) {
            setInfo('Seu acesso está OK, mas não consegui listar documentos agora.')
          } else {
            setDocs(data || [])
          }
        } catch {
          setInfo('Seu acesso está OK, mas não consegui listar documentos agora.')
        }
      } finally {
        setChecking(false)
      }
    }
    run()
  }, [router])

  if (checking) return <p style={{ padding: 16 }}>Carregando seu dashboard…</p>

  return (
    <div style={{ maxWidth: 860, margin: '24px auto', padding: 16 }}>
      <h1>Dashboard</h1>

      {info && <p style={{ color: 'tomato', marginTop: 8 }}>{info}</p>}

      {docs.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <p>Você ainda não possui documentos listados.</p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            (Se a lista deveria aparecer, me avise que eu ajusto a consulta para a tabela correta.)
          </p>
        </div>
      ) : (
        <ul style={{ marginTop: 16 }}>
          {docs.map(d => (
            <li key={d.id} style={{ marginBottom: 8 }}>
              <strong>{d.title || d.id}</strong>
              {d.status ? <> — {d.status}</> : null}
              {d.created_at ? <div style={{ opacity: 0.7, fontSize: 12 }}>{d.created_at}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
