// app/api/upload/route.ts
export const runtime = 'nodejs';

import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  documentIdSchema,
  metadataSchema,
  positionSchema,
  signerSchema,
} from '@/lib/validation/documentSchemas';

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_PDF_SIZE_MB = 20;
const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SIGNATURE_SIZE_MB = 5;
const ALLOWED_PDF_TYPES = ['application/pdf'];
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

/**
 * Logging estruturado em JSON.
 * Um log básico com reqId/time e payload.
 */
function structuredLog(level: 'info' | 'warn' | 'error', ctx: Record<string, any>) {
  const base = {
    time: new Date().toISOString(),
    ...ctx,
  };
  const str = JSON.stringify(base);
  if (level === 'error') {
    console.error(str);
  } else if (level === 'warn') {
    console.warn(str);
  } else {
    console.info(str);
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
  const baseCtx = { reqId, route: 'POST /api/upload' };

  structuredLog('info', { ...baseCtx, event: 'request_received' });

  try {
    const supabaseAdmin = getSupabaseAdmin(); // ← client dentro do handler

    // Extração robusta do IP (x-forwarded-for pode ser lista)
    const ipHeader =
      (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || (req as any).ip) ?? '';
    const ip = ipHeader ? (ipHeader as string).split(',')[0].trim() : '0.0.0.0';
    structuredLog('info', { ...baseCtx, event: 'client_ip', ip });

    const form = await req.formData();

    const pdf = form.get('pdf') as File | null;
    const signature = form.get('signature') as File | null;
    const original_pdf_name =
      form.get('original_pdf_name')?.toString() || 'documento.pdf';
    const positionsRaw = form.get('positions')?.toString() || '[]';
    const signatureMetaRaw = form.get('signature_meta')?.toString() || 'null';
    const validationThemeRaw = form.get('validation_theme_snapshot')?.toString() || 'null';
    const validationProfileId = form.get('validation_profile_id')?.toString() || null;
    const userId = form.get('user_id')?.toString() || null;
    const signersRaw = form.get('signers')?.toString() || '[]';

    structuredLog('info', {
      ...baseCtx,
      event: 'form_received',
      original_pdf_name,
      hasSignature: !!signature,
      validationProfileId,
      userId,
    });

    // Validações do PDF
    if (!pdf) {
      structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'pdf_missing' });
      return NextResponse.json({ error: 'PDF é obrigatório' }, { status: 400 });
    }

    if (!(pdf instanceof File)) {
      structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'pdf_not_file' });
      return NextResponse.json({ error: 'PDF inválido: arquivo não reconhecido.' }, { status: 400 });
    }

    structuredLog('info', {
      ...baseCtx,
      event: 'pdf_info',
      pdfName: pdf.name,
      pdfType: pdf.type,
      pdfSize: pdf.size,
    });

    if (!ALLOWED_PDF_TYPES.includes(pdf.type)) {
      structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'pdf_bad_mime', pdfType: pdf.type });
      return NextResponse.json({ error: 'PDF inválido: envie um arquivo application/pdf.' }, { status: 400 });
    }

    if (pdf.size > MAX_PDF_BYTES) {
      const sizeMB = bytesToMB(pdf.size);
      structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'pdf_too_large', pdfSize: pdf.size });
      return NextResponse.json({ 
        error: `PDF muito grande! Tamanho máximo: ${MAX_PDF_SIZE_MB}MB. Seu arquivo: ${sizeMB}MB.` 
      }, { status: 413 });
    }

    // Validações da assinatura (opcional)
    if (signature) {
      if (!(signature instanceof File)) {
        structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'signature_not_file' });
        return NextResponse.json({ error: 'Assinatura inválida: arquivo não reconhecido.' }, { status: 400 });
      }

      structuredLog('info', {
        ...baseCtx,
        event: 'signature_info',
        signatureName: signature.name,
        signatureType: signature.type,
        signatureSize: signature.size,
      });

      if (!ALLOWED_SIGNATURE_TYPES.includes(signature.type)) {
        structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'signature_bad_mime', signatureType: signature.type });
        return NextResponse.json({ error: 'Assinatura inválida: use imagem PNG ou JPG.' }, { status: 400 });
      }

      if (signature.size > MAX_SIGNATURE_BYTES) {
        const sizeMB = bytesToMB(signature.size);
        structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'signature_too_large', signatureSize: signature.size });
        return NextResponse.json({ 
          error: `Assinatura muito grande! Tamanho máximo: ${MAX_SIGNATURE_SIZE_MB}MB. Seu arquivo: ${sizeMB}MB.` 
        }, { status: 413 });
      }
    }

    // Gera ID do documento cedo para correlacionar logs de upload
    const id = documentIdSchema.parse(randomUUID());

    // Gera hash do IP
    let ip_hash = 'unknown';
    try {
      ip_hash = await sha256Hex(ip);
    } catch (err: any) {
      structuredLog('warn', { ...baseCtx, event: 'ip_hash_failed', error: String(err?.message || err) });
      ip_hash = 'error';
    }

    structuredLog('info', { ...baseCtx, event: 'upload_start', documentId: id, ip_hash });

    // uploads no Storage
    try {
      const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
      structuredLog('info', { ...baseCtx, event: 'storage_upload_pdf_start', documentId: id, size: pdfBytes.length });
      const up1 = await supabaseAdmin.storage
        .from('signflow')
        .upload(`${id}/original.pdf`, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (up1.error) {
        structuredLog('error', { ...baseCtx, event: 'storage_upload_pdf_failed', documentId: id, error: up1.error.message });
        return NextResponse.json({ error: up1.error.message }, { status: 500 });
      }
      structuredLog('info', { ...baseCtx, event: 'storage_upload_pdf_success', documentId: id, key: `${id}/original.pdf` });
    } catch (err: any) {
      structuredLog('error', { ...baseCtx, event: 'storage_upload_pdf_exception', documentId: id, error: String(err?.message || err) });
      return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
    }

    if (signature) {
      try {
        const sigBytes = new Uint8Array(await signature.arrayBuffer());
        structuredLog('info', { ...baseCtx, event: 'storage_upload_signature_start', documentId: id, size: sigBytes.length });
        const up2 = await supabaseAdmin.storage
          .from('signflow')
          .upload(`${id}/signature`, sigBytes, {
            contentType: signature.type || 'image/png',
            upsert: true,
          });
        if (up2.error) {
          structuredLog('error', { ...baseCtx, event: 'storage_upload_signature_failed', documentId: id, error: up2.error.message });
          return NextResponse.json({ error: up2.error.message }, { status: 500 });
        }
        structuredLog('info', { ...baseCtx, event: 'storage_upload_signature_success', documentId: id, key: `${id}/signature` });
      } catch (err: any) {
        structuredLog('error', { ...baseCtx, event: 'storage_upload_signature_exception', documentId: id, error: String(err?.message || err) });
        return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
      }
    }

    // --- validação de metadados via schemas ---
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

    const metadataResult = metadataSchema.safeParse({
      positions: parsedPositions.data,
      signature_meta: parsedSignatureMeta.data,
      validation_theme_snapshot: parsedValidationTheme.data,
      validation_profile_id: validationProfileId,
      signers: parsedSigners.data,
    });

    if (!metadataResult.success) {
      return NextResponse.json(
        { error: 'Metadados inválidos', details: metadataResult.error.format() },
        { status: 400 }
      );
    }

    // extrai/valida posições e signers via schemas individuais
    const positions = metadataResult.data.positions.map((pos: unknown) => positionSchema.parse(pos));
    const signatureMeta = metadataResult.data.signature_meta ?? null;
    const validationTheme = metadataResult.data.validation_theme_snapshot ?? null;
    const validationProfileIdSanitized = metadataResult.data.validation_profile_id ?? null;
    const sanitizedSigners = (metadataResult.data.signers || []).map((signer: unknown) => signerSchema.parse(signer));

    structuredLog('info', {
      ...baseCtx,
      event: 'metadata_summary',
      documentId: id,
      positionsCount: positions.length,
      signersCount: sanitizedSigners.length,
      hasSignatureMeta: !!signatureMeta,
      hasValidationTheme: !!validationTheme,
    });

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const metadata: Record<string, any> = { positions };
    if (signatureMeta) metadata.signature_meta = signatureMeta;
    if (validationTheme) metadata.validation_theme_snapshot = validationTheme;
    if (validationProfileIdSanitized) metadata.validation_profile_id = validationProfileIdSanitized;
    if (sanitizedSigners.length) metadata.signers = sanitizedSigners;

    const basePayload: Record<string, any> = {
      id,
      user_id: userId,
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

    structuredLog('info', { ...baseCtx, event: 'db_insert_start', documentId: id });

    let ins = await supabaseAdmin
      .from('documents')
      // @ts-ignore (evita never do types gerados no build)
      .insert(basePayload)
      .select('id')
      .maybeSingle();

    if (ins.error &&
      (ins.error.message?.includes('validation_theme_snapshot') || ins.error.message?.includes('validation_profile_id'))
    ) {
      structuredLog('warn', { ...baseCtx, event: 'db_insert_fallback', documentId: id, error: ins.error.message });
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
      structuredLog('error', { ...baseCtx, event: 'db_insert_failed', documentId: id, error: ins.error.message });
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }

    structuredLog('info', { ...baseCtx, event: 'db_insert_success', documentId: id });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    structuredLog('error', { reqId, route: 'POST /api/upload', event: 'unhandled_exception', error: String(e?.message || e), stack: e?.stack ? e.stack.split('\n').slice(0,5).join(' | ') : undefined });
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
