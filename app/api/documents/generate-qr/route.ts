import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, validationUrl, hash, requireCode } = body

    if (!documentId || !validationUrl) {
      return NextResponse.json(
        { error: 'documentId and validationUrl are required' },
        { status: 400 }
      )
    }

    // Dados que vão no QR Code
    const qrData = {
      url: validationUrl,
      documentId,
      hash,
      timestamp: new Date().toISOString(),
      protected: requireCode || false
    }

    // Gera QR Code como Data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      data: qrData
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
