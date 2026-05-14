// lib/services/pdfSigner.ts
// Responsabilidade única: manipulação visual do PDF (assinatura + QR Code)
import { PDFDocument, rgb, degrees, StandardFonts, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'

export interface SignerInfo {
  name: string
  reg?: string | null
  certificate_type?: string | null
  certificate_issuer?: string | null
  email?: string | null
  certificate_valid_until?: string | null
  logo_url?: string | null
}

export interface SignaturePosition {
  page?: number
  nx?: number
  ny?: number
  scale?: number
  rotation?: number
}

export interface PdfSignOptions {
  pdfBytes: Uint8Array
  sigBytes?: Uint8Array | null
  positions?: SignaturePosition[]
  signatureMeta?: { width?: number; height?: number } | null
  signers?: SignerInfo[]
  qrPosition?: string
  qrPage?: string
  qrSize?: number
  validateUrl: string
  validationRequiresCode?: boolean
  validationAccessCode?: string | null
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

async function buildQrPng(url: string, sizePx: number): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    width: sizePx * 3,
    margin: 1,
    errorCorrectionLevel: 'M',
  }) as Promise<Buffer>
}

export async function applySignatureToPdf(opts: PdfSignOptions): Promise<{ signedBytes: Uint8Array; qrPng: Buffer }> {
  const {
    pdfBytes,
    sigBytes,
    positions = [],
    signatureMeta,
    signers = [],
    qrPosition = 'bottom-left',
    qrPage = 'last',
    qrSize = 72,
    validateUrl,
    validationRequiresCode = false,
    validationAccessCode = null,
  } = opts

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  const totalPages = pages.length

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Embutir imagem de assinatura
  if (sigBytes && positions.length > 0) {
    let sigImage
    try {
      try {
        sigImage = await pdfDoc.embedPng(sigBytes)
      } catch {
        sigImage = await pdfDoc.embedJpg(sigBytes)
      }
    } catch (e) {
      console.error('[pdfSigner] Falha ao embutir assinatura:', e)
    }

    if (sigImage) {
      const naturalW = signatureMeta?.width ?? sigImage.width
      const naturalH = signatureMeta?.height ?? sigImage.height
      for (const pos of positions) {
        const pi = (pos.page ?? 1) - 1
        if (pi < 0 || pi >= totalPages) continue
        const page = pages[pi]
        const { width: pw, height: ph } = page.getSize()
        const scale = typeof pos.scale === 'number' ? pos.scale : 1
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

  // Gerar QR Code
  const safeQrSize = Math.min(120, Math.max(40, qrSize))
  const qrPng = await buildQrPng(validateUrl, safeQrSize)
  const qrImage = await pdfDoc.embedPng(new Uint8Array(qrPng))
  const margin = 10

  const qrPageIndexes: number[] =
    qrPage === 'all'
      ? Array.from({ length: totalPages }, (_, i) => i)
      : qrPage === 'first'
        ? [0]
        : [totalPages - 1]

  // Texto do bloco de assinatura
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const mainSigner = signers.find(s => s?.name?.trim()) ?? null
  const signerName = mainSigner?.name?.trim()?.toUpperCase() ?? 'N/A'
  const signerReg = mainSigner?.reg?.trim() ?? null
  const certType = mainSigner?.certificate_type?.trim() ?? null

  let mainText = `Documento assinado digitalmente de acordo com a ICP-Brasil, MP 2.200-2/2001, no sistema SignFlow, por ${signerName}`
  if (signerReg) mainText += `, ${signerReg}`
  if (certType) mainText += `, certificado ${certType}`
  mainText += ` em ${dateStr} e pode ser validado em ${validateUrl}.`
  if (validationRequiresCode && validationAccessCode) {
    mainText += ` Código de Acesso: ${validationAccessCode}`
  }

  const fontSize = Math.max(5.5, safeQrSize * 0.085)
  const lineHeight = fontSize * 1.45
  const textMaxW = Math.max(160, safeQrSize * 3.2)
  const charsPerLine = Math.floor(textMaxW / (fontSize * 0.52))
  const textLines = wrapText(mainText, charsPerLine)

  const blockPadding = 5
  const blockH = safeQrSize + blockPadding * 2
  const blockW = safeQrSize + textMaxW + margin + blockPadding * 3

  for (const pi of qrPageIndexes) {
    const page = pages[pi]
    const { width: pw, height: ph } = page.getSize()

    let blockX: number, blockY: number
    switch (qrPosition) {
      case 'top-left':     blockX = margin;               blockY = ph - blockH - margin; break
      case 'top-right':    blockX = pw - blockW - margin;  blockY = ph - blockH - margin; break
      case 'bottom-right': blockX = pw - blockW - margin;  blockY = margin; break
      default:             blockX = margin;               blockY = margin
    }

    if (blockX + blockW > pw) blockX = Math.max(0, pw - blockW - margin)

    page.drawRectangle({ x: blockX, y: blockY, width: blockW, height: blockH, color: rgb(1, 1, 1), opacity: 0.95 })
    page.drawRectangle({ x: blockX, y: blockY, width: blockW, height: blockH, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, opacity: 0 })

    const qrX = blockX + blockPadding
    const qrY = blockY + (blockH - safeQrSize) / 2
    page.drawImage(qrImage, { x: qrX, y: qrY, width: safeQrSize, height: safeQrSize })

    const textX = qrX + safeQrSize + blockPadding
    const textStartY = blockY + blockH - blockPadding - (fontSize + 1)

    page.drawText('Assinado Digitalmente', {
      x: textX,
      y: textStartY,
      size: fontSize + 1,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth: textMaxW,
    })

    let curY = textStartY - lineHeight * 1.4
    for (const line of textLines) {
      if (curY < blockY + blockPadding) break
      page.drawText(line, {
        x: textX,
        y: curY,
        size: fontSize,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: textMaxW,
      })
      curY -= lineHeight
    }
  }

  const signedBytes = await pdfDoc.save()
  return { signedBytes, qrPng }
}
