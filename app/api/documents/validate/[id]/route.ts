import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit, extractIpFromRequest } from '@/lib/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const validationCode = searchParams.get('code')
    const clientIp = extractIpFromRequest(request);

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Buscar documento no banco
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !document) {
      // Audit log: document not found
      await logAudit({
        action: 'document.validate',
        resourceType: 'document',
        resourceId: id,
        status: 'failure',
        ip: clientIp,
        details: { reason: 'document_not_found' }
      });
      
      return NextResponse.json(
        { 
          error: 'Document not found',
          valid: false,
          message: 'Este documento não foi encontrado ou foi removido.'
        },
        { status: 404 }
      )
    }

    // Verificar se documento foi cancelado
    if (document.status === 'canceled') {
      return NextResponse.json(
        {
          valid: false,
          status: 'canceled',
          message: 'Este documento foi cancelado e não é mais válido.',
          canceledAt: document.canceled_at
        }
      )
    }

    // Verificar se documento expirou
    if (document.status === 'expired') {
      return NextResponse.json(
        {
          valid: false,
          status: 'expired',
          message: 'Este documento expirou.',
          validUntil: document.certificate_valid_until
        }
      )
    }

    // Verificar validade do certificado
    if (document.certificate_valid_until) {
      const now = new Date()
      const validUntil = new Date(document.certificate_valid_until)
      if (now > validUntil) {
        return NextResponse.json(
          {
            valid: false,
            status: 'expired',
            message: 'O certificado deste documento expirou.',
            validUntil: document.certificate_valid_until
          }
        )
      }
    }

    // Se requer código de validação
    if (document.require_validation_code) {
      if (!validationCode) {
        return NextResponse.json(
          {
            requiresCode: true,
            message: 'Este documento requer um código de validação.',
            documentId: id
          },
          { status: 403 }
        )
      }

      // Validar código
      if (validationCode !== document.validation_code) {
        // Audit log: wrong validation code (access denied)
        await logAudit({
          action: 'auth.denied',
          resourceType: 'validation',
          resourceId: id,
          status: 'denied',
          ip: clientIp,
          details: { reason: 'invalid_validation_code' }
        });
        
        return NextResponse.json(
          {
            error: 'Invalid validation code',
            valid: false,
            message: 'Código de validação incorreto.'
          },
          { status: 403 }
        )
      }
    }

    // Audit log: successful validation
    await logAudit({
      action: 'document.validate',
      resourceType: 'document',
      resourceId: id,
      status: 'success',
      ip: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        documentStatus: document.status,
        requiresCode: document.require_validation_code || false,
        codeProvided: !!validationCode
      }
    });

    // Documento válido - retornar informações
    return NextResponse.json({
      valid: true,
      document: {
        id: document.id,
        originalName: document.original_pdf_name,
        hash: document.hash,
        status: document.status,
        signedAt: document.signed_at,
        signedPdfUrl: document.signed_pdf_url,
        qrCodeUrl: document.qr_code_url,
        certificate: {
          issuer: document.certificate_issuer,
          validFrom: document.certificate_valid_from,
          validUntil: document.certificate_valid_until,
          logoUrl: document.certificate_logo_url
        },
        profile: document.profile_data,
        signatories: document.signatories,
        signatureType: document.signature_type
      },
      message: 'Documento válido e autêntico.'
    })

  } catch (error) {
    console.error('Error validating document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to validate document',
        valid: false,
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST para validar com código no body
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { code } = body

    // Redirecionar para GET com query param
    const url = new URL(request.url)
    url.searchParams.set('code', code)

    return GET(
      new NextRequest(url),
      { params }
    )
  } catch (error) {
    console.error('Error in POST validation:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
