'use client'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Mensagem amigável (não quebra o app)
  console.error(
    '[Supabase] Variáveis ausentes: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas Environment Variables (Production).'
  )
}

// Exporta o cliente para uso nas páginas/components do lado do cliente
export const supabase = createClient(
  url ?? '',     // valores vazios só serão usados se você tentar usar o cliente sem setar envs
  anon ?? ''
)
