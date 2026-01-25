import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extrair dados do formData
    const pdfFile = formData.get('pdf') as File
    const signatureData = formData.get('signature') as string
    const profileData = formData.get('profile') as string
    const signatoryData = formData.get('signatories') as string
    const certificateData = formData.get('certificate') as string
    const qrCodeConfigData = formData.get('qrCodeConfig') as string
    const validationData = formData.get('validation') as string

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    // Parse JSON data
    const signature = signatureData ? JSON.parse(signatureData) : null
    const profile = profileData ? JSON.parse(profileData) : null
    const signatories = signatoryData ? JSON.parse(signatoryData) : []
    const certificate = certificateData ? JSON.parse(certificateData) : null
    const qrCodeConfig = qrCodeConfigData ? JSON.parse(qrCodeConfigData) : null
    const validation = validationData ? JSON.parse(validationData) : null

    // 1. Ler o PDF original
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // 2. Gerar hash SHA-256 do PDF original
    const hash = crypto.createHash('sha256').update(Buffer.from(pdfBytes)).digest('hex')

    // 3. Criar ID do documento
    const documentId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 4. URL de validação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const validationUrl = `${baseUrl}/validate/${documentId}`

    // 5. Gerar QR Code
    const qrResponse = await fetch(`${baseUrl}/api/documents/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        validationUrl,
        hash,
        requireCode: validation?.requireCode || false
      })
    })

    const qrResult = await qrResponse.json()
    if (!qrResult.success) {
      throw new Error('Failed to generate QR code')
    }

    // 6. Inserir QR Code no PDF
    const qrImageBytes = await fetch(qrResult.qrCode).then(res => res.arrayBuffer())
    const qrImage = await pdfDoc.embedPng(qrImageBytes)

    // Determinar posição e tamanho
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Tamanhos do QR Code
    const qrSizes = {
      small: 80,
      medium: 120,
      large: 160
    }
    const qrSize = qrSizes[qrCodeConfig?.size || 'medium'] || 120

    // Posições
    const margin = 20
    const positions = {
      'top-left': { x: margin, y: height - qrSize - margin },
      'top-right': { x: width - qrSize - margin, y: height - qrSize - margin },
      'bottom-left': { x: margin, y: margin },
      'bottom-right': { x: width - qrSize - margin, y: margin }
    }

    const position = positions[qrCodeConfig?.position || 'bottom-right'] || positions['bottom-right']

    // Desenhar QR Code
    firstPage.drawImage(qrImage, {
      x: position.x,
      y: position.y,
      width: qrSize,
      height: qrSize
    })

    // 7. Adicionar texto de validação abaixo do QR Code (opcional)
    firstPage.drawText('Documento Assinado Digitalmente', {
      x: position.x,
      y: position.y - 15,
      size: 8,
      color: rgb(0, 0, 0)
    })

    // 8. Salvar PDF modificado
    const signedPdfBytes = await pdfDoc.save()
    const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' })

    // 9. Upload para Supabase Storage
    const fileName = `${documentId}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(fileName, signedPdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // 10. Obter URL pública do PDF
    const { data: urlData } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(fileName)

    const signedPdfUrl = urlData.publicUrl

    // 11. Salvar metadados no banco
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        original_pdf_name: pdfFile.name,
        signed_pdf_url: signedPdfUrl,
        qr_code_url: qrResult.qrCode,
        hash,
        status: 'signed',
        signature_type: signature?.type || 'drawn',
        profile_type: profile?.type || 'individual',
        profile_data: profile,
        signatories,
        certificate_issuer: certificate?.issuer,
        certificate_valid_from: certificate?.validFrom,
        certificate_valid_until: certificate?.validUntil,
        certificate_logo_url: certificate?.logoUrl,
        qr_position: qrCodeConfig?.position,
        qr_size: qrCodeConfig?.size,
        require_validation_code: validation?.requireCode || false,
        validation_code: validation?.validationCode,
        signed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save document metadata: ${dbError.message}`)
    }

    // 12. Retornar sucesso
    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        hash,
        signedPdfUrl,
        qrCodeUrl: qrResult.qrCode,
        validationUrl,
        signedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error signing document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sign document', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
