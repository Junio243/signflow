import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { CreateProfilePayload } from '@/types/certificates'

export async function POST(request: NextRequest) {
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
      .eq('user_id', session.user.id)
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
        user_id: session.user.id,
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
