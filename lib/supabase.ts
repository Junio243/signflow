// lib/supabase.ts
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variáveis de ambiente do Supabase não configuradas: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Para uso em Client Components
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createBrowserSupabaseClient({ supabaseUrl, supabaseKey: supabaseAnonKey })
}

// Para uso em Server Components
export function createServerClient(context?: any) {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createServerSupabaseClient({ supabaseUrl, supabaseKey: supabaseAnonKey }, context)
}
