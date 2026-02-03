import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Pegar token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado - Token não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Criar cliente Supabase com o token do usuário
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado - Token inválido' },
        { status: 401 }
      )
    }

    // Buscar perfis do usuário
    const { data: profiles, error } = await supabase
      .from('certificate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao listar perfis:', error)
      return NextResponse.json(
        { error: 'Erro ao listar perfis: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
    })
  } catch (error) {
    console.error('Erro na API de listar perfis:', error)
    return NextResponse.json(
      { error: 'Erro interno ao listar perfis' },
      { status: 500 }
    )
  }
}
