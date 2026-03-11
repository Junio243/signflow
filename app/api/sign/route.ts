// app/api/sign/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { signRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit'
import { logAudit, extractIpFromRequest } from '@/lib/audit'
import { randomUUID } from 'crypto'

const limiter = signRateLimiter('/api/sign')

// URL base sempre fixa — VERCEL_URL retorna o deploy atual (pode ser branch preview)
const APP_BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://signflow-beta.vercel.app'
).replace(/\/$/, '')

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

async function buildQrPng(url: string, sizePx: number): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: 'png', width: sizePx * 3, margin: 1, errorCorrectionLevel: 'M' })
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= maxChars) {
      current += (current ? ' ' : '') + word
    } else {
      if (current) lines.push(current)
      current = word.length > maxChars ? word.slice(0, maxChars) : word
    }
  }
  if (current) lines.push(current)
  return lines
}

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
    try { form = await req.formData() }
    catch { return jsonError('Corpo da requisição inválido', 400) }

    const id = form.get('id')?.toString()?.trim()
    if (!id) return jsonError('Campo "id" é obrigatório', 400)

    const { data: doc, error: docErr } = await supabase
      .from('documents').select('*').eq('id', id).maybeSingle()
    if (docErr || !doc) return jsonError('Documento não encontrado', 404)

    // URL sempre correta e estável
    const validateUrl = `${APP_BASE_URL}/validate/${id}`

    if (doc.status === 'signed' && doc.signed_pdf_url) {
      return addRateLimitHeaders(
        NextResponse.json({ id: doc.id, signed_pdf_url: doc.signed_pdf_url, qr_code_url: doc.qr_code_url ?? null, validate_url: validateUrl }),
        rl.headers,
      )
    }

    const metadata: Record<string, any> = (doc.metadata as Record<string, any>) ?? {}
    const positions: any[]  = metadata.positions ?? []
    const signatureMeta     = metadata.signature_meta ?? null
    const signers: any[]    = metadata.signers ?? []
    const qrPosition        = (metadata.qr_position as string) ?? 'bottom-left'
    const qrPage            = (metadata.qr_page    as string) ?? 'last'
    // Tamanho do QR em pontos PDF (40–120), default 72
    const qrSize: number    = Math.min(120, Math.max(40, Number(metadata.qr_size) || 72))
    const validationRequiresCode: boolean = metadata.validation_requires_code ?? false
    const validationAccessCode: string | null = metadata.validation_access_code ?? null

    const pdfBytes = await downloadFile(supabase, `${id}/original.pdf`)
    if (!pdfBytes) return jsonError('PDF original não encontrado no storage', 500)

    const sigBytes = await downloadFile(supabase, `${id}/signature`)

    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages  = pdfDoc.getPages()
    const totalPages = pages.length

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Embutir assinatura
    if (sigBytes && positions.length > 0) {
      let sigImage
      try {
        try { sigImage = await pdfDoc.embedPng(sigBytes) }
        catch { sigImage = await pdfDoc.embedJpg(sigBytes) }
      } catch (e) { console.error('[sign] Falha ao embutir assinatura:', e) }

      if (sigImage) {
        const naturalW = signatureMeta?.width ?? sigImage.width
        const naturalH = signatureMeta?.height ?? sigImage.height
        for (const pos of positions) {
          const pi = (pos.page ?? 1) - 1
          if (pi < 0 || pi >= totalPages) continue
          const page = pages[pi]
          const { width: pw, height: ph } = page.getSize()
          const scale    = typeof pos.scale    === 'number' ? pos.scale    : 1
          const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0
          const drawW = naturalW * scale
          const drawH = naturalH * scale
          const nx = typeof pos.nx === 'number' ? pos.nx : 0.5
          const ny = typeof pos.ny === 'number' ? pos.ny : 0.5
          const x = nx * pw - drawW / 2
          const y = (1 - ny) * ph - drawH / 2
          page.drawImage(sigImage, { x, y, width: drawW, height: drawH, rotate: degrees(rotation), opacity: 1 })
        }
      }
    }

    // Gerar QR Code com resolução proporcional ao tamanho escolhido
    const qrPng   = await buildQrPng(validateUrl, qrSize)
    const qrImage = await pdfDoc.embedPng(new Uint8Array(qrPng))
    const margin  = 10

    const qrPageIndexes: number[] =
      qrPage === 'all'   ? Array.from({ length: totalPages }, (_, i) => i)
      : qrPage === 'first' ? [0]
      : [totalPages - 1]

    // Texto dinâmico
    const now      = new Date()
    const dateStr  = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const mainSigner = signers.find((s: any) => s?.name?.trim()) ?? null
    const signerName = mainSigner?.name?.trim()?.toUpperCase() ?? 'N/A'
    const signerReg  = mainSigner?.reg?.trim()  ?? null
    const certType   = mainSigner?.certificate_type?.trim() ?? null

    let mainText = `Documento assinado digitalmente de acordo com a ICP-Brasil, MP 2.200-2/2001, no sistema SignFlow, por ${signerName}`
    if (signerReg) mainText += `, ${signerReg}`
    if (certType)  mainText += `, certificado ${certType}`
    mainText += ` em ${dateStr} e pode ser validado em ${validateUrl}.`
    if (validationRequiresCode && validationAccessCode) {
      mainText += ` Código de Acesso: ${validationAccessCode}`
    }

    const fontSize     = Math.max(5.5, qrSize * 0.085)  // escala fonte com QR
    const lineHeight   = fontSize * 1.45
    const textMaxW     = Math.max(160, qrSize * 3.2)     // texto ocupa ~3x o QR
    const charsPerLine = Math.floor(textMaxW / (fontSize * 0.52))
    const textLines    = wrapText(mainText, charsPerLine)

    const blockPadding = 5
    const blockH       = qrSize + blockPadding * 2
    const blockW       = qrSize + textMaxW + margin + blockPadding * 3

    for (const pi of qrPageIndexes) {
      const page = pages[pi]
      const { width: pw, height: ph } = page.getSize()

      let blockX: number, blockY: number
      switch (qrPosition) {
        case 'top-left':    blockX = margin;              blockY = ph - blockH - margin; break
        case 'top-right':   blockX = pw - blockW - margin; blockY = ph - blockH - margin; break
        case 'bottom-right': blockX = pw - blockW - margin; blockY = margin; break
        default:             blockX = margin;              blockY = margin
      }

      // Garante que o bloco não ultrapassa a largura da página
      if (blockX + blockW > pw) blockX = Math.max(0, pw - blockW - margin)

      // Fundo branco
      page.drawRectangle({ x: blockX, y: blockY, width: blockW, height: blockH, color: rgb(1, 1, 1), opacity: 0.95 })
      // Borda cinza
      page.drawRectangle({ x: blockX, y: blockY, width: blockW, height: blockH, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, opacity: 0 })

      // QR Code
      const qrX = blockX + blockPadding
      const qrY = blockY + (blockH - qrSize) / 2
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })

      // Texto
      const textX      = qrX + qrSize + blockPadding
      const textStartY = blockY + blockH - blockPadding - (fontSize + 1)

      page.drawText('Assinado Digitalmente', {
        x: textX, y: textStartY,
        size: fontSize + 1, font: fontBold,
        color: rgb(0.05, 0.05, 0.05), maxWidth: textMaxW,
      })

      let curY = textStartY - lineHeight * 1.4
      for (const line of textLines) {
        if (curY < blockY + blockPadding) break
        page.drawText(line, {
          x: textX, y: curY,
          size: fontSize, font: fontRegular,
          color: rgb(0.2, 0.2, 0.2), maxWidth: textMaxW,
        })
        curY -= lineHeight
      }
    }

    const signedBytes = await pdfDoc.save()

    const signedPath = `${id}/signed.pdf`
    const { error: upErr } = await supabase.storage
      .from('signflow').upload(signedPath, signedBytes, { contentType: 'application/pdf', upsert: true })
    if (upErr) return jsonError('Falha ao salvar PDF assinado: ' + upErr.message, 500)

    const qrPath = `${id}/qrcode.png`
    await supabase.storage.from('signflow').upload(qrPath, qrPng, { contentType: 'image/png', upsert: true })

    const { data: signedUrlData } = supabase.storage.from('signflow').getPublicUrl(signedPath)
    const { data: qrUrlData }     = supabase.storage.from('signflow').getPublicUrl(qrPath)
    const signedPdfUrl = signedUrlData?.publicUrl ?? null
    const qrCodeUrl    = qrUrlData?.publicUrl    ?? null

    const updatePayload: Record<string, any> = { status: 'signed', signed_pdf_url: signedPdfUrl, qr_code_url: qrCodeUrl }
    if (validationRequiresCode) {
      updatePayload.validation_requires_code = true
      if (validationAccessCode) updatePayload.validation_access_code = validationAccessCode
    }
    const { error: updateErr } = await supabase.from('documents').update(updatePayload).eq('id', id)
    if (updateErr) console.error('[sign] update error:', updateErr.message)

    if (signers.length > 0) {
      const nowIso = now.toISOString()
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
          signed_at: nowIso,
        }))
      if (events.length > 0) {
        const { error: evErr } = await supabase.from('document_signing_events').insert(events)
        if (evErr) console.error('[sign] signing_events error:', evErr.message)
      }
    }

    await logAudit({
      action: 'document.sign', resourceType: 'document', resourceId: id,
      status: 'success', ip, requestId: reqId,
      details: { positions: positions.length, signers: signers.length, qrPosition, qrPage, qrSize },
    })

    return addRateLimitHeaders(
      NextResponse.json({ id, signed_pdf_url: signedPdfUrl, qr_code_url: qrCodeUrl, validate_url: validateUrl }),
      rl.headers,
    )
  } catch (e: any) {
    console.error('[sign] erro:', e)
    await logAudit({
      action: 'document.sign', resourceType: 'document',
      status: 'error', ip, requestId: reqId,
      details: { error: String(e?.message ?? e) },
    })
    return jsonError('Erro ao processar assinatura: ' + (e?.message ?? 'Desconhecido'), 500)
  }
}
