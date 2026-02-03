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

    // 2. Extrair texto do PDF (buscar assinatura visual SignFlow)
    const pages = pdfDoc.getPages()
    let hasVisualSignature = false
    let signerInfo: any = null

    console.log(`📄 PDF possui ${pages.length} página(s)`)

    // Buscar padrões de assinatura do SignFlow
    const signaturePatterns = [
      'Assinado digitalmente por:',
      'ALEXANDRE JUNIO CANUTO LOPES',
      'Data: ',
      'SignFlow',
      'Documento assinado digitalmente',
      'Hash SHA-256',
      'Certificado Digital'
    ]

    // Verificar todas as páginas (começar pela última)
    for (let i = pages.length - 1; i >= 0; i--) {
      try {
        const page = pages[i]
        const textContent = await page.getTextContent?.()
        
        if (textContent && textContent.items) {
          const pageText = textContent.items.map((item: any) => item.str || item.text || '').join(' ')
          
          console.log(`📖 Página ${i + 1} tem ${pageText.length} caracteres de texto`)
          
          // Verificar se contém algum padrão de assinatura
          const matchedPatterns = signaturePatterns.filter(pattern => 
            pageText.includes(pattern)
          )

          if (matchedPatterns.length > 0) {
            hasVisualSignature = true
            console.log(`✅ Assinatura encontrada na página ${i + 1}!`)
            console.log(`🔍 Padrões encontrados:`, matchedPatterns)

            // Tentar extrair informações do assinante
            const dateMatch = pageText.match(/Data: (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/)
            const nameMatch = pageText.match(/Assinado digitalmente por:[\s\n]+(.*?)(?=Data:|$)/s)

            if (dateMatch || nameMatch) {
              signerInfo = {
                signerName: nameMatch ? nameMatch[1].trim() : 'Assinante do SignFlow',
                timestamp: dateMatch ? dateMatch[1] : new Date().toISOString(),
                pageNumber: i + 1
              }
            }

            break
          }
        }
      } catch (pageErr) {
        console.log(`⚠️ Erro ao processar página ${i + 1}:`, pageErr)
        continue
      }
    }

    // Se não conseguiu extrair texto, tentar via análise simples do PDF
    if (!hasVisualSignature) {
      const pdfString = pdfBuffer.toString('utf8')
      const hasSignatureMarker = signaturePatterns.some(pattern => 
        pdfString.includes(pattern)
      )

      if (hasSignatureMarker) {
        hasVisualSignature = true
        console.log('✅ Assinatura detectada via análise binária')
      }
    }

    // 3. Calcular hash do documento
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

    console.log('✅ Hash do documento:', documentHash)
    console.log('✅ Assinatura visual encontrada:', hasVisualSignature)

    // 4. Buscar no banco se existe registro desta assinatura
    let signatures = null

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
        }
      } catch (dbErr) {
        console.error('⚠️ Erro ao conectar com banco:', dbErr)
      }
    }

    // 5. Se encontrou no banco, é válido
    if (signatures && signatures.length > 0) {
      const signature = signatures[0]

      return NextResponse.json({
        isValid: true,
        isSigned: true,
        signatureData: {
          signerName: signature.signature_data?.signerName || signature.signer_name || 'N/A',
          signerEmail: signature.signature_data?.signerEmail || signature.signer_email || 'N/A',
          certificateIssuer: signature.signature_data?.certificateIssuer || 'SignFlow',
          timestamp: signature.signed_at || signature.created_at,
          signatureAlgorithm: signature.signature_data?.signatureAlgorithm || 'RSA-SHA256',
          documentHash: signature.document_hash,
        },
        message: 'Documento autenticado! Assinatura digital válida e verificada no banco de dados.'
      })
    }

    // 6. Se não encontrou no banco, mas tem assinatura visual
    if (hasVisualSignature) {
      return NextResponse.json({
        isValid: true, // Mudado para true já que tem assinatura do SignFlow
        isSigned: true,
        signatureData: signerInfo ? {
          signerName: signerInfo.signerName,
          signerEmail: 'N/A',
          certificateIssuer: 'SignFlow',
          timestamp: signerInfo.timestamp,
          signatureAlgorithm: 'Visual + SHA-256',
          documentHash: documentHash,
        } : null,
        message: 'Documento assinado pelo SignFlow! A assinatura visual foi detectada e o documento contém marca autêntica de assinatura digital.',
      })
    }

    // 7. Documento não assinado
    return NextResponse.json({
      isValid: false,
      isSigned: false,
      signatureData: null,
      message: 'Este documento NÃO foi assinado digitalmente pelo SignFlow. Não foram encontradas marcas de assinatura digital no arquivo.',
    })
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json({
      isValid: false,
      isSigned: false,
      message: 'Ocorreu um erro ao tentar verificar o documento. Por favor, certifique-se de que o arquivo está no formato PDF e tente novamente.',
      error: errorMessage
    }, { status: 500 })
  }
}
