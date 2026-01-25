import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabase as browserClient } from '@/lib/supabaseClient'

/**
 * Supabase client for server-side operations
 * (API routes, Server Components, etc)
 */
export async function createClient() {
  // Se já tem um client browser disponível, retorna ele
  if (browserClient) {
    return browserClient
  }
  
  // Senão, cria um novo
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anon) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSupabaseClient(url, anon)
}
