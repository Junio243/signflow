// app/api/sign/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { signRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit'
import { logAudit, extractIpFromRequest } from '@/lib/audit'
import { randomUUID } from 'crypto'

const limiter = signRateLimiter('/api/sign')

function jsonError(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

async function downloadFile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  path: string,
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from('signflow').download(path)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

async function buildQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: 'png', width: 120, margin: 1, errorCorrectionLevel: 'M' })
}

export async function POST(req: NextRequest) {
  const rl = await limiter(req)
  if (!rl.allowed) return rl.response

  const reqId = randomUUID()
  const ip = extractIpFromRequest(req)
  const supabase = getSupabaseAdmin()

  try {
    // 1. Autenticação
    const authHeader = req.headers.get('authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return jsonError('Não autenticado', 401)
    }

    // 2. Ler FormData
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return jsonError('Corpo da requisição inválido', 400)
    }

    const id = form.get('id')?.toString()?.trim()
    if (!id) return jsonError('Campo "id" é obrigatório', 400)

    // 3. Buscar documento
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (docErr || !doc) return jsonError('Documento não encontrado', 404)

    // Se já foi assinado, devolve as URLs existentes
    if (doc.status === 'signed' && doc.signed_pdf_url) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://signflow-beta.vercel.app')
      return addRateLimitHeaders(
        NextResponse.json({
          id: doc.id,
          signed_pdf_url: doc.signed_pdf_url,
          qr_code_url: doc.qr_code_url ?? null,
          validate_url: `${baseUrl.replace(/\/$/, '')}/validate/${id}`,
        }),
        rl.headers,
      )
    }

    const metadata: Record<string, any> = (doc.metadata as Record<string, any>) ?? {}
    const positions: any[] = metadata.positions ?? []
    const signatureMeta: { width: number; height: number } | null = metadata.signature_meta ?? null
    const signers: any[] = metadata.signers ?? []
    const qrPosition: string = metadata.qr_position ?? 'bottom-left'
    const qrPage: string = metadata.qr_page ?? 'last'
    const validationRequiresCode: boolean = metadata.validation_requires_code ?? false
    const validationAccessCode: string | null = metadata.validation_access_code ?? null

    // 4. Baixar PDF original
    const pdfBytes = await downloadFile(supabase, `${id}/original.pdf`)
    if (!pdfBytes) return jsonError('PDF original não encontrado no storage', 500)

    // 5. Baixar imagem de assinatura
    const sigBytes = await downloadFile(supabase, `${id}/signature`)

    // 6. Carregar PDF com pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const totalPages = pages.length

    // 7. Embutir assinatura nas posições
    if (sigBytes && positions.length > 0) {
      let sigImage
      try {
        try { sigImage = await pdfDoc.embedPng(sigBytes) }
        catch { sigImage = await pdfDoc.embedJpg(sigBytes) }
      } catch (e) {
        console.error('[sign] Falha ao embutir assinatura:', e)
      }

      if (sigImage) {
        const naturalW = signatureMeta?.width ?? sigImage.width
        const naturalH = signatureMeta?.height ?? sigImage.height

        for (const pos of positions) {
          const pageIndex = (pos.page ?? 1) - 1
          if (pageIndex < 0 || pageIndex >= totalPages) continue
          const page = pages[pageIndex]
          const { width: pw, height: ph } = page.getSize()

          const scale = typeof pos.scale === 'number' ? pos.scale : 1
          const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0
          const drawW = naturalW * scale
          const drawH = naturalH * scale
          const nx = typeof pos.nx === 'number' ? pos.nx : 0.5
          const ny = typeof pos.ny === 'number' ? pos.ny : 0.5
          const cx = nx * pw
          const cy = (1 - ny) * ph
          const x = cx - drawW / 2
          const y = cy - drawH / 2

          page.drawImage(sigImage, { x, y, width: drawW, height: drawH, rotate: degrees(rotation), opacity: 1 })
        }
      }
    }

    // 8. Gerar QR Code
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://signflow-beta.vercel.app')
    const validateUrl = `${baseUrl.replace(/\/$/, '')}/validate/${id}`

    const qrPng = await buildQrPng(validateUrl)
    const qrImage = await pdfDoc.embedPng(new Uint8Array(qrPng))
    const qrSize = 80
    const qrMargin = 12

    const qrPageIndexes: number[] =
      qrPage === 'all'
        ? Array.from({ length: totalPages }, (_, i) => i)
        : qrPage === 'first' ? [0] : [totalPages - 1]

    for (const pi of qrPageIndexes) {
      const page = pages[pi]
      const { width: pw, height: ph } = page.getSize()
      let qrX: number, qrY: number
      switch (qrPosition) {
        case 'top-left':    qrX = qrMargin;              qrY = ph - qrSize - qrMargin; break
        case 'top-right':   qrX = pw - qrSize - qrMargin; qrY = ph - qrSize - qrMargin; break
        case 'bottom-right': qrX = pw - qrSize - qrMargin; qrY = qrMargin; break
        default:             qrX = qrMargin;              qrY = qrMargin
      }
      page.drawRectangle({ x: qrX - 2, y: qrY - 2, width: qrSize + 4, height: qrSize + 4, color: rgb(1, 1, 1), opacity: 0.9 })
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
    }

    // 9. Salvar PDF final
    const signedBytes = await pdfDoc.save()

    // 10. Upload do PDF assinado
    const signedPath = `${id}/signed.pdf`
    const { error: upErr } = await supabase.storage
      .from('signflow')
      .upload(signedPath, signedBytes, { contentType: 'application/pdf', upsert: true })
    if (upErr) return jsonError('Falha ao salvar PDF assinado: ' + upErr.message, 500)

    // 11. Upload do QR Code PNG
    const qrPath = `${id}/qrcode.png`
    await supabase.storage.from('signflow').upload(qrPath, qrPng, { contentType: 'image/png', upsert: true })

    // 12. URLs públicas
    const { data: signedUrlData } = supabase.storage.from('signflow').getPublicUrl(signedPath)
    const { data: qrUrlData } = supabase.storage.from('signflow').getPublicUrl(qrPath)
    const signedPdfUrl = signedUrlData?.publicUrl ?? null
    const qrCodeUrl = qrUrlData?.publicUrl ?? null

    // 13. Atualizar documento — apenas colunas que existem no schema
    const updatePayload: Record<string, any> = {
      status: 'signed',
      signed_pdf_url: signedPdfUrl,
      qr_code_url: qrCodeUrl,
    }
    if (validationRequiresCode) {
      updatePayload.validation_requires_code = true
      if (validationAccessCode) updatePayload.validation_access_code = validationAccessCode
    }

    const { error: updateErr } = await supabase.from('documents').update(updatePayload).eq('id', id)
    if (updateErr) {
      console.error('[sign] Falha ao atualizar documento:', updateErr.message)
    }

    // 14. Inserir eventos de assinatura (document_signing_events)
    if (signers.length > 0) {
      const now = new Date().toISOString()
      const events = signers
        .filter((s: any) => s?.name?.trim())
        .map((s: any) => ({
          document_id: id,
          signer_name: s.name.trim(),
          signer_reg: s.reg?.trim() || null,
          certificate_type: s.certificate_type?.trim() || null,
          certificate_issuer: s.certificate_issuer?.trim() || null,
          signer_email: s.email?.trim() || null,
          certificate_valid_until: s.certificate_valid_until?.trim() || null,
          logo_url: s.logo_url?.trim() || null,
          signed_at: now,
        }))

      if (events.length > 0) {
        const { error: evErr } = await supabase.from('document_signing_events').insert(events)
        if (evErr) console.error('[sign] Falha ao inserir signing events:', evErr.message)
      }
    }

    await logAudit({
      action: 'document.sign', resourceType: 'document', resourceId: id,
      status: 'success', ip, requestId: reqId,
      details: { positions: positions.length, signers: signers.length, qrPosition, qrPage },
    })

    return addRateLimitHeaders(
      NextResponse.json({ id, signed_pdf_url: signedPdfUrl, qr_code_url: qrCodeUrl, validate_url: validateUrl }),
      rl.headers,
    )
  } catch (e: any) {
    console.error('[sign] Erro inesperado:', e)
    await logAudit({
      action: 'document.sign', resourceType: 'document',
      status: 'error', ip, requestId: reqId,
      details: { error: String(e?.message ?? e) },
    })
    return jsonError('Erro ao processar assinatura: ' + (e?.message ?? 'Desconhecido'), 500)
  }
}
