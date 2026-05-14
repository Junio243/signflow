// app/api/sign/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { signRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit'
import { logAudit, extractIpFromRequest } from '@/lib/audit'
import { applySignatureToPdf } from '@/lib/services/pdfSigner'
import {
  downloadFileFromStorage,
  uploadSignedPdf,
  updateDocumentStatus,
  insertSigningEvents,
} from '@/lib/services/documentStorage'
import { randomUUID } from 'crypto'

const limiter = signRateLimiter('/api/sign')

const APP_BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://signflow-beta.vercel.app'
).replace(/\/$/, '')

function jsonError(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// Schema de validação rigorosa com Zod
const SignerSchema = z.object({
  name: z.string().min(1),
  reg: z.string().optional().nullable(),
  certificate_type: z.string().optional().nullable(),
  certificate_issuer: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  certificate_valid_until: z.string().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
})

const PositionSchema = z.object({
  page: z.number().int().min(1).optional(),
  nx: z.number().min(0).max(1).optional(),
  ny: z.number().min(0).max(1).optional(),
  scale: z.number().min(0.1).max(10).optional(),
  rotation: z.number().min(-360).max(360).optional(),
})

const MetadataSchema = z.object({
  positions: z.array(PositionSchema).default([]),
  signature_meta: z.object({ width: z.number().optional(), height: z.number().optional() }).nullable().optional(),
  signers: z.array(SignerSchema).default([]),
  qr_position: z.enum(['bottom-left', 'bottom-right', 'top-left', 'top-right']).default('bottom-left'),
  qr_page: z.enum(['last', 'first', 'all']).default('last'),
  qr_size: z.number().min(40).max(120).default(72),
  validation_requires_code: z.boolean().default(false),
  validation_access_code: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const rl = await limiter(req)
  if (!rl.allowed) return rl.response

  const reqId = randomUUID()
  const ip = extractIpFromRequest(req)
  const supabase = getSupabaseAdmin()

  try {
    const authHeader = req.headers.get('authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return jsonError('Não autenticado', 401)

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return jsonError('Corpo da requisição inválido', 400)
    }

    const id = form.get('id')?.toString()?.trim()
    if (!id) return jsonError('Campo "id" é obrigatório', 400)

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (docErr || !doc) return jsonError('Documento não encontrado', 404)

    const validateUrl = `${APP_BASE_URL}/validate/${id}`

    // Retorno antecipado se já assinado
    if (doc.status === 'signed' && doc.signed_pdf_url) {
      return addRateLimitHeaders(
        NextResponse.json({
          id: doc.id,
          signed_pdf_url: doc.signed_pdf_url,
          qr_code_url: doc.qr_code_url ?? null,
          validate_url: validateUrl,
        }),
        rl.headers,
      )
    }

    // Validar metadata com Zod — falha explícita se dados inválidos
    const rawMeta = (doc.metadata as Record<string, unknown>) ?? {}
    const metaParsed = MetadataSchema.safeParse(rawMeta)
    if (!metaParsed.success) {
      console.error('[sign] metadata inválido:', metaParsed.error.flatten())
      return jsonError('Metadados do documento em formato inválido', 422)
    }
    const meta = metaParsed.data

    const pdfBytes = await downloadFileFromStorage(`${id}/original.pdf`)
    if (!pdfBytes) return jsonError('PDF original não encontrado no storage', 500)

    const sigBytes = await downloadFileFromStorage(`${id}/signature`)

    // Delegar toda manipulação do PDF ao serviço especializado
    const { signedBytes, qrPng } = await applySignatureToPdf({
      pdfBytes,
      sigBytes,
      positions: meta.positions,
      signatureMeta: meta.signature_meta ?? null,
      signers: meta.signers,
      qrPosition: meta.qr_position,
      qrPage: meta.qr_page,
      qrSize: meta.qr_size,
      validateUrl,
      validationRequiresCode: meta.validation_requires_code,
      validationAccessCode: meta.validation_access_code ?? null,
    })

    // Upload do PDF assinado e QR Code
    const { signedPdfUrl, qrCodeUrl, error: storageErr } = await uploadSignedPdf(id, signedBytes, qrPng)
    if (storageErr) return jsonError('Falha ao salvar PDF assinado: ' + storageErr, 500)

    // Atualizar status no banco
    await updateDocumentStatus(id, signedPdfUrl, qrCodeUrl, {
      validationRequiresCode: meta.validation_requires_code,
      validationAccessCode: meta.validation_access_code ?? null,
    })

    // Registrar eventos de assinatura
    const now = new Date()
    await insertSigningEvents(id, meta.signers, now.toISOString())

    await logAudit({
      action: 'document.sign',
      resourceType: 'document',
      resourceId: id,
      status: 'success',
      ip,
      requestId: reqId,
      details: {
        positions: meta.positions.length,
        signers: meta.signers.length,
        qrPosition: meta.qr_position,
        qrPage: meta.qr_page,
        qrSize: meta.qr_size,
      },
    })

    return addRateLimitHeaders(
      NextResponse.json({ id, signed_pdf_url: signedPdfUrl, qr_code_url: qrCodeUrl, validate_url: validateUrl }),
      rl.headers,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[sign] erro:', e)
    await logAudit({
      action: 'document.sign',
      resourceType: 'document',
      status: 'error',
      ip,
      requestId: reqId,
      details: { error: msg },
    })
    return jsonError('Erro ao processar assinatura: ' + msg, 500)
  }
}
