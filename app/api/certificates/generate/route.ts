import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import forge from 'node-forge'
import type { GenerateCertificatePayload } from '@/types/certificates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API: Gerar Certificado Auto-Assinado (Self-Signed)
 * Método: POST
 * Body: GenerateCertificatePayload
 */
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
    
    // Criar cliente Supabase
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

    const payload: GenerateCertificatePayload = await request.json()

    // Validações
    if (!payload.profile_id || !payload.certificate_name || !payload.password) {
      return NextResponse.json(
        { error: 'Perfil, nome do certificado e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (payload.password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('certificate_profiles')
      .select('*')
      .eq('id', payload.profile_id)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    console.log('🔑 Gerando par de chaves RSA...', payload.key_strength || 2048, 'bits')

    // 1. Gerar par de chaves RSA
    const keypair = forge.pki.rsa.generateKeyPair({
      bits: payload.key_strength || 2048,
      workers: -1,
    })

    console.log('✅ Par de chaves gerado')

    // 2. Criar certificado X.509
    const cert = forge.pki.createCertificate()
    cert.publicKey = keypair.publicKey
    cert.serialNumber = '01' + crypto.randomBytes(8).toString('hex')
    
    const validityYears = payload.validity_years || 5
    const now = new Date()
    cert.validity.notBefore = now
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(now.getFullYear() + validityYears)

    // 3. Subject
    const subjectData = payload.subject_data || {}
    const subjectAttrs = [
      { name: 'commonName', value: subjectData.commonName || profile.profile_name },
      { name: 'organizationName', value: subjectData.organizationName || profile.organization || 'SignFlow' },
      { name: 'countryName', value: subjectData.country || 'BR' },
    ]

    if (subjectData.emailAddress || user.email) {
      subjectAttrs.push({
        name: 'emailAddress',
        value: subjectData.emailAddress || user.email || '',
      })
    }

    if (subjectData.locality) {
      subjectAttrs.push({ name: 'localityName', value: subjectData.locality })
    }

    if (subjectData.state) {
      subjectAttrs.push({ name: 'stateOrProvinceName', value: subjectData.state })
    }

    cert.setSubject(subjectAttrs)
    cert.setIssuer(subjectAttrs)

    // 4. Extensões
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, keyEncipherment: true },
      { name: 'extKeyUsage', serverAuth: false, clientAuth: true, codeSigning: false, emailProtection: true },
      { name: 'subjectKeyIdentifier' },
    ])

    // 5. Assinar
    cert.sign(keypair.privateKey, forge.md.sha256.create())

    console.log('✅ Certificado X.509 criado')

    // 6. Criar PKCS#12
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keypair.privateKey,
      cert,
      payload.password,
      { algorithm: '3des', friendlyName: payload.certificate_name }
    )

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const p12Buffer = Buffer.from(p12Der, 'binary')

    console.log('✅ PKCS#12 gerado:', p12Buffer.length, 'bytes')

    // 7. Upload
    const fileName = `${user.id}/${crypto.randomUUID()}.p12`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, p12Buffer, {
        contentType: 'application/x-pkcs12',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao armazenar certificado: ' + uploadError.message },
        { status: 500 }
      )
    }

    console.log('✅ Certificado armazenado:', uploadData.path)

    // 8. Criptografar senha
    const encryptionKey = process.env.CERTIFICATE_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('CERTIFICATE_ENCRYPTION_KEY não configurada')
    }

    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(encryptionKey, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encryptedPassword = cipher.update(payload.password, 'utf8', 'hex')
    encryptedPassword += cipher.final('hex')
    const encryptedPasswordWithIv = iv.toString('hex') + ':' + encryptedPassword

    // 9. Desativar outros certificados
    await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // 10. Salvar no banco
    const { data: newCert, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        profile_id: payload.profile_id,
        certificate_name: payload.certificate_name,
        certificate_type: 'auto',
        generation_method: 'auto_generated',
        key_strength: payload.key_strength || 2048,
        issuer: 'SignFlow CA (Self-Signed)',
        certificate_path: uploadData.path,
        encrypted_password: encryptedPasswordWithIv,
        is_active: true,
        expires_at: cert.validity.notAfter.toISOString(),
        subject_data: {
          commonName: subjectAttrs.find(a => a.name === 'commonName')?.value,
          organizationName: subjectAttrs.find(a => a.name === 'organizationName')?.value,
          country: subjectAttrs.find(a => a.name === 'countryName')?.value,
          emailAddress: subjectAttrs.find(a => a.name === 'emailAddress')?.value,
          cpf: profile.cpf_cnpj,
          registrationNumber: profile.registration_number,
          profession: profile.profile_type,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      await supabase.storage.from('certificates').remove([uploadData.path])
      return NextResponse.json(
        { error: 'Erro ao salvar certificado no banco: ' + dbError.message },
        { status: 500 }
      )
    }

    console.log('✅ Certificado salvo:', newCert.id)

    return NextResponse.json({
      success: true,
      certificate: newCert,
      message: 'Certificado gerado com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao gerar certificado:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar certificado: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}
