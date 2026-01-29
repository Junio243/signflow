// app/api/upload/route.ts
export const runtime = 'nodejs';

import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/lib/auth/apiAuth';
import { withRateLimit } from '@/lib/utils/rateLimit';
import { logger } from '@/lib/utils/logger';
import { validateFile } from '@/lib/utils/fileValidation';
import {
  documentIdSchema,
  metadataSchema,
  positionSchema,
  signerSchema,
  qrPositionSchema,
  qrPageSchema,
} from '@/lib/validation/documentSchemas';

const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SIGNATURE_SIZE_MB = 5;
const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg'];

/**
 * Convert bytes to megabytes with 2 decimal places
 */
function bytesToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Helper: retorna SHA256 hex do input
 */
async function sha256Hex(input: string) {
  try {
    return createHash('sha256').update(input, 'utf8').digest('hex');
  } catch (error) {
    return Promise.reject(error);
  }
}

/** Helper para parsear JSON com erro legível */
const parseJsonField = (
  raw: string,
  fieldName: string
): { success: true; data: unknown } | { success: false; error: string } => {
  try {
    return { success: true, data: JSON.parse(raw) };
  } catch {
    return { success: false, error: `${fieldName} deve ser um JSON válido` };
  }
};

export async function POST(req: NextRequest) {
  const reqId = randomUUID();
  
  // Rate limiting
  const rateLimitResult = withRateLimit(50, 60000)(req);
  if (rateLimitResult) return rateLimitResult;

  // Authentication
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user!;

  logger.apiRequest('POST', '/api/upload', { reqId, userId: user.id });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const form = await req.formData();

    const pdf = form.get('pdf') as File | null;
    const signature = form.get('signature') as File | null;
    const original_pdf_name = form.get('original_pdf_name')?.toString() || 'documento.pdf';
    const positionsRaw = form.get('positions')?.toString() || '[]';
    const signatureMetaRaw = form.get('signature_meta')?.toString() || 'null';
    const validationThemeRaw = form.get('validation_theme_snapshot')?.toString() || 'null';
    const validationProfileId = form.get('validation_profile_id')?.toString() || null;
    const signersRaw = form.get('signers')?.toString() || '[]';
    const qrPositionRaw = form.get('qr_position')?.toString() || 'bottom-left';
    const qrPageRaw = form.get('qr_page')?.toString() || 'last';
    const validationRequiresCodeRaw = form.get('validation_requires_code')?.toString() || 'false';
    const validationAccessCodeRaw = form.get('validation_access_code')?.toString() || null;

    // Validações do PDF usando novo utilitário
    if (!pdf) {
      logger.warn('Upload failed: PDF missing', { reqId });
      return NextResponse.json({ error: 'PDF é obrigatório' }, { status: 400 });
    }

    const pdfValidation = await validateFile(pdf);
    if (!pdfValidation.valid) {
      logger.warn('Upload failed: PDF validation error', { reqId, error: pdfValidation.error });
      return NextResponse.json({ error: pdfValidation.error }, { status: 400 });
    }

    // Validações da assinatura (opcional)
    if (signature) {
      if (!(signature instanceof File)) {
        return NextResponse.json({ error: 'Assinatura inválida: arquivo não reconhecido.' }, { status: 400 });
      }

      if (!ALLOWED_SIGNATURE_TYPES.includes(signature.type)) {
        return NextResponse.json({ error: 'Assinatura inválida: use imagem PNG ou JPG.' }, { status: 400 });
      }

      if (signature.size > MAX_SIGNATURE_BYTES) {
        const sizeMB = bytesToMB(signature.size);
        return NextResponse.json({ 
          error: `Assinatura muito grande! Tamanho máximo: ${MAX_SIGNATURE_SIZE_MB}MB. Seu arquivo: ${sizeMB}MB.` 
        }, { status: 413 });
      }
    }

    // Gera ID do documento
    const id = documentIdSchema.parse(randomUUID());

    // Gera hash do IP
    const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '0.0.0.0';
    let ip_hash = 'unknown';
    try {
      ip_hash = await sha256Hex(ip);
    } catch (err) {
      logger.warn('IP hash failed', err, { reqId });
      ip_hash = 'error';
    }

    logger.info('Upload started', { reqId, documentId: id, userId: user.id });

    // uploads no Storage
    try {
      const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
      const up1 = await supabaseAdmin.storage
        .from('signflow')
        .upload(`${id}/original.pdf`, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (up1.error) {
        logger.error('PDF upload failed', up1.error, { reqId, documentId: id });
        return NextResponse.json({ error: 'Erro ao fazer upload do PDF' }, { status: 500 });
      }
    } catch (err) {
      logger.error('PDF upload exception', err, { reqId, documentId: id });
      return NextResponse.json({ error: 'Erro ao processar PDF' }, { status: 500 });
    }

    if (signature) {
      try {
        const sigBytes = new Uint8Array(await signature.arrayBuffer());
        const up2 = await supabaseAdmin.storage
          .from('signflow')
          .upload(`${id}/signature`, sigBytes, {
            contentType: signature.type || 'image/png',
            upsert: true,
          });
        if (up2.error) {
          logger.error('Signature upload failed', up2.error, { reqId, documentId: id });
          return NextResponse.json({ error: 'Erro ao fazer upload da assinatura' }, { status: 500 });
        }
      } catch (err) {
        logger.error('Signature upload exception', err, { reqId, documentId: id });
        return NextResponse.json({ error: 'Erro ao processar assinatura' }, { status: 500 });
      }
    }

    // validação de metadados via schemas
    const parsedPositions = parseJsonField(positionsRaw || '[]', 'positions');
    if (!parsedPositions.success || !Array.isArray(parsedPositions.data)) {
      return NextResponse.json(
        { error: parsedPositions.success ? 'positions deve ser um array' : parsedPositions.error },
        { status: 400 }
      );
    }

    const parsedSignatureMeta = parseJsonField(signatureMetaRaw || 'null', 'signature_meta');
    if (!parsedSignatureMeta.success) {
      return NextResponse.json({ error: parsedSignatureMeta.error }, { status: 400 });
    }

    const parsedValidationTheme = parseJsonField(validationThemeRaw || 'null', 'validation_theme_snapshot');
    if (!parsedValidationTheme.success) {
      return NextResponse.json({ error: parsedValidationTheme.error }, { status: 400 });
    }

    const parsedSigners = parseJsonField(signersRaw || '[]', 'signers');
    if (!parsedSigners.success || !Array.isArray(parsedSigners.data)) {
      return NextResponse.json(
        { error: parsedSigners.success ? 'signers deve ser um array' : parsedSigners.error },
        { status: 400 }
      );
    }

    // Validate QR position and page
    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    if (!qrPositionResult.success) {
      return NextResponse.json(
        { error: 'qr_position inválido', details: qrPositionResult.error.format() },
        { status: 400 }
      );
    }
    const qrPosition = qrPositionResult.data;

    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    if (!qrPageResult.success) {
      return NextResponse.json(
        { error: 'qr_page inválido', details: qrPageResult.error.format() },
        { status: 400 }
      );
    }
    const qrPage = qrPageResult.data;

    const validationRequiresCode =
      validationRequiresCodeRaw === 'true' ||
      validationRequiresCodeRaw === '1' ||
      validationRequiresCodeRaw === 'on';
    const validationAccessCode =
      typeof validationAccessCodeRaw === 'string' && validationAccessCodeRaw.trim()
        ? validationAccessCodeRaw.trim().toUpperCase()
        : null;

    if (validationRequiresCode && !validationAccessCode) {
      return NextResponse.json({ error: 'Código de validação é obrigatório.' }, { status: 400 });
    }

    const metadataResult = metadataSchema.safeParse({
      positions: parsedPositions.data,
      signature_meta: parsedSignatureMeta.data,
      validation_theme_snapshot: parsedValidationTheme.data,
      validation_profile_id: validationProfileId,
      validation_requires_code: validationRequiresCode,
      validation_access_code: validationAccessCode,
      signers: parsedSigners.data,
      qr_position: qrPosition,
      qr_page: qrPage,
    });

    if (!metadataResult.success) {
      return NextResponse.json(
        { error: 'Metadados inválidos', details: metadataResult.error.format() },
        { status: 400 }
      );
    }

    const positions = metadataResult.data.positions.map((pos: unknown) => positionSchema.parse(pos));
    const signatureMeta = metadataResult.data.signature_meta ?? null;
    const validationTheme = metadataResult.data.validation_theme_snapshot ?? null;
    const validationProfileIdSanitized = metadataResult.data.validation_profile_id ?? null;
    const sanitizedSigners = (metadataResult.data.signers || []).map((signer: unknown) => signerSchema.parse(signer));
    const validationRequiresCodeSanitized = metadataResult.data.validation_requires_code ?? false;
    const validationAccessCodeSanitized = metadataResult.data.validation_access_code ?? null;

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const metadata: Record<string, any> = { positions };
    if (signatureMeta) metadata.signature_meta = signatureMeta;
    if (validationTheme) metadata.validation_theme_snapshot = validationTheme;
    if (validationProfileIdSanitized) metadata.validation_profile_id = validationProfileIdSanitized;
    if (validationRequiresCodeSanitized) metadata.validation_requires_code = validationRequiresCodeSanitized;
    if (validationAccessCodeSanitized) metadata.validation_access_code = validationAccessCodeSanitized;
    if (sanitizedSigners.length) metadata.signers = sanitizedSigners;
    if (qrPosition) metadata.qr_position = qrPosition;
    if (qrPage) metadata.qr_page = qrPage;

    const basePayload: Record<string, any> = {
      id,
      user_id: user.id, // Use authenticated user ID
      original_pdf_name,
      metadata,
      status: 'draft',
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      signed_pdf_url: null,
      qr_code_url: null,
      ip_hash,
    };

    if (validationTheme) {
      basePayload.validation_theme_snapshot = validationTheme;
    }
    if (validationProfileIdSanitized) {
      basePayload.validation_profile_id = validationProfileIdSanitized;
    }

    let ins = await supabaseAdmin
      .from('documents')
      // @ts-ignore
      .insert(basePayload)
      .select('id')
      .maybeSingle();

    if (ins.error &&
      (ins.error.message?.includes('validation_theme_snapshot') || ins.error.message?.includes('validation_profile_id'))
    ) {
      const fallbackPayload = { ...basePayload };
      delete (fallbackPayload as any).validation_theme_snapshot;
      delete (fallbackPayload as any).validation_profile_id;
      ins = await supabaseAdmin
        .from('documents')
        // @ts-ignore
        .insert(fallbackPayload)
        .select('id')
        .maybeSingle();
    }

    if (ins.error) {
      logger.error('Document insert failed', ins.error, { reqId, documentId: id });
      return NextResponse.json({ error: 'Erro ao salvar documento' }, { status: 500 });
    }

    logger.info('Upload completed successfully', { reqId, documentId: id });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    logger.error('Upload failed with exception', e, { reqId });
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 });
  }
}
