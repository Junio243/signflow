'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const code = sp.get('code')
  const next = sp.get('next') || '/dashboard'
  const error = sp.get('error_description')
  const [msg, setMsg] = useState('Finalizando login…')

  useEffect(() => {
    const run = async () => {
      if (error) {
        setMsg('Erro ao autenticar: ' + error)
        return
      }
      if (!code) {
        setMsg('Código ausente na URL. Abra o link enviado novamente.')
        return
      }
      const { error: exErr } = await supabase.auth.exchangeCodeForSession({ code })
      if (exErr) {
        setMsg('Falha ao concluir o login: ' + exErr.message)
        return
      }
      router.replace(next)
    }
    run()
  }, [code, error, next, router])

  return (
    <div style={{ maxWidth: 520, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entrando…</h1>
      <p>{msg}</p>
      <p style={{ fontSize: 12, color: '#6b7280' }}>
        Se isso demorar, feche e clique no link do e-mail novamente. Verifique também se o domínio do e-mail é o mesmo do site.
      </p>
    </div>
  )
}
