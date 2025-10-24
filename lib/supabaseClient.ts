'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createFallbackClient(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    console.warn(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não estão configuradas. Recursos que dependem do Supabase ficarão indisponíveis.'
    )
  }

  const handler: ProxyHandler<SupabaseClient<Database>> = {
    get() {
      throw new Error(
        'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar a autenticação.'
      )
    },
  }

  return new Proxy({} as SupabaseClient<Database>, handler)
}

export const supabase: SupabaseClient<Database> =
  url && anonKey ? createClient<Database>(url, anonKey) : createFallbackClient()
