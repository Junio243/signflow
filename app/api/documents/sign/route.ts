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
    console.log('🚀 [SIGN API] Starting document signing process...')
    
    const formData = await request.formData()
    console.log('✅ [SIGN API] FormData received')
    
    // Extrair dados do formData
    const pdfFile = formData.get('pdf') as File
    const signatureData = formData.get('signature') as string
    const profileData = formData.get('profile') as string
    const signatoryData = formData.get('signatories') as string
    const certificateData = formData.get('certificate') as string
    const qrCodeConfigData = formData.get('qrCodeConfig') as string
    const validationData = formData.get('validation') as string
    const positionsData = formData.get('positions') as string

    console.log('📄 [SIGN API] PDF File:', pdfFile ? `${pdfFile.name} (${pdfFile.size} bytes)` : 'MISSING')

    if (!pdfFile) {
      console.error('❌ [SIGN API] PDF file is missing!')
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    // Parse JSON data
    console.log('📦 [SIGN API] Parsing JSON data...')
    const signature = signatureData ? JSON.parse(signatureData) : null
    const profile = profileData ? JSON.parse(profileData) : null
    const signatories = signatoryData ? JSON.parse(signatoryData) : []
    const certificate = certificateData ? JSON.parse(certificateData) : null
    const qrCodeConfig = qrCodeConfigData ? JSON.parse(qrCodeConfigData) : null
    const validation = validationData ? JSON.parse(validationData) : null
    const positions = positionsData ? JSON.parse(positionsData) : []
    console.log('✅ [SIGN API] JSON data parsed successfully')
    console.log('📍 [SIGN API] Signature positions:', positions.length)

    // 1. Ler o PDF original
    console.log('📝 [SIGN API] Loading PDF document...')
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    console.log('✅ [SIGN API] PDF loaded successfully')

    // 2. Gerar hash SHA-256 do PDF original
    console.log('🔐 [SIGN API] Generating SHA-256 hash...')
    const hash = crypto.createHash('sha256').update(Buffer.from(pdfBytes)).digest('hex')
    console.log('✅ [SIGN API] Hash generated:', hash.substring(0, 16) + '...')

    // 3. Processar assinatura se houver posições
    if (positions.length > 0 && signature?.data) {
      console.log('✍️ [SIGN API] Processing signature image...')
      
      try {
        // Converter data URL da assinatura para bytes
        const signatureBase64 = signature.data.split(',')[1]
        const signatureBytes = Buffer.from(signatureBase64, 'base64')
        console.log('📦 [SIGN API] Signature bytes:', signatureBytes.length)
        
        // Embed signature image
        let signatureImage
        if (signature.data.includes('image/png')) {
          signatureImage = await pdfDoc.embedPng(signatureBytes)
        } else if (signature.data.includes('image/jpeg') || signature.data.includes('image/jpg')) {
          signatureImage = await pdfDoc.embedJpg(signatureBytes)
        } else {
          // Default to PNG
          signatureImage = await pdfDoc.embedPng(signatureBytes)
        }
        console.log('✅ [SIGN API] Signature image embedded')

        // Desenhar assinatura em cada posição
        const pages = pdfDoc.getPages()
        console.log('📋 [SIGN API] Drawing signature on', positions.length, 'positions')
        
        for (const pos of positions) {
          const pageIndex = pos.page - 1
          if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn('⚠️ [SIGN API] Invalid page index:', pos.page)
            continue
          }

          const page = pages[pageIndex]
          const { width: pageWidth, height: pageHeight } = page.getSize()
          
          // Calcular posição absoluta
          const x = pos.x || (pos.nx * pageWidth)
          const y = pos.y || (pos.ny * pageHeight)
          
          // Tamanho base da assinatura (ajustado com scale)
          const baseWidth = 200
          const baseHeight = 100
          const finalWidth = baseWidth * (pos.scale || 1)
          const finalHeight = baseHeight * (pos.scale || 1)
          
          console.log(`📍 [SIGN API] Page ${pos.page}: x=${x.toFixed(1)}, y=${y.toFixed(1)}, w=${finalWidth.toFixed(1)}, h=${finalHeight.toFixed(1)}`)
          
          page.drawImage(signatureImage, {
            x,
            y,
            width: finalWidth,
            height: finalHeight
            // rotation removed temporarily - pdf-lib doesn't support the { angle: value } format
          })
        }
        
        console.log('✅ [SIGN API] All signatures drawn successfully')
      } catch (err) {
        console.error('❌ [SIGN API] Error processing signature:', err)
        // Continuar sem assinatura se houver erro
      }
    } else {
      console.log('ℹ️ [SIGN API] No signature positions provided, skipping signature drawing')
    }

    // 4. Criar registro no banco PRIMEIRO para obter UUID
    console.log('💾 [SIGN API] Inserting document record into database...')
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        original_pdf_name: pdfFile.name,
        hash,
        status: 'draft',
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
        validation_code: validation?.validationCode
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ [SIGN API] Database error:', dbError)
      console.error('❌ [SIGN API] Error details:', JSON.stringify(dbError, null, 2))
      throw new Error(`Failed to create document record: ${dbError.message}`)
    }

    console.log('✅ [SIGN API] Document record created with ID:', docData.id)
    const documentId = docData.id

    // 5. URL de validação (sempre usa o host atual)
    const origin = new URL(request.url).origin
    const validationUrl = `${origin}/validate/${documentId}`
    console.log('🔗 [SIGN API] Validation URL:', validationUrl)

    // 6. Gerar QR Code
    console.log('📱 [SIGN API] Generating QR code...')
    const qrResponse = await fetch(`${origin}/api/documents/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        validationUrl,
        hash,
        requireCode: validation?.requireCode || false
      })
    })

    if (!qrResponse.ok) {
      console.error('❌ [SIGN API] QR generation failed with status:', qrResponse.status)
      const errorText = await qrResponse.text()
      console.error('❌ [SIGN API] QR error response:', errorText)
      throw new Error(`QR generation failed: ${qrResponse.status}`)
    }

    const qrResult = await qrResponse.json()
    if (!qrResult.success) {
      console.error('❌ [SIGN API] QR generation returned error:', qrResult)
      throw new Error('Failed to generate QR code')
    }
    console.log('✅ [SIGN API] QR code generated successfully')

    // 7. Inserir QR Code no PDF
    console.log('🖼️ [SIGN API] Embedding QR code into PDF...')
    
    // Converter data URL para bytes
    const base64Data = qrResult.qrCode.split(',')[1]
    const qrImageBytes = Buffer.from(base64Data, 'base64')
    console.log('📦 [SIGN API] QR image bytes:', qrImageBytes.length)
    
    const qrImage = await pdfDoc.embedPng(qrImageBytes)
    console.log('✅ [SIGN API] QR image embedded')

    // Determinar posição e tamanho
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    console.log('📐 [SIGN API] Page dimensions:', width, 'x', height)

    // Tamanhos do QR Code
    const qrSizes: Record<string, number> = {
      small: 80,
      medium: 120,
      large: 160
    }
    const qrSize = qrSizes[qrCodeConfig?.size || 'medium'] || 120
    console.log('📊 [SIGN API] QR size:', qrSize)

    // Posições
    const margin = 20
    const qrPositions: Record<string, {x: number, y: number}> = {
      'top-left': { x: margin, y: height - qrSize - margin },
      'top-right': { x: width - qrSize - margin, y: height - qrSize - margin },
      'bottom-left': { x: margin, y: margin },
      'bottom-right': { x: width - qrSize - margin, y: margin }
    }

    const position = qrPositions[qrCodeConfig?.position || 'bottom-right'] || qrPositions['bottom-right']
    console.log('📍 [SIGN API] QR position:', qrCodeConfig?.position, '=', position)

    // Desenhar QR Code
    console.log('🎨 [SIGN API] Drawing QR code on page...')
    firstPage.drawImage(qrImage, {
      x: position.x,
      y: position.y,
      width: qrSize,
      height: qrSize
    })

    // 8. Adicionar texto de validação abaixo do QR Code
    firstPage.drawText('Documento Assinado Digitalmente', {
      x: position.x,
      y: position.y - 15,
      size: 8,
      color: rgb(0, 0, 0)
    })
    console.log('✅ [SIGN API] QR code drawn on PDF')

    // 9. Salvar PDF modificado
    console.log('💾 [SIGN API] Saving modified PDF...')
    const signedPdfBytes = await pdfDoc.save()
    const signedPdfBlob = new Blob([signedPdfBytes as any], { type: 'application/pdf' })
    console.log('✅ [SIGN API] PDF saved, size:', signedPdfBytes.length, 'bytes')

    // 10. Upload para Supabase Storage
    console.log('☁️ [SIGN API] Uploading to Supabase Storage...')
    const fileName = `${documentId}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(fileName, signedPdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ [SIGN API] Upload error:', uploadError)
      console.error('❌ [SIGN API] Upload error details:', JSON.stringify(uploadError, null, 2))
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }
    console.log('✅ [SIGN API] PDF uploaded successfully:', fileName)

    // 11. Obter URL pública do PDF
    const { data: urlData } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(fileName)

    const signedPdfUrl = urlData.publicUrl
    console.log('🔗 [SIGN API] Public URL:', signedPdfUrl)

    // 12. Atualizar registro no banco com URLs e status signed
    console.log('🔄 [SIGN API] Updating document record...')
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        signed_pdf_url: signedPdfUrl,
        qr_code_url: qrResult.qrCode,
        status: 'signed',
        signed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('❌ [SIGN API] Update error:', updateError)
      console.error('❌ [SIGN API] Update error details:', JSON.stringify(updateError, null, 2))
      throw new Error(`Failed to update document: ${updateError.message}`)
    }
    console.log('✅ [SIGN API] Document record updated')

    // 13. Retornar sucesso
    console.log('✅✅✅ [SIGN API] Document signed successfully!')
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
    console.error('❌❌❌ [SIGN API] FATAL ERROR:', error)
    console.error('❌ [SIGN API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to sign document', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
