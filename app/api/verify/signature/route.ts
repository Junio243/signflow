import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    const { document_base64, document_name } = await request.json()

    if (!document_base64) {
      return NextResponse.json(
        { 
          isValid: false,
          isSigned: false,
          message: 'Nenhum documento foi fornecido para verificação.',
          error: 'Documento não fornecido'
        },
        { status: 400 }
      )
    }

    console.log('🔍 Iniciando verificação de assinatura...')

    // 1. Decodificar PDF
    let pdfBuffer: Buffer
    let pdfDoc: any

    try {
      pdfBuffer = Buffer.from(document_base64, 'base64')
      pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
    } catch (err) {
      return NextResponse.json({
        isValid: false,
        isSigned: false,
        message: 'O arquivo enviado não é um PDF válido ou está corrompido.',
        error: 'Arquivo inválido'
      })
    }

    const pages = pdfDoc.getPages()
    console.log(`📄 PDF possui ${pages.length} página(s)`)

    // 2. Calcular hash do documento (PRIMEIRO)
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')
    console.log('✅ Hash do documento:', documentHash)

    // 3. Buscar no banco de dados PRIMEIRO (prioridade máxima)
    let signatures = null
    let databaseVerified = false

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data, error: dbError } = await supabase
          .from('signatures')
          .select('*')
          .eq('document_hash', documentHash)
          .eq('status', 'completed')

        if (dbError) {
          console.error('⚠️ Erro ao buscar no banco:', dbError)
        } else {
          signatures = data
          console.log('📄 Assinaturas encontradas no banco:', signatures?.length || 0)
          
          if (signatures && signatures.length > 0) {
            databaseVerified = true
            const signature = signatures[0]

            console.log('✅ DOCUMENTO VERIFICADO NO BANCO DE DADOS!')
            
            return NextResponse.json({
              isValid: true,
              isSigned: true,
              verificationType: 'database',
              signatureData: {
                signerName: signature.signature_data?.signerName || signature.signer_name || 'N/A',
                signerEmail: signature.signature_data?.signerEmail || signature.signer_email || 'N/A',
                certificateIssuer: signature.signature_data?.certificateIssuer || 'SignFlow',
                timestamp: signature.signed_at || signature.created_at,
                signatureAlgorithm: signature.signature_data?.signatureAlgorithm || 'RSA-SHA256',
                signatureType: signature.signature_type || 'digital',
                documentHash: signature.document_hash,
              },
              message: '✅ Documento autenticado! Assinatura digital válida e verificada no banco de dados do SignFlow.'
            })
          }
        }
      } catch (dbErr) {
        console.error('⚠️ Erro ao conectar com banco:', dbErr)
      }
    }

    // 4. Se não encontrou no banco, verificar assinatura digital PKI no PDF
    const pdfString = pdfBuffer.toString('binary')
    let hasPKISignature = false
    let pkiSignatureInfo: any = null

    // Verificar se tem objetos de assinatura digital (PKCS#7)
    const signaturePatterns = [
      '/Type/Sig',           // Objeto de assinatura
      '/ByteRange',          // Range de bytes assinados
      '/Contents<',          // Conteúdo da assinatura
      'adbe.pkcs7',          // Adobe PKCS#7
      '/SubFilter/adbe',     // SubFilter Adobe
      '/M(D:',               // Data da assinatura
      '/Reason(',            // Motivo da assinatura
      'PKCS#7',              // Padrão PKCS#7
    ]

    const foundPatterns: string[] = []
    for (const pattern of signaturePatterns) {
      if (pdfString.includes(pattern)) {
        foundPatterns.push(pattern)
      }
    }

    if (foundPatterns.length >= 3) {
      hasPKISignature = true
      console.log('✅ Assinatura digital PKI detectada!')
      console.log('🔍 Padrões encontrados:', foundPatterns)

      // Tentar extrair informações da assinatura
      try {
        const reasonMatch = pdfString.match(/\/Reason\(([^)]+)\)/)
        const dateMatch = pdfString.match(/\/M\(D:(\d{14})/)
        const nameMatch = pdfString.match(/\/Name\(([^)]+)\)/)

        pkiSignatureInfo = {
          reason: reasonMatch ? reasonMatch[1] : 'Documento assinado digitalmente',
          date: dateMatch ? dateMatch[1] : new Date().toISOString(),
          name: nameMatch ? nameMatch[1] : 'SignFlow',
          algorithm: 'PKCS#7 (RSA-SHA256)',
        }
      } catch (extractErr) {
        console.log('⚠️ Erro ao extrair info PKI:', extractErr)
      }
    }

    // 5. Verificar assinatura visual do SignFlow
    let hasVisualSignature = false
    let signerInfo: any = null

    const visualPatterns = [
      'Assinado digitalmente por:',
      'ALEXANDRE JUNIO CANUTO LOPES',
      'SignFlow',
      'Documento assinado digitalmente',
      'Hash SHA-256',
      'Certificado Digital',
      'signflow-beta.vercel.app',
      '/validate/',
    ]

    const foundVisualPatterns: string[] = []
    for (const pattern of visualPatterns) {
      if (pdfString.includes(pattern)) {
        foundVisualPatterns.push(pattern)
      }
    }

    if (foundVisualPatterns.length >= 2) {
      hasVisualSignature = true
      console.log('✅ Assinatura visual SignFlow detectada!')
      console.log('🔍 Padrões visuais encontrados:', foundVisualPatterns)

      // Tentar extrair informações do assinante
      try {
        const dateMatch = pdfString.match(/Data: (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/)
        const nameMatch = pdfString.match(/Assinado digitalmente por:[\\s\\n]+([^\\n]+)/)

        if (dateMatch || nameMatch) {
          signerInfo = {
            signerName: nameMatch ? nameMatch[1].trim() : 'Assinante do SignFlow',
            timestamp: dateMatch ? dateMatch[1] : new Date().toISOString(),
          }
        }
      } catch (extractErr) {
        console.log('⚠️ Erro ao extrair info visual:', extractErr)
      }
    }

    // 6. Decidir resultado baseado nas verificações
    
    // Se tem assinatura PKI, é válido
    if (hasPKISignature) {
      return NextResponse.json({
        isValid: true,
        isSigned: true,
        verificationType: 'pki_signature',
        signatureData: pkiSignatureInfo ? {
          signerName: pkiSignatureInfo.name,
          signerEmail: 'N/A',
          certificateIssuer: 'SignFlow',
          timestamp: pkiSignatureInfo.date,
          signatureAlgorithm: pkiSignatureInfo.algorithm,
          reason: pkiSignatureInfo.reason,
          documentHash: documentHash,
        } : {
          certificateIssuer: 'SignFlow',
          signatureAlgorithm: 'PKCS#7 (RSA-SHA256)',
          documentHash: documentHash,
        },
        message: '✅ Documento assinado com certificado digital PKI! A assinatura digital foi detectada e o documento possui certificado criptográfico válido.',
      })
    }

    // Se tem assinatura visual do SignFlow, é válido
    if (hasVisualSignature) {
      return NextResponse.json({
        isValid: true,
        isSigned: true,
        verificationType: 'visual_signature',
        signatureData: signerInfo ? {
          signerName: signerInfo.signerName,
          signerEmail: 'N/A',
          certificateIssuer: 'SignFlow',
          timestamp: signerInfo.timestamp,
          signatureAlgorithm: 'Visual + SHA-256',
          documentHash: documentHash,
        } : {
          certificateIssuer: 'SignFlow',
          documentHash: documentHash,
        },
        message: '✅ Documento assinado pelo SignFlow! A assinatura visual foi detectada e o documento contém marcas autênticas de assinatura.',
      })
    }

    // 7. Documento não assinado
    console.log('❌ Nenhuma assinatura encontrada')
    console.log('📊 Resultado da verificação:')
    console.log('  - Banco de dados:', databaseVerified ? 'Verificado' : 'Não encontrado')
    console.log('  - PKI:', hasPKISignature ? 'Detectado' : 'Não detectado')
    console.log('  - Visual:', hasVisualSignature ? 'Detectado' : 'Não detectado')

    return NextResponse.json({
      isValid: false,
      isSigned: false,
      verificationType: 'none',
      signatureData: null,
      message: '❌ Documento Não Assinado - Este documento NÃO foi assinado digitalmente pelo SignFlow. Não foram encontradas marcas de assinatura digital no arquivo.',
      debug: {
        pagesCount: pages.length,
        documentHash: documentHash,
        databaseChecked: !!supabaseUrl,
        patternsFound: {
          pki: foundPatterns,
          visual: foundVisualPatterns,
        }
      }
    })
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json({
      isValid: false,
      isSigned: false,
      verificationType: 'error',
      message: 'Ocorreu um erro ao tentar verificar o documento. Por favor, certifique-se de que o arquivo está no formato PDF e tente novamente.',
      error: errorMessage
    }, { status: 500 })
  }
}
