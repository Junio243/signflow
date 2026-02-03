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
      pdfDoc = await PDFDocument.load(pdfBuffer)
    } catch (err) {
      return NextResponse.json({
        isValid: false,
        isSigned: false,
        message: 'O arquivo enviado não é um PDF válido ou está corrompido.',
        error: 'Arquivo inválido'
      })
    }

    // 2. Extrair texto do PDF (buscar assinatura visual)
    const pages = pdfDoc.getPages()
    let hasVisualSignature = false
    let signatureText = ''

    // Verificar se tem texto "Assinado digitalmente por" ou "SignFlow"
    try {
      for (const page of pages) {
        try {
          const textContent = await page.getTextContent?.()
          if (textContent) {
            const pageText = textContent?.items?.map((item: any) => item.str).join(' ') || ''
            
            if (pageText.includes('Assinado digitalmente por') || 
                pageText.includes('SignFlow') ||
                pageText.includes('Documento assinado digitalmente')) {
              hasVisualSignature = true
              signatureText = pageText
              break
            }
          }
        } catch (pageErr) {
          // Página sem conteúdo de texto
          continue
        }
      }
    } catch (err) {
      console.log('⚠️ Não foi possível extrair texto do PDF')
    }

    // 3. Calcular hash do documento
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

    console.log('✅ Hash do documento:', documentHash)
    console.log('✅ Assinatura visual encontrada:', hasVisualSignature)

    // 4. Buscar no banco se existe registro desta assinatura
    // Se Supabase não estiver configurado, apenas verifica marca visual
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
        message: 'Documento autenticado! Assinatura digital válida e verificada.'
      })
    }

    // 6. Se não encontrou no banco, mas tem assinatura visual
    if (hasVisualSignature) {
      return NextResponse.json({
        isValid: false,
        isSigned: true,
        signatureData: null,
        message: 'Este documento possui uma marca de assinatura do SignFlow, mas não foi possível validar sua autenticidade no banco de dados. O documento pode ter sido assinado em uma versão antiga do sistema ou a assinatura pode ter sido adulterada.',
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
    
    // Erro genérico mais amigável
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json({
      isValid: false,
      isSigned: false,
      message: 'Ocorreu um erro ao tentar verificar o documento. Por favor, certifique-se de que o arquivo está no formato PDF e tente novamente.',
      error: errorMessage
    }, { status: 500 })
  }
}
