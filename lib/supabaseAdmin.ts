// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Essas variáveis precisam estar definidas na Vercel
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE!;

// Cliente admin tipado com o schema Database
export const supabaseAdmin = createClient<Database>(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type SupabaseAdmin = typeof supabaseAdmin;
