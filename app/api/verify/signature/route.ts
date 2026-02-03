import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { document_base64, document_name } = await request.json()

    if (!document_base64) {
      return NextResponse.json(
        { error: 'Documento não fornecido' },
        { status: 400 }
      )
    }

    console.log('🔍 Iniciando verificação de assinatura...')

    // 1. Decodificar PDF
    const pdfBuffer = Buffer.from(document_base64, 'base64')
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    // 2. Extrair texto do PDF (buscar assinatura visual)
    const pages = pdfDoc.getPages()
    let hasVisualSignature = false
    let signatureText = ''

    // Verificar se tem texto "Assinado digitalmente por" (da assinatura visual)
    try {
      const lastPage = pages[pages.length - 1]
      const textContent = await lastPage.getTextContent()
      const pageText = textContent?.items?.map((item: any) => item.str).join(' ') || ''
      
      if (pageText.includes('Assinado digitalmente por') || pageText.includes('SignFlow')) {
        hasVisualSignature = true
        signatureText = pageText
      }
    } catch (err) {
      console.log('Não foi possível extrair texto do PDF')
    }

    // 3. Calcular hash do documento
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

    console.log('✅ Hash do documento:', documentHash)
    console.log('✅ Assinatura visual encontrada:', hasVisualSignature)

    // 4. Buscar no banco se existe registro desta assinatura
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: signatures, error: dbError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_hash', documentHash)
      .eq('status', 'completed')

    if (dbError) {
      console.error('Erro ao buscar no banco:', dbError)
    }

    console.log('📄 Assinaturas encontradas no banco:', signatures?.length || 0)

    // 5. Se encontrou no banco, é válido
    if (signatures && signatures.length > 0) {
      const signature = signatures[0]

      return NextResponse.json({
        isValid: true,
        isSigned: true,
        signatureData: {
          signerName: signature.signature_data?.signerName || 'N/A',
          signerEmail: signature.signature_data?.signerEmail || 'N/A',
          certificateIssuer: signature.signature_data?.certificateIssuer || 'N/A',
          timestamp: signature.signed_at,
          signatureAlgorithm: signature.signature_data?.signatureAlgorithm || 'RSA-SHA256',
          documentHash: signature.document_hash,
        },
      })
    }

    // 6. Se não encontrou no banco, mas tem assinatura visual
    if (hasVisualSignature) {
      return NextResponse.json({
        isValid: false,
        isSigned: true,
        signatureData: null,
        message: 'Documento possui marca de assinatura, mas não foi possível validar completamente.',
      })
    }

    // 7. Documento não assinado
    return NextResponse.json({
      isValid: false,
      isSigned: false,
      signatureData: null,
      message: 'Documento não contém assinatura digital.',
    })
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar assinatura: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
