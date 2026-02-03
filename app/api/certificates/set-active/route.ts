import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = req.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.split('sb-access-token=')[1]?.split(';')[0] || ''
    )

    if (userError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    // Parse body
    const body = await req.json()
    const { certificateId } = body

    if (!certificateId) {
      return NextResponse.json(
        { error: 'ID do certificado não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o certificado pertence ao usuário
    const { data: cert, error: fetchError } = await supabase
      .from('certificates')
      .select('id')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !cert) {
      return NextResponse.json(
        { error: 'Certificado não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    // Desativar todos os certificados do usuário
    const { error: deactivateError } = await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', user.id)

    if (deactivateError) {
      console.error('Erro ao desativar certificados:', deactivateError)
      return NextResponse.json(
        { error: 'Erro ao desativar certificados' },
        { status: 500 }
      )
    }

    // Ativar o certificado selecionado
    const { error: activateError } = await supabase
      .from('certificates')
      .update({ is_active: true })
      .eq('id', certificateId)
      .eq('user_id', user.id)

    if (activateError) {
      console.error('Erro ao ativar certificado:', activateError)
      return NextResponse.json(
        { error: 'Erro ao ativar certificado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao ativar certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
