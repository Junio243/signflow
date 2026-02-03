import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateProfilePayload } from '@/types/certificates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Criar cliente Supabase com token do usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Verificar autenticação e pegar user_id
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autenticado - token inválido' },
        { status: 401 }
      )
    }

    console.log('✅ Usuário autenticado:', user.id)

    const payload: CreateProfilePayload = await request.json()

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
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Já existe um perfil com este nome' },
        { status: 409 }
      )
    }

    // Criar perfil COM user_id explícito
    const { data: newProfile, error: createError } = await supabase
      .from('certificate_profiles')
      .insert({
        user_id: user.id, // ⚠️ IMPORTANTE: adicionar explicitamente
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

    console.log('✅ Perfil criado:', newProfile.id)

    return NextResponse.json({
      success: true,
      profile: newProfile,
    })
  } catch (error) {
    console.error('Erro na API de criar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
