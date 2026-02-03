import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar perfis do usuário
    const { data: profiles, error } = await supabase
      .from('certificate_profiles')
      .select('*')
      .eq('user_id', session.user.id)
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
