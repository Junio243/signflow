// app/api/upload/route.ts
export const runtime = 'nodejs';

import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/lib/auth/apiAuth';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';
import { validateUploadedFile } from '@/lib/validation/fileValidation';
import { createErrorResponse, ErrorResponses, createSuccessResponse } from '@/lib/utils/errorResponses';
import { createApiLogger } from '@/lib/logger';
import {
  documentIdSchema,
  metadataSchema,
  positionSchema,
  signerSchema,
  qrPositionSchema,
  qrPageSchema,
} from '@/lib/validation/documentSchemas';

const logger = createApiLogger('POST /api/upload');

const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg'];

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
  logger.info('Request received', { reqId });

  // Check rate limit (10 uploads per minute per IP)
  const rateLimit = checkRateLimit(req, { limit: 10, windowMs: 60000 });
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { reqId, retryAfter: rateLimit.retryAfter });
    const response = ErrorResponses.tooManyRequests(rateLimit.retryAfter);
    return addRateLimitHeaders(response, rateLimit);
  }

  // Require authentication
  const auth = await requireAuth(req);
  if (auth.error) {
    logger.warn('Authentication failed', { reqId });
    return auth.error;
  }

  const user = auth.user;
  logger.info('User authenticated', { reqId, userId: user.id });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Extract client IP
    const ipHeader =
      (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || (req as any).ip) ?? '';
    const ip = ipHeader ? (ipHeader as string).split(',')[0].trim() : '0.0.0.0';

    const form = await req.formData();

    // Extract form fields
    const pdf = form.get('pdf') as File | null;
    const signature = form.get('signature') as File | null;
    const original_pdf_name =
      form.get('original_pdf_name')?.toString() || 'documento.pdf';
    const positionsRaw = form.get('positions')?.toString() || '[]';
    const signatureMetaRaw = form.get('signature_meta')?.toString() || 'null';
    const validationThemeRaw = form.get('validation_theme_snapshot')?.toString() || 'null';
    const validationProfileId = form.get('validation_profile_id')?.toString() || null;
    const signersRaw = form.get('signers')?.toString() || '[]';
    const qrPositionRaw = form.get('qr_position')?.toString() || 'bottom-left';
    const qrPageRaw = form.get('qr_page')?.toString() || 'last';
    const validationRequiresCodeRaw = form.get('validation_requires_code')?.toString() || 'false';
    const validationAccessCodeRaw = form.get('validation_access_code')?.toString() || null;

    logger.info('Form data extracted', {
      reqId,
      original_pdf_name,
      hasSignature: !!signature,
      userId: user.id,
    });

    // Validate PDF file using new utility
    const pdfValidation = await validateUploadedFile(pdf);
    if (!pdfValidation.valid) {
      logger.warn('PDF validation failed', { reqId, error: pdfValidation.error });
      return ErrorResponses.badRequest(pdfValidation.error);
    }

    // Validate signature if provided
    if (signature) {
      if (!(signature instanceof File)) {
        return ErrorResponses.badRequest('Assinatura inválida: arquivo não reconhecido.');
      }

      if (!ALLOWED_SIGNATURE_TYPES.includes(signature.type)) {
        return ErrorResponses.badRequest('Assinatura inválida: use imagem PNG ou JPG.');
      }

      if (signature.size > MAX_SIGNATURE_BYTES) {
        const sizeMB = (signature.size / (1024 * 1024)).toFixed(2);
        return ErrorResponses.badRequest(
          `Assinatura muito grande! Tamanho máximo: 5MB. Seu arquivo: ${sizeMB}MB.`
        );
      }

      logger.info('Signature validated', {
        reqId,
        size: signature.size,
        type: signature.type,
      });
    }

    // Generate document ID
    const id = documentIdSchema.parse(randomUUID());

    // Generate IP hash
    let ip_hash = 'unknown';
    try {
      ip_hash = await sha256Hex(ip);
    } catch (err) {
      logger.warn('IP hash failed', { reqId, error: err });
      ip_hash = 'error';
    }

    logger.info('Starting upload', { reqId, documentId: id });

    // Upload PDF to storage
    try {
      const pdfBytes = new Uint8Array(await pdfValidation.file!.arrayBuffer());
      const up1 = await supabaseAdmin.storage
        .from('signflow')
        .upload(`${id}/original.pdf`, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (up1.error) {
        logger.error('PDF upload failed', up1.error, { reqId, documentId: id });
        return createErrorResponse(
          'Erro ao fazer upload do PDF.',
          500,
          up1.error,
          { documentId: id }
        );
      }

      logger.info('PDF uploaded successfully', { reqId, documentId: id });
    } catch (err) {
      logger.error('PDF upload exception', err, { reqId, documentId: id });
      return ErrorResponses.internalError(err, { documentId: id });
    }

    // Upload signature if provided
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
          return createErrorResponse(
            'Erro ao fazer upload da assinatura.',
            500,
            up2.error,
            { documentId: id }
          );
        }

        logger.info('Signature uploaded successfully', { reqId, documentId: id });
      } catch (err) {
        logger.error('Signature upload exception', err, { reqId, documentId: id });
        return ErrorResponses.internalError(err, { documentId: id });
      }
    }

    // Parse and validate metadata
    const parsedPositions = parseJsonField(positionsRaw || '[]', 'positions');
    if (!parsedPositions.success || !Array.isArray(parsedPositions.data)) {
      return ErrorResponses.badRequest(
        parsedPositions.success ? 'positions deve ser um array' : parsedPositions.error
      );
    }

    const parsedSignatureMeta = parseJsonField(signatureMetaRaw || 'null', 'signature_meta');
    if (!parsedSignatureMeta.success) {
      return ErrorResponses.badRequest(parsedSignatureMeta.error);
    }

    const parsedValidationTheme = parseJsonField(validationThemeRaw || 'null', 'validation_theme_snapshot');
    if (!parsedValidationTheme.success) {
      return ErrorResponses.badRequest(parsedValidationTheme.error);
    }

    const parsedSigners = parseJsonField(signersRaw || '[]', 'signers');
    if (!parsedSigners.success || !Array.isArray(parsedSigners.data)) {
      return ErrorResponses.badRequest(
        parsedSigners.success ? 'signers deve ser um array' : parsedSigners.error
      );
    }

    // Validate QR position and page
    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    if (!qrPositionResult.success) {
      return ErrorResponses.badRequest('qr_position inválido');
    }
    const qrPosition = qrPositionResult.data;

    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    if (!qrPageResult.success) {
      return ErrorResponses.badRequest('qr_page inválido');
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
      return ErrorResponses.badRequest('Código de validação é obrigatório.');
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
      logger.warn('Metadata validation failed', { reqId, error: metadataResult.error });
      return ErrorResponses.badRequest('Metadados inválidos');
    }

    // Build metadata object
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

    logger.info('Inserting document record', { reqId, documentId: id });

    let ins = await supabaseAdmin
      .from('documents')
      // @ts-ignore (evita never do types gerados no build)
      .insert(basePayload)
      .select('id')
      .maybeSingle();

    if (ins.error &&
      (ins.error.message?.includes('validation_theme_snapshot') || ins.error.message?.includes('validation_profile_id'))
    ) {
      logger.warn('Retrying insert without validation fields', { reqId, documentId: id });
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
      logger.error('Database insert failed', ins.error, { reqId, documentId: id });
      return createErrorResponse(
        'Erro ao salvar documento.',
        500,
        ins.error,
        { documentId: id }
      );
    }

    logger.info('Upload completed successfully', { reqId, documentId: id });

    const response = createSuccessResponse({ ok: true, id });
    return addRateLimitHeaders(response, rateLimit);
  } catch (e: any) {
    logger.error('Unhandled exception', e, { reqId });
    return ErrorResponses.internalError(e, { reqId });
  }
}
