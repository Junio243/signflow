import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function DELETE(req: NextRequest) {
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

    // Obter ID do certificado
    const { searchParams } = new URL(req.url)
    const certificateId = searchParams.get('id')

    if (!certificateId) {
      return NextResponse.json({ error: 'ID do certificado não fornecido' }, { status: 400 })
    }

    // Buscar certificado
    const { data: cert, error: fetchError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !cert) {
      return NextResponse.json(
        { error: 'Certificado não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    // Deletar arquivo do storage
    if (cert.storage_path) {
      await supabase.storage
        .from('certificates')
        .remove([cert.storage_path])
    }

    // Deletar do banco
    const { error: deleteError } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao deletar certificado:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar certificado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao deletar certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
