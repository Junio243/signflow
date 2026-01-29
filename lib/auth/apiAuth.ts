// lib/auth/apiAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Auth] Missing Supabase credentials');
}

export interface AuthResult {
  user: any | null;
  error: NextResponse | null;
}

/**
 * Require authentication for API routes
 * Returns user object if authenticated, or error response
 * 
 * @example
 * export async function POST(req: NextRequest) {
 *   const auth = await requireAuth(req);
 *   if (auth.error) return auth.error;
 *   const user = auth.user;
 *   // ... rest of your code
 * }
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // Check for authorization header
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Não autorizado. Token de autenticação necessário.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Serviço de autenticação indisponível.' },
        { status: 503 }
      ),
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Token inválido ou expirado.' },
          { status: 401 }
        ),
      };
    }

    return { user, error: null };
  } catch (e) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Erro ao validar autenticação.' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Optional authentication - doesn't block if no auth provided
 * Useful for endpoints that work differently for authenticated users
 */
export async function optionalAuth(req: NextRequest): Promise<{ user: any | null }> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
    return { user: null };
  }

  try {
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    return { user: user || null };
  } catch {
    return { user: null };
  }
}
