import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import forge from 'node-forge'
import type { GenerateCertificatePayload } from '@/types/certificates'

/**
 * API: Gerar Certificado Auto-Assinado (Self-Signed)
 * Método: POST
 * Body: GenerateCertificatePayload
 * 
 * Gera um par de chaves RSA + certificado X.509 auto-assinado
 * Empacota em formato PKCS#12 (.p12)
 * Armazena no Supabase Storage criptografado
 */
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
      .eq('user_id', session.user.id)
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
      workers: -1, // Usar todos os workers disponíveis
    })

    console.log('✅ Par de chaves gerado com sucesso')

    // 2. Criar certificado X.509
    const cert = forge.pki.createCertificate()
    cert.publicKey = keypair.publicKey
    cert.serialNumber = '01' + crypto.randomBytes(8).toString('hex')
    
    // Validade
    const validityYears = payload.validity_years || 5
    const now = new Date()
    cert.validity.notBefore = now
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(now.getFullYear() + validityYears)

    // 3. Subject (titular do certificado)
    const subjectData = payload.subject_data || {}
    const subjectAttrs = [
      { name: 'commonName', value: subjectData.commonName || profile.profile_name },
      { name: 'organizationName', value: subjectData.organizationName || profile.organization || 'SignFlow' },
      { name: 'countryName', value: subjectData.country || 'BR' },
    ]

    if (subjectData.emailAddress || session.user.email) {
      subjectAttrs.push({
        name: 'emailAddress',
        value: subjectData.emailAddress || session.user.email || '',
      })
    }

    if (subjectData.locality) {
      subjectAttrs.push({ name: 'localityName', value: subjectData.locality })
    }

    if (subjectData.state) {
      subjectAttrs.push({ name: 'stateOrProvinceName', value: subjectData.state })
    }

    cert.setSubject(subjectAttrs)
    cert.setIssuer(subjectAttrs) // Auto-assinado (issuer = subject)

    // 4. Extensões do certificado
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: false,
        clientAuth: true,
        codeSigning: false,
        emailProtection: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ])

    // 5. Assinar o certificado (self-signed)
    cert.sign(keypair.privateKey, forge.md.sha256.create())

    console.log('✅ Certificado X.509 criado e assinado')

    // 6. Criar PKCS#12 (.p12)
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keypair.privateKey,
      cert,
      payload.password,
      {
        algorithm: '3des', // Algoritmo de criptografia
        friendlyName: payload.certificate_name,
      }
    )

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const p12Buffer = Buffer.from(p12Der, 'binary')

    console.log('✅ PKCS#12 gerado:', p12Buffer.length, 'bytes')

    // 7. Upload para Supabase Storage
    const fileName = `${session.user.id}/${crypto.randomUUID()}.p12`
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

    // 8. Criptografar senha (AES-256)
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

    // 9. Desativar outros certificados ativos
    await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', session.user.id)

    // 10. Salvar no banco de dados
    const { data: newCert, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: session.user.id,
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
      
      // Tentar deletar o arquivo do storage
      await supabase.storage.from('certificates').remove([uploadData.path])
      
      return NextResponse.json(
        { error: 'Erro ao salvar certificado no banco: ' + dbError.message },
        { status: 500 }
      )
    }

    console.log('✅ Certificado salvo no banco:', newCert.id)

    return NextResponse.json({
      success: true,
      certificate: newCert,
      message: 'Certificado gerado com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao gerar certificado:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar certificado: ' + (error instanceof Error ? error.message : 'Erro desconhecido') 
      },
      { status: 500 }
    )
  }
}
