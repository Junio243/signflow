import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const { data: profiles, error } = await supabase
      .from('certificate_profiles')
      .select('*')
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
      { error: 'Erro interno: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
