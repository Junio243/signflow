// app/api/sign/route.improved.ts
// This is an improved version of the sign route with security enhancements
// To activate: rename this file to route.ts and backup the old one

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/lib/auth/apiAuth';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';
import { createErrorResponse, ErrorResponses, createSuccessResponse } from '@/lib/utils/errorResponses';
import { createApiLogger } from '@/lib/logger';
import { validateUuid } from '@/lib/utils/validation';
import {
  PDFDocument,
  PDFFont,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rotateRadians,
  translate,
  StandardFonts
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

const logger = createApiLogger('POST /api/sign');

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

function toIsoOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
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

  if (sanitized.length) {
    return sanitized;
  }

  // Fallback logic for old format
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
    const issuer = typeof (theme as any).issuer === 'string' ? (theme as any).issuer.trim() : '';
    const reg = typeof (theme as any).reg === 'string' && (theme as any).reg.trim() ? (theme as any).reg.trim() : null;
    const certificate_type =
      typeof (theme as any).certificate_type === 'string' && (theme as any).certificate_type.trim()
        ? (theme as any).certificate_type.trim()
        : null;
    const certificate_valid_until =
      typeof (theme as any).certificate_valid_until === 'string' && (theme as any).certificate_valid_until.trim()
        ? (theme as any).certificate_valid_until.trim()
        : null;
    const certificate_issuer =
      typeof (theme as any).certificate_issuer === 'string' && (theme as any).certificate_issuer.trim()
        ? (theme as any).certificate_issuer.trim()
        : null;
    const logo_url =
      typeof (theme as any).logo_url === 'string' && (theme as any).logo_url.trim()
        ? (theme as any).logo_url.trim()
        : null;

    return [
      {
        name: issuer || 'Signatário',
        reg,
        certificate_type,
        certificate_valid_until,
        certificate_issuer,
        logo_url,
        email: null,
        metadata: theme as Record<string, unknown>,
      },
    ];
  }

  return [
    {
      name: 'Signatário',
      reg: null,
      certificate_type: null,
      certificate_valid_until: null,
      certificate_issuer: null,
      logo_url: null,
      email: null,
      metadata: null,
    },
  ];
}

function getQrCoordinates(pageWidth: number, pageHeight: number, position: QrPosition, margin: number, qrSize: number) {
  switch (position) {
    case 'bottom-right':
      return { x: pageWidth - margin - qrSize, y: margin };
    case 'top-left':
      return { x: margin, y: pageHeight - margin - qrSize };
    case 'top-right':
      return { x: pageWidth - margin - qrSize, y: pageHeight - margin - qrSize };
    default: // bottom-left
      return { x: margin, y: margin };
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function generateValidationText(
  signerName: string,
  signerReg: string | null,
  certificateSerial: string | null,
  signatureDate: string,
  validateUrl: string,
  accessCode: string | null,
  requiresAccessCode: boolean
): string {
  const regText = signerReg ? `, CPF ${signerReg}` : '';
  const serialText = certificateSerial ? ` número de série ${certificateSerial}` : '';
  const accessText = requiresAccessCode && accessCode ? ` Código de Acesso: ${accessCode}.` : '';

  return `Documento assinado digitalmente de acordo com a ICP-Brasil, MP 2.200-2/2001, no sistema SignFlow, por ${signerName}${regText}, certificado${serialText} em ${signatureDate} e pode ser validado em ${validateUrl}.${accessText}`;
}

export async function POST(req: NextRequest) {
  // Check rate limit (5 signs per minute per IP)
  const rateLimit = checkRateLimit(req, { limit: 5, windowMs: 60000 });
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { retryAfter: rateLimit.retryAfter });
    const response = ErrorResponses.tooManyRequests(rateLimit.retryAfter);
    return addRateLimitHeaders(response, rateLimit);
  }

  // Require authentication
  const auth = await requireAuth(req);
  if (auth.error) {
    logger.warn('Authentication failed');
    return auth.error;
  }

  const user = auth.user;
  logger.info('User authenticated', { userId: user.id });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const form = await req.formData();
    const idRaw = form.get('id')?.toString();
    
    const id = validateUuid(idRaw);
    if (!id) {
      return ErrorResponses.badRequest('ID do documento inválido.');
    }

    logger.info('Signing document', { documentId: id, userId: user.id });

    // Fetch document with authorization check
    const docRes = await supabaseAdmin
      .from('documents')
      .select('id, metadata, signed_pdf_url, qr_code_url, status, user_id')
      .eq('id', id)
      .maybeSingle();

    if (docRes.error) {
      logger.error('Database query failed', docRes.error, { documentId: id });
      return createErrorResponse('Erro ao buscar documento.', 500, docRes.error);
    }

    const doc = docRes.data;
    if (!doc) {
      return ErrorResponses.notFound('Documento');
    }

    // Authorization check: user must own the document
    if (doc.user_id !== user.id) {
      logger.warn('Unauthorized access attempt', { documentId: id, userId: user.id, ownerId: doc.user_id });
      return ErrorResponses.forbidden();
    }

    // Check if already signed
    if (doc.status === 'signed') {
      logger.warn('Document already signed', { documentId: id });
      return ErrorResponses.conflict('Documento já foi assinado.');
    }

    // Download original PDF
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (orig.error || !orig.data) {
      logger.error('Original PDF download failed', orig.error, { documentId: id });
      return createErrorResponse('Erro ao baixar PDF original.', 500, orig.error);
    }

    const originalBytes = new Uint8Array(await orig.data.arrayBuffer());

    // Try to get signature (optional)
    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);
    let sigBytes: Uint8Array | null = null;
    let sigMime = 'image/png';
    if (sig.data) {
      sigBytes = new Uint8Array(await sig.data.arrayBuffer());
      sigMime = sig.data.type || 'image/png';
    }

    // Load PDF
    const pdfDoc = await PDFDocument.load(originalBytes);
    const pages = pdfDoc.getPages();

    // Parse and validate metadata
    const metadataParsed = storedMetadataSchema.safeParse(doc?.metadata);
    if (!metadataParsed.success) {
      logger.error('Invalid metadata', metadataParsed.error, { documentId: id });
      return ErrorResponses.badRequest('Metadados do documento inválidos.');
    }

    const normalizedMetadata: Metadata = Array.isArray(metadataParsed.data)
      ? { positions: metadataParsed.data as Position[] }
      : (metadataParsed.data as Metadata) || { positions: [] };

    const positions = normalizedMetadata.positions || [];
    const signatureMeta: { width?: number; height?: number } | null =
      (normalizedMetadata.signature_meta as any) || null;

    // Embed signature image if exists
    let sigImage: any = null;
    if (sigBytes) {
      sigImage = sigMime.includes('png')
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes);
    }

    // Draw signatures at specified positions
    for (const pos of positions) {
      const pageIndex = Math.min(Math.max((pos.page ?? 1) - 1, 0), pages.length - 1);
      const page = pages[pageIndex];
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      const pageWidthRef = typeof pos.page_width === 'number' && Number.isFinite(pos.page_width)
        ? pos.page_width
        : pageWidth;
      const pageHeightRef = typeof pos.page_height === 'number' && Number.isFinite(pos.page_height)
        ? pos.page_height
        : pageHeight;

      const nx =
        typeof pos.nx === 'number' && Number.isFinite(pos.nx)
          ? Math.max(0, Math.min(1, pos.nx))
          : typeof pos.x === 'number' && Number.isFinite(pos.x)
            ? Math.max(0, Math.min(1, pos.x / pageWidthRef))
            : null;

      const ny =
        typeof pos.ny === 'number' && Number.isFinite(pos.ny)
          ? Math.max(0, Math.min(1, pos.ny))
          : typeof pos.y === 'number' && Number.isFinite(pos.y)
            ? Math.max(0, Math.min(1, pos.y / pageHeightRef))
            : null;

      const normalizedNx = nx !== null ? nx : 0.5;
      const normalizedNy = ny !== null ? ny : 0.5;

      const centerX = normalizedNx * pageWidth;
      const centerY = pageHeight - normalizedNy * pageHeight;

      const scale = typeof pos.scale === 'number' ? pos.scale : 1;
      const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0;

      const baseWidth = signatureMeta?.width || (sigImage?.width ?? 240);
      const baseHeight = signatureMeta?.height || (sigImage?.height ?? 120);
      const width = baseWidth * scale;
      const height = baseHeight * scale;

      if (sigImage) {
        if (rotation) {
          const angle = rotateRadians((rotation * Math.PI) / 180);
          page.pushOperators(pushGraphicsState());
          page.pushOperators(translate(centerX, centerY), angle);
          page.drawImage(sigImage, { x: -width / 2, y: -height / 2, width, height });
          page.pushOperators(popGraphicsState());
        } else {
          page.drawImage(sigImage, {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
          });
        }
      } else {
        const rectWidth = width || 160;
        const rectHeight = height || 64;
        page.drawRectangle({
          x: centerX - rectWidth / 2,
          y: centerY - rectHeight / 2,
          width: rectWidth,
          height: rectHeight,
          color: rgb(0.9, 0.9, 0.9)
        });
      }
    }

    // Generate QR code
    const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const validateUrl = `${base}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { width: 256 });
    const qrImage = await pdfDoc.embedPng(qrPng);
    
    // Extract QR settings
    const qrPositionRaw = (normalizedMetadata as any).qr_position || 'bottom-left';
    const qrPageRaw = (normalizedMetadata as any).qr_page || 'last';
    
    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    const qrPosition: QrPosition = qrPositionResult.success ? qrPositionResult.data : 'bottom-left';
    
    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    const qrPage: QrPage = qrPageResult.success ? qrPageResult.data : 'last';
    
    const margin = 30;
    const qrSize = 80;
    
    // Extract signer information
    const signers = extractSignersFromMetadata(normalizedMetadata);
    const firstSigner = signers[0] || {
      name: 'Signatário',
      reg: null,
      certificate_type: null,
    };
    const requiresAccessCode = (normalizedMetadata as any).validation_requires_code === true;
    const accessCodeRaw = (normalizedMetadata as any).validation_access_code;
    const accessCode =
      typeof accessCodeRaw === 'string' && accessCodeRaw.trim()
        ? accessCodeRaw.trim()
        : null;
    
    // Determine target pages for QR
    let targetPages: any[] = [];
    if (qrPage === 'first') {
      targetPages = [pages[0]];
    } else if (qrPage === 'all') {
      targetPages = pages;
    } else {
      targetPages = [pages[pages.length - 1]];
    }
    
    // Insert QR code and validation text
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 7;
    const textMaxWidth = 200;
    const textMargin = 10;
    const lineSpacing = 2;
    const signatureDate = new Date().toLocaleDateString('pt-BR');
    
    for (const page of targetPages) {
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const coords = getQrCoordinates(pageWidth, pageHeight, qrPosition, margin, qrSize);
      
      page.drawImage(qrImage, { x: coords.x, y: coords.y, width: qrSize, height: qrSize });
      
      const validationText = generateValidationText(
        firstSigner.name,
        firstSigner.reg,
        firstSigner.certificate_type,
        signatureDate,
        validateUrl,
        accessCode,
        requiresAccessCode
      );
      
      const wrappedLines = wrapText(validationText, font, fontSize, textMaxWidth);
      
      let textX = coords.x;
      let textY = coords.y + qrSize - fontSize;
      
      if (qrPosition === 'bottom-right' || qrPosition === 'top-right') {
        const desiredX = coords.x - textMaxWidth - textMargin;
        textX = Math.max(margin, desiredX);
        
        if (textX + textMaxWidth + textMargin > coords.x) {
          continue;
        }
      } else {
        textX = coords.x + qrSize + textMargin;
        
        if (textX + textMaxWidth > pageWidth - margin) {
          continue;
        }
      }
      
      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i];
        const lineY = textY - (i * (fontSize + lineSpacing));
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        
        if (lineY >= margin && 
            lineY <= pageHeight - margin &&
            textX >= margin && 
            textX + lineWidth <= pageWidth - margin) {
          page.drawText(line, {
            x: textX,
            y: lineY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    const signedBytes = await pdfDoc.save();

    // Upload signed PDF and QR
    const upSigned = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/signed.pdf`, signedBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (upSigned.error) {
      logger.error('Signed PDF upload failed', upSigned.error, { documentId: id });
      return createErrorResponse('Erro ao salvar PDF assinado.', 500, upSigned.error);
    }

    const upQr = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/qr.png`, qrPng, {
        contentType: 'image/png',
        upsert: true,
      });

    if (upQr.error) {
      logger.error('QR upload failed', upQr.error, { documentId: id });
      return createErrorResponse('Erro ao salvar QR code.', 500, upQr.error);
    }

    // Get public URLs
    const pubSigned = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/signed.pdf`);
    const pubQr = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);

    if (!pubSigned.data?.publicUrl || !pubQr.data?.publicUrl) {
      logger.error('Failed to generate public URLs', undefined, { documentId: id });
      return ErrorResponses.internalError();
    }

    // Update document status
    const upd = await supabaseAdmin
      .from('documents')
      .update({
        signed_pdf_url: pubSigned.data.publicUrl,
        qr_code_url: pubQr.data.publicUrl,
        status: 'signed',
      })
      .eq('id', id);

    if (upd.error) {
      logger.error('Document update failed', upd.error, { documentId: id });
      return createErrorResponse('Erro ao atualizar documento.', 500, upd.error);
    }

    // Insert signing events
    const nowIso = new Date().toISOString();
    if (signers.length) {
      const payload = signers.map(signer => ({
        document_id: id,
        signer_name: signer.name,
        signer_reg: signer.reg,
        certificate_type: signer.certificate_type,
        certificate_issuer: signer.certificate_issuer,
        signer_email: signer.email,
        signed_at: nowIso,
        certificate_valid_until: toIsoOrNull(signer.certificate_valid_until),
        logo_url: signer.logo_url,
        metadata: signer.metadata,
      }));

      const insEvents = await supabaseAdmin
        .from('document_signing_events')
        // @ts-ignore
        .insert(payload);

      if (insEvents.error) {
        logger.error('Signing events insert failed', insEvents.error, { documentId: id });
        // Don't fail the whole request for this
      }
    }

    logger.info('Document signed successfully', { documentId: id, userId: user.id });

    const response = createSuccessResponse({
      ok: true,
      id,
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url: pubQr.data.publicUrl,
      validate_url: validateUrl,
    });

    return addRateLimitHeaders(response, rateLimit);
  } catch (e: any) {
    logger.error('Unhandled exception', e);
    return ErrorResponses.internalError(e);
  }
}
