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
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { certificate_id, password } = await request.json()

    if (!certificate_id || !password) {
      return NextResponse.json(
        { error: 'ID do certificado e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar certificado
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificate_id)
      .eq('user_id', user.id)
      .single()

    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }

    // Baixar arquivo .p12 do storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('certificates')
      .download(cert.certificate_path)

    if (downloadError || !fileData) {
      console.error('Erro ao baixar certificado:', downloadError)
      return NextResponse.json(
        { error: 'Erro ao acessar certificado' },
        { status: 500 }
      )
    }

    // Converter Blob para Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const p12Buffer = Buffer.from(arrayBuffer)

    // Tentar decodificar o PKCS#12 com a senha fornecida
    try {
      const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'))
      const p12Asn1 = forge.asn1.fromDer(p12Der)
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

      // Se chegou aqui, a senha está correta
      // Extrair informações do certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      const certBag = certBags[forge.pki.oids.certBag]?.[0]

      if (!certBag || !certBag.cert) {
        throw new Error('Certificado não encontrado no arquivo')
      }

      const certificate = certBag.cert
      const subject = certificate.subject.attributes
      const issuer = certificate.issuer.attributes

      return NextResponse.json({
        success: true,
        valid: true,
        certificate: {
          commonName: subject.find((a: any) => a.name === 'commonName')?.value || 'N/A',
          organization: subject.find((a: any) => a.name === 'organizationName')?.value || 'N/A',
          issuer: issuer.find((a: any) => a.name === 'commonName')?.value || 'N/A',
          serialNumber: certificate.serialNumber,
          validFrom: certificate.validity.notBefore.toISOString(),
          validTo: certificate.validity.notAfter.toISOString(),
        },
      })
    } catch (decryptError) {
      console.error('Erro ao descriptografar:', decryptError)
      return NextResponse.json(
        { 
          success: false,
          valid: false, 
          error: 'Senha incorreta ou certificado inválido' 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao validar certificado:', error)
    return NextResponse.json(
      { error: 'Erro ao validar certificado: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
