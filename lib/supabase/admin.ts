// lib/supabase/admin.ts
// Cliente Supabase com service_role — apenas servidor, nunca expor ao cliente
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE

  if (!url || !key) {
    throw new Error(
      'Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE',
    )
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return cached
}
