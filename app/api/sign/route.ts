// app/api/sign/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/lib/auth/apiAuth';
import { withRateLimit } from '@/lib/utils/rateLimit';
import { logger } from '@/lib/utils/logger';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
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
        name: issuer || 'Signатário',
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

interface TextPosition {
  x: number;
  y: number;
  shouldRender: boolean;
}

/**
 * Calcula posição do texto de validação evitando colisão com QR code
 */
function calculateTextPosition(
  qrPosition: QrPosition,
  qrCoords: { x: number; y: number },
  qrSize: number,
  textMaxWidth: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): TextPosition {
  let textX = qrCoords.x;
  let textY = qrCoords.y + qrSize;
  let shouldRender = true;

  // Tentar posicionar ao lado do QR code
  if (qrPosition === 'bottom-right' || qrPosition === 'top-right') {
    // QR à direita, texto à esquerda
    const desiredX = qrCoords.x - textMaxWidth - margin;
    if (desiredX >= margin) {
      textX = desiredX;
      textY = qrCoords.y + qrSize;
    } else {
      // Não há espaço à esquerda, tentar abaixo
      textX = margin;
      textY = qrCoords.y - margin;
      if (textY < margin + 50) { // 50 = altura estimada do texto
        // Não há espaço abaixo, tentar acima
        textY = qrCoords.y + qrSize + margin;
        if (textY + 50 > pageHeight - margin) {
          shouldRender = false; // Sem espaço disponível
        }
      }
    }
  } else {
    // QR à esquerda, texto à direita
    textX = qrCoords.x + qrSize + margin;
    textY = qrCoords.y + qrSize;
    
    if (textX + textMaxWidth > pageWidth - margin) {
      // Não há espaço à direita, tentar abaixo
      textX = margin;
      textY = qrCoords.y - margin;
      if (textY < margin + 50) {
        // Tentar acima
        textY = qrCoords.y + qrSize + margin;
        if (textY + 50 > pageHeight - margin) {
          shouldRender = false;
        }
      }
    }
  }

  return { x: textX, y: textY, shouldRender };
}

// Function to calculate QR coordinates based on position
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

// Function to wrap text to fit within a given width
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

// Function to generate validation text content
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
  // Rate limiting
  const rateLimitResult = withRateLimit(20, 60000)(req);
  if (rateLimitResult) return rateLimitResult;

  // Authentication
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user!;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const form = await req.formData();
    const idResult = documentIdSchema.safeParse(form.get('id')?.toString());
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const id = idResult.data;

    // Busca e valida status do documento (previne race condition)
    const docRes = await supabaseAdmin
      .from('documents')
      .select('id, metadata, signed_pdf_url, qr_code_url, status, user_id')
      .eq('id', id)
      .maybeSingle();

    if (docRes.error) {
      logger.error('Document fetch failed', docRes.error, { documentId: id, userId: user.id });
      return NextResponse.json({ error: 'Erro ao buscar documento' }, { status: 500 });
    }
    
    const doc = docRes.data;
    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // Verificar se usuário é o dono do documento
    if (doc.user_id !== user.id) {
      logger.warn('Unauthorized sign attempt', { documentId: id, userId: user.id, ownerId: doc.user_id });
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Prevenir assinatura de documento já assinado (race condition)
    if (doc.status === 'signed') {
      return NextResponse.json({ error: 'Documento já foi assinado' }, { status: 409 });
    }

    // baixa o original
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (orig.error || !orig.data) {
      logger.error('Original PDF download failed', orig.error, { documentId: id });
      return NextResponse.json({ error: 'Arquivo original não encontrado' }, { status: 500 });
    }
    const originalBytes = new Uint8Array(await orig.data.arrayBuffer());

    // tenta pegar a assinatura (opcional)
    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);
    let sigBytes: Uint8Array | null = null;
    let sigMime = 'image/png';
    if (sig.data) {
      sigBytes = new Uint8Array(await sig.data.arrayBuffer());
      sigMime = sig.data.type || 'image/png';
    }

    // monta PDF
    const pdfDoc = await PDFDocument.load(originalBytes);
    const pages = pdfDoc.getPages();

    // desenha assinaturas
    const metadataParsed = storedMetadataSchema.safeParse(doc?.metadata);

    if (!metadataParsed.success) {
      logger.error('Invalid metadata', metadataParsed.error, { documentId: id });
      return NextResponse.json({ error: 'Metadados inválidos' }, { status: 400 });
    }

    const normalizedMetadata: Metadata = Array.isArray(metadataParsed.data)
      ? { positions: metadataParsed.data as Position[] }
      : (metadataParsed.data as Metadata) || { positions: [] };

    const positions = normalizedMetadata.positions || [];
    const signatureMeta: { width?: number; height?: number } | null =
      (normalizedMetadata.signature_meta as any) || null;

    let sigImage: any = null;
    if (sigBytes) {
      sigImage = sigMime.includes('png')
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes);
    }

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

    // gera QR e insere nas páginas configuradas
    const base = req.nextUrl.origin; // Usar origin da requisição
    const validateUrl = `${base}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { width: 256 });
    const qrImage = await pdfDoc.embedPng(qrPng);
    
    const qrPositionRaw = (normalizedMetadata as any).qr_position || 'bottom-left';
    const qrPageRaw = (normalizedMetadata as any).qr_page || 'last';
    
    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    const qrPosition: QrPosition = qrPositionResult.success ? qrPositionResult.data : 'bottom-left';
    
    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    const qrPage: QrPage = qrPageResult.success ? qrPageResult.data : 'last';
    
    const margin = 30;
    const qrSize = 80;
    
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
    
    let targetPages: PDFPage[] = [];
    if (qrPage === 'first') {
      targetPages = [pages[0]];
    } else if (qrPage === 'all') {
      targetPages = pages;
    } else {
      targetPages = [pages[pages.length - 1]];
    }
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 7;
    const textMaxWidth = 200;
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
      
      // Usar nova função de posicionamento
      const textPos = calculateTextPosition(
        qrPosition,
        coords,
        qrSize,
        textMaxWidth,
        margin,
        pageWidth,
        pageHeight
      );
      
      if (!textPos.shouldRender) {
        logger.warn('Text rendering skipped: insufficient space', { documentId: id, qrPosition });
        continue;
      }
      
      let textY = textPos.y;
      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i];
        const lineY = textY - (i * (fontSize + lineSpacing));
        
        if (lineY >= margin && lineY <= pageHeight - margin) {
          page.drawText(line, {
            x: textPos.x,
            y: lineY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    const signedBytes = await pdfDoc.save();

    // sobe arquivos gerados
    const upSigned = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/signed.pdf`, signedBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (upSigned.error) {
      logger.error('Signed PDF upload failed', upSigned.error, { documentId: id });
      return NextResponse.json({ error: 'Erro ao salvar documento assinado' }, { status: 500 });
    }

    const upQr = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/qr.png`, qrPng, {
        contentType: 'image/png',
        upsert: true,
      });
    if (upQr.error) {
      logger.error('QR code upload failed', upQr.error, { documentId: id });
      return NextResponse.json({ error: 'Erro ao salvar QR code' }, { status: 500 });
    }

    const pubSigned = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/signed.pdf`);
    if (!pubSigned.data?.publicUrl) {
      logger.error('Failed to generate signed PDF public URL', undefined, { documentId: id });
      return NextResponse.json({ error: 'Erro ao gerar URL do documento' }, { status: 500 });
    }

    const pubQr = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);
    if (!pubQr.data?.publicUrl) {
      logger.error('Failed to generate QR code public URL', undefined, { documentId: id });
      return NextResponse.json({ error: 'Erro ao gerar URL do QR code' }, { status: 500 });
    }

    // atualiza registro
    // @ts-ignore
    const upd = await supabaseAdmin
      .from('documents')
      .update({
        signed_pdf_url: pubSigned.data.publicUrl,
        qr_code_url: pubQr.data.publicUrl,
        status: 'signed',
      })
      .eq('id', id);

    if (upd.error) {
      logger.error('Document status update failed', upd.error, { documentId: id });
      return NextResponse.json({ error: 'Erro ao atualizar status do documento' }, { status: 500 });
    }

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

      // @ts-ignore
      const insEvents = await supabaseAdmin
        .from('document_signing_events')
        .insert(payload);

      if (insEvents.error) {
        logger.error('Signing event insert failed', insEvents.error, { documentId: id });
        // Não retornar erro, já que o documento foi assinado com sucesso
      }
    }

    logger.info('Document signed successfully', { documentId: id, userId: user.id });

    return NextResponse.json({
      ok: true,
      id,
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url: pubQr.data.publicUrl,
      validate_url: validateUrl,
    });
  } catch (e: any) {
    logger.error('Sign operation failed', e);
    return NextResponse.json({ error: 'Erro ao processar assinatura' }, { status: 500 });
  }
}
