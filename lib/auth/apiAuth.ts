import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user?: AuthenticatedUser;
  error?: NextResponse;
}

/**
 * Middleware para verificar autenticação em rotas de API
 * 
 * @param req - NextRequest object
 * @returns AuthResult com user ou error
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const auth = await requireAuth(req);
 *   if (auth.error) return auth.error;
 *   const user = auth.user!;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { 
      error: NextResponse.json(
        { error: 'Não autorizado. Token de autenticação necessário.' }, 
        { status: 401 }
      ) 
    };
  }

  const token = authHeader.substring(7);
  
  if (!token) {
    return { 
      error: NextResponse.json(
        { error: 'Token de autenticação inválido.' }, 
        { status: 401 }
      ) 
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { 
        error: NextResponse.json(
          { error: 'Token de autenticação inválido ou expirado.' }, 
          { status: 401 }
        ) 
      };
    }

    return { 
      user: {
        id: user.id,
        email: user.email,
      }
    };
  } catch (error) {
    return { 
      error: NextResponse.json(
        { error: 'Erro ao validar autenticação.' }, 
        { status: 500 }
      ) 
    };
  }
}

/**
 * Verifica se o usuário autenticado é dono do recurso
 */
export function requireOwnership(
  userId: string, 
  resourceOwnerId: string
): { allowed: boolean; error?: NextResponse } {
  if (userId !== resourceOwnerId) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Acesso negado. Você não tem permissão para este recurso.' },
        { status: 403 }
      )
    };
  }
  
  return { allowed: true };
}
