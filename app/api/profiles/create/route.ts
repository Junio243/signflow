import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateProfilePayload } from '@/types/certificates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
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

    const payload: CreateProfilePayload = await request.json()

    // Validações
    if (!payload.profile_name || !payload.profile_type) {
      return NextResponse.json(
        { error: 'Nome e tipo de perfil são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe perfil com mesmo nome
    const { data: existingProfile } = await supabase
      .from('certificate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('profile_name', payload.profile_name)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Já existe um perfil com este nome' },
        { status: 409 }
      )
    }

    // Criar perfil
    const { data: newProfile, error: createError } = await supabase
      .from('certificate_profiles')
      .insert({
        user_id: user.id,
        profile_name: payload.profile_name,
        profile_type: payload.profile_type,
        cpf_cnpj: payload.cpf_cnpj || null,
        organization: payload.organization || null,
        registration_number: payload.registration_number || null,
        is_default: payload.is_default || false,
        metadata: payload.metadata || {},
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar perfil:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar perfil: ' + createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: newProfile,
    })
  } catch (error) {
    console.error('Erro na API de criar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar perfil' },
      { status: 500 }
    )
  }
}
