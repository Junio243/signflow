import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { extractCertificateData } from '@/lib/certificateExtractor'
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
    console.log('📝 Processando upload de certificado...');

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

    console.log('✅ Arquivo carregado, tamanho:', buffer.length);

    // NOVO: Extrair dados do certificado
    let extractedData;
    let detectedType: 'e-CPF' | 'e-CNPJ' | 'icp-brasil' | 'custom' = 'custom';
    let subjectData: any = {};
    let expiresAt: string | null = null;
    let serialNumber: string | null = null;
    let fingerprint: string | null = null;

    try {
      console.log('🔍 Extraindo dados do certificado...');
      extractedData = await extractCertificateData(buffer, password);
      
      console.log('✅ Dados extraídos:');
      console.log(`   Nome: ${extractedData.commonName}`);
      console.log(`   Tipo: ${extractedData.certificateType}`);
      if (extractedData.cpf) console.log(`   CPF: ${extractedData.cpf}`);
      if (extractedData.cnpj) console.log(`   CNPJ: ${extractedData.cnpj}`);
      console.log(`   Validade: ${extractedData.validUntil.toLocaleDateString()}`);

      // Verificar se certificado está expirado
      if (extractedData.isExpired) {
        return NextResponse.json(
          { 
            error: 'Certificado expirado', 
            details: {
              expiredAt: extractedData.validUntil.toISOString(),
              daysAgo: Math.abs(extractedData.daysRemaining)
            }
          },
          { status: 400 }
        )
      }

      // Aviso se expira em menos de 30 dias
      if (extractedData.daysRemaining <= 30) {
        console.warn(`⚠️ Certificado expira em ${extractedData.daysRemaining} dias`);
      }

      // Mapear tipo detectado
      if (extractedData.certificateType === 'e-CPF') {
        detectedType = 'e-CPF';
        subjectData = {
          fullName: extractedData.commonName,
          cpf: extractedData.cpf,
          email: extractedData.email,
          country: extractedData.country,
          state: extractedData.state,
          locality: extractedData.locality,
        };
      } else if (extractedData.certificateType === 'e-CNPJ') {
        detectedType = 'e-CNPJ';
        subjectData = {
          companyName: extractedData.organization || extractedData.commonName,
          cnpj: extractedData.cnpj,
          businessEmail: extractedData.email,
          country: extractedData.country,
          state: extractedData.state,
          locality: extractedData.locality,
          legalRepresentative: {
            fullName: extractedData.commonName,
          },
        };
      } else {
        detectedType = type === 'icp-brasil' ? 'icp-brasil' : 'custom';
        subjectData = {
          commonName: extractedData.commonName,
          email: extractedData.email,
          organization: extractedData.organization,
          organizationalUnit: extractedData.organizationalUnit,
          country: extractedData.country,
          state: extractedData.state,
          locality: extractedData.locality,
        };
      }

      expiresAt = extractedData.validUntil.toISOString();
      serialNumber = extractedData.serialNumber;
      fingerprint = extractedData.fingerprint;

    } catch (extractError) {
      console.warn('⚠️ Não foi possível extrair dados do certificado:', extractError);
      console.warn('   Continuando sem extração automática...');
      // Não bloquear upload se extração falhar
      detectedType = type === 'icp-brasil' ? 'icp-brasil' : 'custom';
    }

    // Converter para Base64
    const certificateBase64 = buffer.toString('base64')

    // Criptografar senha
    const { encrypted: encryptedPassword, iv } = encrypt(password)

    // Upload do arquivo para Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${certificateFile.name}`
    console.log('📁 Fazendo upload para storage:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, buffer, {
        contentType: 'application/x-pkcs12',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Erro ao fazer upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao armazenar certificado' },
        { status: 500 }
      )
    }

    console.log('✅ Upload para storage concluído');

    // Desativar outros certificados do usuário
    await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', user.id)

    console.log('💾 Salvando no banco de dados...');

    // Salvar no banco de dados com dados extraídos
    const { data: certData, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_name: name,
        certificate_type: detectedType,
        generation_method: 'uploaded',
        certificate_base64: certificateBase64,
        encrypted_password: encryptedPassword,
        password_iv: iv,
        certificate_path: uploadData.path,
        is_active: true,
        // NOVO: Dados extraídos
        subject_data: Object.keys(subjectData).length > 0 ? subjectData : null,
        expires_at: expiresAt,
        serial_number: serialNumber,
        fingerprint_sha256: fingerprint,
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao salvar no banco:', dbError)
      
      // Tentar deletar arquivo do storage se falhou
      await supabase.storage.from('certificates').remove([fileName])
      
      return NextResponse.json(
        { error: 'Erro ao registrar certificado' },
        { status: 500 }
      )
    }

    console.log('✅ Certificado salvo com sucesso!');
    console.log(`   ID: ${certData.id}`);
    console.log(`   Tipo: ${detectedType}`);
    if (expiresAt) {
      console.log(`   Expira em: ${new Date(expiresAt).toLocaleDateString()}`);
    }

    return NextResponse.json({
      ok: true,
      certificate: {
        id: certData.id,
        name: certData.certificate_name,
        type: certData.certificate_type,
        extractedData: extractedData ? {
          commonName: extractedData.commonName,
          cpf: extractedData.cpf,
          cnpj: extractedData.cnpj,
          email: extractedData.email,
          validUntil: extractedData.validUntil,
          daysRemaining: extractedData.daysRemaining,
          isValid: extractedData.isValid,
        } : null,
      },
    })
  } catch (error) {
    console.error('❌ Erro no upload de certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
