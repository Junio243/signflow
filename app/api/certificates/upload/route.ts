import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.SIGNFLOW_CERTIFICATE_PASSWORD || 'signflow-default-key-change-me'
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'

// Criptografar dados sensíveis
function encrypt(text: string): { encrypted: string; iv: string } {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex') }
}

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

    // Parse FormData
    const formData = await req.formData()
    const certificateFile = formData.get('certificate') as File
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const type = formData.get('type') as string

    // Validações
    if (!certificateFile || !name || !password) {
      return NextResponse.json(
        { error: 'Arquivo, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const validExtensions = ['.p12', '.pfx', '.pem']
    const extension = certificateFile.name.substring(certificateFile.name.lastIndexOf('.')).toLowerCase()
    if (!validExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Formato inválido. Use: ${validExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024
    if (certificateFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 5MB' },
        { status: 400 }
      )
    }

    // Ler arquivo como buffer
    const arrayBuffer = await certificateFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Converter para Base64
    const certificateBase64 = buffer.toString('base64')

    // Criptografar senha
    const { encrypted: encryptedPassword, iv } = encrypt(password)

    // Upload do arquivo para Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${certificateFile.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, buffer, {
        contentType: 'application/x-pkcs12',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao armazenar certificado' },
        { status: 500 }
      )
    }

    // Desativar outros certificados do usuário
    await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Salvar no banco de dados
    const { data: certData, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_name: name,
        certificate_type: type === 'icp-brasil' ? 'icp-brasil' : 'custom',
        certificate_base64: certificateBase64,
        encrypted_password: encryptedPassword,
        password_iv: iv,
        storage_path: uploadData.path,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      
      // Tentar deletar arquivo do storage se falhou
      await supabase.storage.from('certificates').remove([fileName])
      
      return NextResponse.json(
        { error: 'Erro ao registrar certificado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      certificate: {
        id: certData.id,
        name: certData.certificate_name,
        type: certData.certificate_type,
      },
    })
  } catch (error) {
    console.error('Erro no upload de certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
