// lib/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/** Retorna o client ADMIN do Supabase no servidor (criado sob demanda). */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    // Importante: não criar o client na importação do módulo.
    // Só aqui dentro e, se faltar env, erro claro em runtime (não no build).
    throw new Error(
      'Faltam variáveis do Supabase: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE'
    );
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
