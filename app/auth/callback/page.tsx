'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function parseHashParams() {
  // Supabase às vezes entrega tokens no fragmento (#access_token=...)
  const h = (typeof window !== 'undefined' ? window.location.hash : '') || ''
  const hash = h.startsWith('#') ? h.slice(1) : h
  const sp = new URLSearchParams(hash)
  const access_token = sp.get('access_token')
  const refresh_token = sp.get('refresh_token')
  const error = sp.get('error_description') || sp.get('error')
  return { access_token, refresh_token, error }
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [msg, setMsg] = useState('Finalizando login…')

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Erro já na URL (query string)
        const err = sp.get('error_description') || sp.get('error')
        if (err) {
          setMsg('Erro ao autenticar: ' + err)
          return
        }

        // 2) Tokens no HASH (#access_token=...)
        const { access_token, refresh_token, error: hashErr } = parseHashParams()
        if (hashErr) {
          setMsg('Erro ao autenticar: ' + hashErr)
          return
        }
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
          if (setErr) {
            setMsg('Falha ao concluir o login (hash): ' + setErr.message)
            return
          }
          const next = sp.get('next') || '/dashboard'
          router.replace(next)
          return
        }

        // 3) Código (flow OAuth/PKCE) ?code=...
        const code = sp.get('code')
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession({ code })
          if (exErr) {
            setMsg('Falha ao concluir o login (code): ' + exErr.message)
            return
          }
          const next = sp.get('next') || '/dashboard'
          router.replace(next)
          return
        }

        // 4) token_hash (Magic Link “verifyOtp”) ?token_hash=...&type=magiclink
        const token_hash = sp.get('token_hash')
        const type = (sp.get('type') || 'magiclink') as
          | 'magiclink' | 'recovery' | 'invite' | 'signup' | 'email_change'
        if (token_hash) {
          const email = sp.get('email') || undefined // alguns templates passam o email
          const { error: vErr } = await supabase.auth.verifyOtp({ type, token_hash, email })
          if (vErr) {
            setMsg('Falha ao concluir o login (token_hash): ' + vErr.message)
            return
          }
          const next = sp.get('next') || '/dashboard'
          router.replace(next)
          return
        }

        // 5) Nada reconhecido
        setMsg('Código ausente na URL. Abra o link enviado novamente.')
      } catch (e: any) {
        setMsg('Erro inesperado: ' + (e?.message || 'desconhecido'))
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ maxWidth: 520, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Entrando…</h1>
      <p>{msg}</p>
      <p style={{ fontSize: 12, color: '#6b7280' }}>
        Se isso demorar, feche e clique no link do e-mail novamente. Confirme também se o domínio do e-mail é o MESMO do site.
      </p>
    </div>
  )
}
