import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import forge from 'node-forge'

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const payload = await request.json()

    if (!payload.certificate_type || !payload.certificate_name || !payload.password) {
      return NextResponse.json(
        { error: 'Tipo de certificado, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (payload.password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    console.log('🔑 Gerando certificado para:', user.id)

    // Generate RSA keypair
    const keyStrength = payload.algorithm === 'RSA-4096' ? 4096 : 2048
    const keypair = forge.pki.rsa.generateKeyPair({
      bits: keyStrength,
      workers: -1,
    })

    // Create X.509 certificate
    const cert = forge.pki.createCertificate()
    cert.publicKey = keypair.publicKey
    cert.serialNumber = '01' + crypto.randomBytes(8).toString('hex')
    
    const validityYears = payload.validity_years || 1
    const now = new Date()
    cert.validity.notBefore = now
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(now.getFullYear() + validityYears)

    // Prepare subject attributes based on certificate type and subject_data
    const subjectData = payload.subject_data || {}
    const subjectAttrs: any[] = [
      { name: 'countryName', value: 'BR' },
    ]

    if (payload.certificate_type === 'e-CPF') {
      subjectAttrs.push({ name: 'commonName', value: subjectData.fullName || 'e-CPF User' })
      if (subjectData.email) {
        subjectAttrs.push({ name: 'emailAddress', value: subjectData.email })
      }
      if (subjectData.cpf) {
        subjectAttrs.push({ name: 'serialNumber', value: subjectData.cpf.replace(/\D/g, '') })
      }
      if (subjectData.address?.city) {
        subjectAttrs.push({ name: 'localityName', value: subjectData.address.city })
      }
      if (subjectData.address?.state) {
        subjectAttrs.push({ name: 'stateOrProvinceName', value: subjectData.address.state })
      }
      if (subjectData.profession) {
        subjectAttrs.push({ name: 'organizationName', value: subjectData.profession })
      } else {
        subjectAttrs.push({ name: 'organizationName', value: 'SignFlow' })
      }
      subjectAttrs.push({ name: 'organizationalUnitName', value: 'Pessoa Física' })
    } else if (payload.certificate_type === 'e-CNPJ') {
      subjectAttrs.push({ name: 'commonName', value: subjectData.companyName || 'e-CNPJ Company' })
      subjectAttrs.push({ name: 'organizationName', value: subjectData.companyName || 'Company' })
      if (subjectData.businessEmail) {
        subjectAttrs.push({ name: 'emailAddress', value: subjectData.businessEmail })
      }
      if (subjectData.cnpj) {
        subjectAttrs.push({ name: 'serialNumber', value: subjectData.cnpj.replace(/\D/g, '') })
      }
      if (subjectData.address?.city) {
        subjectAttrs.push({ name: 'localityName', value: subjectData.address.city })
      }
      if (subjectData.address?.state) {
        subjectAttrs.push({ name: 'stateOrProvinceName', value: subjectData.address.state })
      }
      subjectAttrs.push({ name: 'organizationalUnitName', value: 'Pessoa Jurídica' })
    }

    cert.setSubject(subjectAttrs)
    cert.setIssuer([
      { name: 'commonName', value: 'SignFlow CA' },
      { name: 'organizationName', value: 'SignFlow' },
      { name: 'countryName', value: 'BR' },
    ])

    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, keyEncipherment: true },
      { name: 'extKeyUsage', serverAuth: false, clientAuth: true, codeSigning: false, emailProtection: true },
      { name: 'subjectKeyIdentifier' },
    ])

    cert.sign(keypair.privateKey, forge.md.sha256.create())

    // Create PKCS#12
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keypair.privateKey,
      cert,
      payload.password,
      { algorithm: '3des', friendlyName: payload.certificate_name }
    )

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const p12Buffer = Buffer.from(p12Der, 'binary')

    console.log('✅ PKCS#12 gerado:', p12Buffer.length, 'bytes')

    // Upload to storage
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

    // Encrypt password
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

    // Deactivate other certificates
    await supabase
      .from('certificates')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Save to database
    const { data: newCert, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_name: payload.certificate_name,
        certificate_type: 'auto',
        generation_method: 'auto_generated',
        key_strength: keyStrength,
        issuer: 'SignFlow CA (Self-Signed)',
        certificate_path: uploadData.path,
        encrypted_password: encryptedPasswordWithIv,
        is_active: true,
        expires_at: cert.validity.notAfter.toISOString(),
        subject_data: payload.subject_data,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      await supabase.storage.from('certificates').remove([uploadData.path])
      return NextResponse.json(
        { error: 'Erro ao salvar certificado: ' + dbError.message },
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
      { error: 'Erro: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
