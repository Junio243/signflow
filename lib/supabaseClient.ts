import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (!url || !anon) {
  console.warn(
    '[Supabase] Variáveis ausentes: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas Environment Variables (Production).'
  )
} else {
  try {
    client = createClient(url, anon)
  } catch (error) {
    console.error('[Supabase] Não foi possível criar o cliente.', error)
    client = null
  }
}

// Exporta o cliente para uso nas páginas/components do lado do cliente
export const supabase = client
