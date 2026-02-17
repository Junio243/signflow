// app/api/sign/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rotateRadians,
  translate,
  StandardFonts,
} from 'pdf-lib';
import QRCode from 'qrcode';
import {
  Metadata,
  Position,
  documentIdSchema,
  storedMetadataSchema,
  qrPositionSchema,
  qrPageSchema,
  QrPosition,
  QrPage,
} from '@/lib/validation/documentSchemas';
import { createRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { signPdfComplete, isCertificateConfigured } from '@/lib/digitalSignature';
import crypto from 'crypto';

// ── tipos ──────────────────────────────────────────────────────────────────
type SignerMetadata = {
  name: string;
  reg: string | null;
  certificate_type: string | null;
  certificate_valid_until: string | null;
  certificate_issuer: string | null;
  logo_url: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
};

type TextAnnotation = {
  id: string;
  page: number;
  text: string;
  nx: number;
  ny: number;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
};

// ── helpers ─────────────────────────────────────────────────────────────────
function toIsoOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

/** Converte hex (#rrggbb ou #rgb) para rgb() normalizado 0-1 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function extractSignersFromMetadata(metadata: Metadata): SignerMetadata[] {
  const sanitized = (metadata.signers || []).map(signer => ({
    name: signer.name,
    reg: signer.reg ?? null,
    certificate_type: signer.certificate_type ?? null,
    certificate_valid_until: signer.certificate_valid_until ?? null,
    certificate_issuer: signer.certificate_issuer ?? null,
    logo_url: signer.logo_url ?? null,
    email: signer.email ?? null,
    metadata: signer as Record<string, unknown>,
  } satisfies SignerMetadata));

  if (sanitized.length) return sanitized;

  type MetadataWithTheme = Metadata & {
    validation_theme_snapshot?: Record<string, unknown>;
    theme?: Record<string, unknown>;
  };
  const metadataTyped = metadata as MetadataWithTheme;
  const theme =
    (metadataTyped.validation_theme_snapshot && typeof metadataTyped.validation_theme_snapshot === 'object'
      ? metadataTyped.validation_theme_snapshot
      : null) ||
    (metadataTyped.theme && typeof metadataTyped.theme === 'object' ? metadataTyped.theme : null);

  if (theme && typeof theme === 'object') {
    const t = theme as any;
    return [{
      name: (typeof t.issuer === 'string' ? t.issuer.trim() : '') || 'Signatário',
      reg: t.reg?.trim() || null,
      certificate_type: t.certificate_type?.trim() || null,
      certificate_valid_until: t.certificate_valid_until?.trim() || null,
      certificate_issuer: t.certificate_issuer?.trim() || null,
      logo_url: t.logo_url?.trim() || null,
      email: null,
      metadata: theme as Record<string, unknown>,
    }];
  }

  return [{ name: 'Signatário', reg: null, certificate_type: null, certificate_valid_until: null, certificate_issuer: null, logo_url: null, email: null, metadata: null }];
}

function getQrCoordinates(
  pageWidth: number,
  pageHeight: number,
  position: QrPosition,
  margin: number,
  qrSize: number,
) {
  switch (position) {
    case 'bottom-right': return { x: pageWidth - margin - qrSize, y: margin };
    case 'top-left':     return { x: margin, y: pageHeight - margin - qrSize };
    case 'top-right':    return { x: pageWidth - margin - qrSize, y: pageHeight - margin - qrSize };
    default:             return { x: margin, y: margin };
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function generateValidationText(
  signerName: string,
  signerReg: string | null,
  certificateSerial: string | null,
  signatureDate: string,
  validateUrl: string,
  accessCode: string | null,
  requiresAccessCode: boolean,
): string {
  const regText = signerReg ? `, CPF ${signerReg}` : '';
  const serialText = certificateSerial ? ` número de série ${certificateSerial}` : '';
  const accessText = requiresAccessCode && accessCode ? ` Código de Acesso: ${accessCode}.` : '';
  return `Documento assinado digitalmente de acordo com a ICP-Brasil, MP 2.200-2/2001, no sistema SignFlow, por ${signerName}${regText}, certificado${serialText} em ${signatureDate} e pode ser validado em ${validateUrl}.${accessText}`;
}

/**
 * Renderiza as anotações de texto diretamente nas páginas do PDF.
 * Suporta multi-linha, negrito (via HelveticaBold), cor e alinhamento.
 */
async function applyTextAnnotations(
  pdfDoc: PDFDocument,
  pages: PDFPage[],
  annotations: TextAnnotation[],
): Promise<void> {
  if (!annotations.length) return;

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  for (const ann of annotations) {
    const pageIndex = Math.min(Math.max((ann.page ?? 1) - 1, 0), pages.length - 1);
    const page = pages[pageIndex];
    const pageWidth  = page.getWidth();
    const pageHeight = page.getHeight();

    // posição normalizada → coordenadas PDF (origem = canto inferior esquerdo)
    const x = (ann.nx ?? 0.5) * pageWidth;
    // PDF: y=0 embaixo; canvas: y=0 em cima → inverter
    const y = pageHeight - (ann.ny ?? 0.5) * pageHeight;

    const fontSize = typeof ann.fontSize === 'number' && ann.fontSize > 0 ? ann.fontSize : 12;
    const { r, g, b } = hexToRgb(ann.color || '#111827');
    const color = rgb(r, g, b);

    // escolhe a fonte
    let font: PDFFont;
    if (ann.bold && ann.italic)  font = boldItalicFont;
    else if (ann.bold)           font = boldFont;
    else if (ann.italic)         font = italicFont;
    else                         font = regularFont;

    // quebra de linha manual (\n)
    const rawLines = (ann.text || '').split('\n');
    const lineHeight = fontSize * 1.35;
    let offsetY = 0;

    for (const rawLine of rawLines) {
      // também quebra por comprimento máximo (80% da largura da página)
      const wrapped = wrapText(rawLine, font, fontSize, pageWidth * 0.8);
      for (const line of wrapped) {
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        let drawX = x;
        if (ann.align === 'center') drawX = x - lineWidth / 2;
        else if (ann.align === 'right') drawX = x - lineWidth;

        // garante que não sai da página
        const clampedX = Math.max(10, Math.min(pageWidth - lineWidth - 10, drawX));
        const clampedY = Math.max(10, Math.min(pageHeight - fontSize - 10, y - offsetY));

        page.drawText(line, { x: clampedX, y: clampedY, size: fontSize, font, color });
        offsetY += lineHeight;
      }
    }
  }
}

const rateLimiter = createRateLimiter('/api/sign', {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
  message: 'Limite de assinatura excedido. Máximo de 20 assinaturas por hora.',
});

// ── handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimiter(req);
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const form = await req.formData();
    const idResult = documentIdSchema.safeParse(form.get('id')?.toString());
    if (!idResult.success) {
      return NextResponse.json({ error: 'id é obrigatório e deve ser um UUID válido' }, { status: 400 });
    }
    const id = idResult.data;

    const docRes = await supabaseAdmin
      .from('documents')
      .select('id, metadata, signed_pdf_url, qr_code_url, status')
      .eq('id', id)
      .maybeSingle();

    if (docRes.error) return NextResponse.json({ error: docRes.error.message }, { status: 500 });
    const doc = (docRes.data || null) as any;
    if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

    // ── carrega arquivos do storage ───────────────────────────────────────
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (orig.error || !orig.data) {
      return NextResponse.json({ error: orig.error?.message || 'original.pdf não encontrado' }, { status: 500 });
    }
    const originalBytes = new Uint8Array(await orig.data.arrayBuffer());

    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);
    let sigBytes: Uint8Array | null = null;
    let sigMime = 'image/png';
    if (sig.data) {
      sigBytes = new Uint8Array(await sig.data.arrayBuffer());
      sigMime = sig.data.type || 'image/png';
    }

    // ── carrega e valida metadados ────────────────────────────────────────
    const pdfDoc = await PDFDocument.load(originalBytes);
    const pages  = pdfDoc.getPages();

    const metadataParsed = storedMetadataSchema.safeParse(doc?.metadata);
    if (!metadataParsed.success) {
      return NextResponse.json({ error: 'Metadados inválidos' }, { status: 400 });
    }

    const normalizedMetadata: Metadata = Array.isArray(metadataParsed.data)
      ? { positions: metadataParsed.data as Position[] }
      : (metadataParsed.data as Metadata) || { positions: [] };

    const positions      = normalizedMetadata.positions || [];
    const signatureMeta: { width?: number; height?: number } | null = (normalizedMetadata.signature_meta as any) || null;

    // ── incorpora assinatura visual ───────────────────────────────────────
    let sigImage: any = null;
    if (sigBytes) {
      sigImage = sigMime.includes('png')
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes);
    }

    for (const pos of positions) {
      const pageIndex = Math.min(Math.max((pos.page ?? 1) - 1, 0), pages.length - 1);
      const page = pages[pageIndex];
      const pageWidth  = page.getWidth();
      const pageHeight = page.getHeight();

      const pageWidthRef  = typeof pos.page_width  === 'number' && Number.isFinite(pos.page_width)  ? pos.page_width  : pageWidth;
      const pageHeightRef = typeof pos.page_height === 'number' && Number.isFinite(pos.page_height) ? pos.page_height : pageHeight;

      const nx = typeof pos.nx === 'number' && Number.isFinite(pos.nx)
        ? Math.max(0, Math.min(1, pos.nx))
        : typeof pos.x === 'number' && Number.isFinite(pos.x)
          ? Math.max(0, Math.min(1, pos.x / pageWidthRef))
          : null;

      const ny = typeof pos.ny === 'number' && Number.isFinite(pos.ny)
        ? Math.max(0, Math.min(1, pos.ny))
        : typeof pos.y === 'number' && Number.isFinite(pos.y)
          ? Math.max(0, Math.min(1, pos.y / pageHeightRef))
          : null;

      const normalizedNx = nx !== null ? nx : 0.5;
      const normalizedNy = ny !== null ? ny : 0.5;

      const centerX = normalizedNx * pageWidth;
      const centerY = pageHeight - normalizedNy * pageHeight;

      const scale    = typeof pos.scale    === 'number' ? pos.scale    : 1;
      const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0;

      const baseWidth  = signatureMeta?.width  || (sigImage?.width  ?? 240);
      const baseHeight = signatureMeta?.height || (sigImage?.height ?? 120);
      const width  = baseWidth  * scale;
      const height = baseHeight * scale;

      if (sigImage) {
        if (rotation) {
          const angle = rotateRadians((rotation * Math.PI) / 180);
          page.pushOperators(pushGraphicsState());
          page.pushOperators(translate(centerX, centerY), angle);
          page.drawImage(sigImage, { x: -width / 2, y: -height / 2, width, height });
          page.pushOperators(popGraphicsState());
        } else {
          page.drawImage(sigImage, { x: centerX - width / 2, y: centerY - height / 2, width, height });
        }
      } else {
        page.drawRectangle({
          x: centerX - (width || 160) / 2,
          y: centerY - (height || 64) / 2,
          width: width || 160,
          height: height || 64,
          color: rgb(0.9, 0.9, 0.9),
        });
      }
    }

    // ── ✨ anotações de texto ──────────────────────────────────────────────
    const rawAnnotations = (normalizedMetadata as any).text_annotations;
    const textAnnotations: TextAnnotation[] = Array.isArray(rawAnnotations)
      ? rawAnnotations.filter(
          (a): a is TextAnnotation =>
            a && typeof a.text === 'string' && a.text.trim().length > 0,
        )
      : [];

    await applyTextAnnotations(pdfDoc, pages, textAnnotations);

    // ── QR Code ───────────────────────────────────────────────────────────
    const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const validateUrl = `${base}/validate/${id}`;
    const qrPng   = await QRCode.toBuffer(validateUrl, { width: 256 });
    const qrImage = await pdfDoc.embedPng(qrPng);

    const qrPositionRaw = (normalizedMetadata as any).qr_position || 'bottom-left';
    const qrPageRaw     = (normalizedMetadata as any).qr_page     || 'last';
    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    const qrPosition: QrPosition = qrPositionResult.success ? qrPositionResult.data : 'bottom-left';
    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    const qrPage: QrPage = qrPageResult.success ? qrPageResult.data : 'last';

    const margin = 30;
    const qrSize = 80;

    const signers     = extractSignersFromMetadata(normalizedMetadata);
    const firstSigner = signers[0] || { name: 'Signatário', reg: null, certificate_type: null, email: null, logo_url: null, certificate_issuer: null, certificate_valid_until: null, metadata: null };
    const requiresAccessCode = (normalizedMetadata as any).validation_requires_code === true;
    const accessCodeRaw      = (normalizedMetadata as any).validation_access_code;
    const accessCode = typeof accessCodeRaw === 'string' && accessCodeRaw.trim() ? accessCodeRaw.trim() : null;

    let targetPages: PDFPage[];
    if (qrPage === 'first')      targetPages = [pages[0]];
    else if (qrPage === 'all')   targetPages = pages;
    else                         targetPages = [pages[pages.length - 1]];

    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 7;
    const textMaxWidth  = 200;
    const textMargin    = 10;
    const lineSpacing   = 2;
    const signatureDate = new Date().toLocaleDateString('pt-BR');

    for (const page of targetPages) {
      const pageWidth  = page.getWidth();
      const pageHeight = page.getHeight();
      const coords = getQrCoordinates(pageWidth, pageHeight, qrPosition, margin, qrSize);

      page.drawImage(qrImage, { x: coords.x, y: coords.y, width: qrSize, height: qrSize });

      const validationText = generateValidationText(
        firstSigner.name, firstSigner.reg, firstSigner.certificate_type,
        signatureDate, validateUrl, accessCode, requiresAccessCode,
      );

      const wrappedLines = wrapText(validationText, font, fontSize, textMaxWidth);
      let textX: number;
      let textY: number;

      if (qrPosition === 'bottom-right' || qrPosition === 'top-right') {
        const desiredX = coords.x - textMaxWidth - textMargin;
        textX = Math.max(margin, desiredX);
        if (textX + textMaxWidth + textMargin > coords.x) continue;
      } else {
        textX = coords.x + qrSize + textMargin;
        if (textX + textMaxWidth > pageWidth - margin) continue;
      }
      textY = coords.y + qrSize - fontSize;

      for (let i = 0; i < wrappedLines.length; i++) {
        const line  = wrappedLines[i];
        const lineY = textY - (i * (fontSize + lineSpacing));
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        if (lineY >= margin && lineY <= pageHeight - margin && textX >= margin && textX + lineWidth <= pageWidth - margin) {
          page.drawText(line, { x: textX, y: lineY, size: fontSize, font, color: rgb(0, 0, 0) });
        }
      }
    }

    // ── página final de assinatura ────────────────────────────────────────
    const lastPage      = pdfDoc.addPage();
    const lastPageWidth = lastPage.getWidth();
    const lastPageHeight = lastPage.getHeight();
    const marginPage    = 50;
    let currentY        = lastPageHeight - marginPage;

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    lastPage.drawText('Assinado digitalmente por:', { x: marginPage, y: currentY, size: 12, font: titleFont, color: rgb(0, 0, 0) });
    currentY -= 30;
    lastPage.drawText(firstSigner.name, { x: marginPage, y: currentY, size: 14, font: titleFont, color: rgb(0, 0, 0) });
    currentY -= 25;
    lastPage.drawText(`Data: ${new Date().toLocaleString('pt-BR')}`, { x: marginPage, y: currentY, size: 10, font, color: rgb(0, 0, 0) });
    currentY -= 20;
    if (firstSigner.reg) {
      lastPage.drawText(`CPF: ${firstSigner.reg}`, { x: marginPage, y: currentY, size: 10, font, color: rgb(0, 0, 0) });
      currentY -= 20;
    }
    if (firstSigner.certificate_type) {
      lastPage.drawText(`Certificado: ${firstSigner.certificate_type}`, { x: marginPage, y: currentY, size: 10, font, color: rgb(0, 0, 0) });
      currentY -= 20;
    }
    currentY -= 10;
    if (textAnnotations.length > 0) {
      lastPage.drawText(`Anotações de texto inseridas: ${textAnnotations.length}`, { x: marginPage, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
      currentY -= 20;
    }

    const fullValidationText = generateValidationText(
      firstSigner.name, firstSigner.reg, firstSigner.certificate_type,
      signatureDate, validateUrl, accessCode, requiresAccessCode,
    );
    const validationLines = wrapText(fullValidationText, font, 9, lastPageWidth - marginPage * 2);
    for (const line of validationLines) {
      lastPage.drawText(line, { x: marginPage, y: currentY, size: 9, font, color: rgb(0, 0, 0) });
      currentY -= 14;
    }

    // ── salva PDF ────────────────────────────────────────────────────────
    let finalPdfBytes = await pdfDoc.save();

    // assinatura PKI (se configurada)
    let hasCertificate = false;
    try {
      hasCertificate = await isCertificateConfigured();
      if (hasCertificate) {
        console.log('🔐 Aplicando assinatura digital PKI...');
        finalPdfBytes = await signPdfComplete(Buffer.from(finalPdfBytes), {
          reason: 'Documento assinado digitalmente via SignFlow',
          contactInfo: 'suporte@signflow.com',
          name: firstSigner.name || 'SignFlow Digital Signature',
          location: 'SignFlow Platform',
        });
        console.log('✅ Assinatura digital PKI aplicada com sucesso!');
      }
    } catch (certError) {
      console.warn('⚠️ Erro ao aplicar assinatura PKI, continuando sem ela:', certError);
      hasCertificate = false;
    }

    const documentHash = crypto.createHash('sha256').update(finalPdfBytes).digest('hex');
    console.log('✅ Hash final do documento calculado:', documentHash);

    // ── upload dos arquivos finais ───────────────────────────────────────
    const upSigned = await supabaseAdmin.storage.from('signflow').upload(`${id}/signed.pdf`, finalPdfBytes, { contentType: 'application/pdf', upsert: true });
    if (upSigned.error) return NextResponse.json({ error: upSigned.error.message }, { status: 500 });

    const upQr = await supabaseAdmin.storage.from('signflow').upload(`${id}/qr.png`, qrPng, { contentType: 'image/png', upsert: true });
    if (upQr.error) return NextResponse.json({ error: upQr.error.message }, { status: 500 });

    const pubSigned = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/signed.pdf`);
    const pubQr     = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);

    if (!pubSigned.data?.publicUrl || !pubQr.data?.publicUrl) {
      return NextResponse.json({ error: 'Falha ao gerar URLs públicas.' }, { status: 500 });
    }

    const upd = await supabaseAdmin.from('documents').update({
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url:    pubQr.data.publicUrl,
      status:         'signed',
    }).eq('id', id);
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

    const nowIso = new Date().toISOString();

    // ── salva registro de assinatura ─────────────────────────────────────
    const signatureData = {
      document_id:    id,
      document_hash:  documentHash,
      signer_name:    firstSigner.name,
      signer_email:   firstSigner.email,
      signature_type: hasCertificate ? 'digital_pki' : 'visual',
      signature_data: {
        signerName:          firstSigner.name,
        signerReg:           firstSigner.reg,
        signerEmail:         firstSigner.email,
        certificateType:     firstSigner.certificate_type,
        certificateIssuer:   firstSigner.certificate_issuer || 'SignFlow',
        signatureAlgorithm:  hasCertificate ? 'RSA-SHA256' : 'Visual',
        documentHash,
        textAnnotationsCount: textAnnotations.length,
      },
      signed_at: nowIso,
      status:    'completed',
    };

    const { data: existingSig } = await supabaseAdmin.from('signatures').select('id').eq('document_id', id).maybeSingle();
    const sigResult = existingSig
      ? await supabaseAdmin.from('signatures').update(signatureData).eq('id', existingSig.id)
      : await supabaseAdmin.from('signatures').insert(signatureData);
    if (sigResult.error) console.warn('⚠️ Erro ao salvar assinatura:', sigResult.error);

    if (signers.length) {
      await supabaseAdmin.from('document_signing_events').delete().eq('document_id', id);
      const payload = signers.map(signer => ({
        document_id:              id,
        signer_name:              signer.name,
        signer_reg:               signer.reg,
        certificate_type:         signer.certificate_type,
        certificate_issuer:       signer.certificate_issuer,
        signer_email:             signer.email,
        signed_at:                nowIso,
        certificate_valid_until:  toIsoOrNull(signer.certificate_valid_until),
        logo_url:                 signer.logo_url,
        metadata:                 signer.metadata,
      }));
      const insEvents = await supabaseAdmin.from('document_signing_events').insert(payload);
      if (insEvents.error) return NextResponse.json({ error: insEvents.error.message }, { status: 500 });
    }

    const response = NextResponse.json({
      ok: true,
      id,
      signed_pdf_url:           pubSigned.data.publicUrl,
      qr_code_url:              pubQr.data.publicUrl,
      validate_url:             validateUrl,
      digital_signature_applied: hasCertificate,
      document_hash:            documentHash,
      text_annotations_applied: textAnnotations.length,
    });
    return addRateLimitHeaders(response, rateLimitResult.headers);
  } catch (e: any) {
    console.error('❌ Erro ao assinar documento:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
