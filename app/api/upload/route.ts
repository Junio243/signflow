// app/api/upload/route.ts
export const runtime = 'nodejs';

import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { Database } from '@/lib/types';
import {
  documentIdSchema,
  metadataSchema,
  positionSchema,
  signerSchema,
  qrPositionSchema,
  qrPageSchema,
  qrSizeSchema,
} from '@/lib/validation/documentSchemas';
import { uploadRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { logAudit, extractIpFromRequest } from '@/lib/audit';
import { validatePDF, validateImage } from '@/lib/fileValidation';

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_PDF_SIZE_MB = 20;
const MAX_SIGNATURE_BYTES = 5 * 1024 * 1024;
const MAX_SIGNATURE_SIZE_MB = 5;
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg'];

function bytesToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function sha256Hex(input: string) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function structuredLog(level: 'info' | 'warn' | 'error', ctx: Record<string, any>) {
  const str = JSON.stringify({ time: new Date().toISOString(), ...ctx });
  if (level === 'error') console.error(str);
  else if (level === 'warn') console.warn(str);
  else console.info(str);
}

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

const rateLimiter = uploadRateLimiter('/api/upload');

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimiter(req);
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  const reqId = randomUUID();
  const baseCtx = { reqId, route: 'POST /api/upload' };

  structuredLog('info', { ...baseCtx, event: 'request_received' });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const ipHeader =
      (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || (req as any).ip) ?? '';
    const ip = ipHeader ? (ipHeader as string).split(',')[0].trim() : '0.0.0.0';

    const form = await req.formData();

    const pdf = form.get('pdf') as File | null;
    const signature = form.get('signature') as File | null;
    const original_pdf_name = form.get('original_pdf_name')?.toString() || 'documento.pdf';
    const positionsRaw = form.get('positions')?.toString() || '[]';
    const signatureMetaRaw = form.get('signature_meta')?.toString() || 'null';
    const validationThemeRaw = form.get('validation_theme_snapshot')?.toString() || 'null';
    const validationProfileId = form.get('validation_profile_id')?.toString() || null;
    const userId = form.get('user_id')?.toString() || null;
    const signersRaw = form.get('signers')?.toString() || '[]';
    const qrPositionRaw = form.get('qr_position')?.toString() || 'bottom-left';
    const qrPageRaw = form.get('qr_page')?.toString() || 'last';
    const qrSizeRaw = form.get('qr_size')?.toString() || '72';
    const validationRequiresCodeRaw = form.get('validation_requires_code')?.toString() || 'false';
    const validationAccessCodeRaw = form.get('validation_access_code')?.toString() || null;

    if (!pdf) {
      structuredLog('warn', { ...baseCtx, event: 'validation_failed', reason: 'pdf_missing' });
      return NextResponse.json({ error: 'PDF é obrigatório' }, { status: 400 });
    }
    if (!(pdf instanceof File)) return NextResponse.json({ error: 'PDF inválido: arquivo não reconhecido.' }, { status: 400 });
    if (!ALLOWED_PDF_TYPES.includes(pdf.type)) return NextResponse.json({ error: 'PDF inválido: envie um arquivo application/pdf.' }, { status: 400 });
    if (pdf.size > MAX_PDF_BYTES) return NextResponse.json({ error: `PDF muito grande! Máximo: ${MAX_PDF_SIZE_MB}MB. Seu arquivo: ${bytesToMB(pdf.size)}MB.` }, { status: 413 });

    const pdfValidation = await validatePDF(pdf);
    if (!pdfValidation.valid) return NextResponse.json({ error: pdfValidation.error ?? 'Arquivo inválido: não é um PDF real.' }, { status: 400 });

    if (signature) {
      if (!(signature instanceof File)) return NextResponse.json({ error: 'Assinatura inválida: arquivo não reconhecido.' }, { status: 400 });
      if (!ALLOWED_SIGNATURE_TYPES.includes(signature.type)) return NextResponse.json({ error: 'Assinatura inválida: use imagem PNG ou JPG.' }, { status: 400 });
      if (signature.size > MAX_SIGNATURE_BYTES) return NextResponse.json({ error: `Assinatura muito grande! Máximo: ${MAX_SIGNATURE_SIZE_MB}MB.` }, { status: 413 });
      const imgValidation = await validateImage(signature, ['png', 'jpeg']);
      if (!imgValidation.valid) return NextResponse.json({ error: imgValidation.error ?? 'Imagem de assinatura inválida.' }, { status: 400 });
    }

    const id = documentIdSchema.parse(randomUUID());
    let ip_hash = 'unknown';
    try { ip_hash = await sha256Hex(ip); } catch { ip_hash = 'error'; }

    // Upload PDF
    try {
      const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
      const up1 = await supabaseAdmin.storage.from('signflow').upload(`${id}/original.pdf`, pdfBytes, { contentType: 'application/pdf', upsert: true });
      if (up1.error) return NextResponse.json({ error: up1.error.message }, { status: 500 });
    } catch (err: any) { return NextResponse.json({ error: String(err?.message || err) }, { status: 500 }); }

    // Upload assinatura
    if (signature) {
      try {
        const sigBytes = new Uint8Array(await signature.arrayBuffer());
        const up2 = await supabaseAdmin.storage.from('signflow').upload(`${id}/signature`, sigBytes, { contentType: signature.type || 'image/png', upsert: true });
        if (up2.error) return NextResponse.json({ error: up2.error.message }, { status: 500 });
      } catch (err: any) { return NextResponse.json({ error: String(err?.message || err) }, { status: 500 }); }
    }

    const parsedPositions = parseJsonField(positionsRaw || '[]', 'positions');
    if (!parsedPositions.success || !Array.isArray(parsedPositions.data)) return NextResponse.json({ error: parsedPositions.success ? 'positions deve ser um array' : parsedPositions.error }, { status: 400 });

    const parsedSignatureMeta = parseJsonField(signatureMetaRaw || 'null', 'signature_meta');
    if (!parsedSignatureMeta.success) return NextResponse.json({ error: parsedSignatureMeta.error }, { status: 400 });

    const parsedValidationTheme = parseJsonField(validationThemeRaw || 'null', 'validation_theme_snapshot');
    if (!parsedValidationTheme.success) return NextResponse.json({ error: parsedValidationTheme.error }, { status: 400 });

    const parsedSigners = parseJsonField(signersRaw || '[]', 'signers');
    if (!parsedSigners.success || !Array.isArray(parsedSigners.data)) return NextResponse.json({ error: parsedSigners.success ? 'signers deve ser um array' : parsedSigners.error }, { status: 400 });

    const qrPositionResult = qrPositionSchema.safeParse(qrPositionRaw);
    if (!qrPositionResult.success) return NextResponse.json({ error: 'qr_position inválido' }, { status: 400 });

    const qrPageResult = qrPageSchema.safeParse(qrPageRaw);
    if (!qrPageResult.success) return NextResponse.json({ error: 'qr_page inválido' }, { status: 400 });

    const qrSizeResult = qrSizeSchema.safeParse(Number(qrSizeRaw));
    const qrSizeParsed = qrSizeResult.success ? qrSizeResult.data : 72;

    const validationRequiresCode = validationRequiresCodeRaw === 'true' || validationRequiresCodeRaw === '1';
    const validationAccessCode = typeof validationAccessCodeRaw === 'string' && validationAccessCodeRaw.trim() ? validationAccessCodeRaw.trim().toUpperCase() : null;
    if (validationRequiresCode && !validationAccessCode) return NextResponse.json({ error: 'Código de validação é obrigatório.' }, { status: 400 });

    const metadataResult = metadataSchema.safeParse({
      positions: parsedPositions.data,
      signature_meta: parsedSignatureMeta.data,
      validation_theme_snapshot: parsedValidationTheme.data,
      validation_profile_id: validationProfileId,
      validation_requires_code: validationRequiresCode,
      validation_access_code: validationAccessCode,
      signers: parsedSigners.data,
      qr_position: qrPositionResult.data,
      qr_page: qrPageResult.data,
      qr_size: qrSizeParsed,
    });
    if (!metadataResult.success) return NextResponse.json({ error: 'Metadados inválidos', details: metadataResult.error.format() }, { status: 400 });

    const positions = metadataResult.data.positions.map((pos: unknown) => positionSchema.parse(pos));
    const signatureMeta = metadataResult.data.signature_meta ?? null;
    const validationTheme = metadataResult.data.validation_theme_snapshot ?? null;
    const validationProfileIdSanitized = metadataResult.data.validation_profile_id ?? null;
    const sanitizedSigners = (metadataResult.data.signers || []).map((signer: unknown) => signerSchema.parse(signer));

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const metadata: Record<string, any> = { positions };
    if (signatureMeta) metadata.signature_meta = signatureMeta;
    if (validationTheme) metadata.validation_theme_snapshot = validationTheme;
    if (validationProfileIdSanitized) metadata.validation_profile_id = validationProfileIdSanitized;
    if (validationRequiresCode) metadata.validation_requires_code = validationRequiresCode;
    if (validationAccessCode) metadata.validation_access_code = validationAccessCode;
    if (sanitizedSigners.length) metadata.signers = sanitizedSigners;
    metadata.qr_position = qrPositionResult.data;
    metadata.qr_page = qrPageResult.data;
    metadata.qr_size = qrSizeParsed;

    const basePayload: Database['public']['Tables']['documents']['Insert'] = {
      id,
      user_id: userId,
      original_pdf_name,
      metadata: metadata as any,
      status: 'draft',
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      signed_pdf_url: null,
      qr_code_url: null,
      ip_hash,
    };

    if (validationTheme) basePayload.validation_theme_snapshot = validationTheme as any;
    if (validationProfileIdSanitized) basePayload.validation_profile_id = validationProfileIdSanitized;

    let ins = await supabaseAdmin.from('documents').insert(basePayload).select('id').maybeSingle();
    if (ins.error && (ins.error.message?.includes('validation_theme_snapshot') || ins.error.message?.includes('validation_profile_id'))) {
      const fallbackPayload = { ...basePayload };
      delete fallbackPayload.validation_theme_snapshot;
      delete fallbackPayload.validation_profile_id;
      ins = await supabaseAdmin.from('documents').insert(fallbackPayload).select('id').maybeSingle();
    }

    if (ins.error) {
      await logAudit({ action: 'document.upload', resourceType: 'document', resourceId: id, status: 'error', userId, ip, requestId: reqId, details: { error: ins.error.message } });
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }

    await logAudit({ action: 'document.upload', resourceType: 'document', resourceId: id, status: 'success', userId, ip, requestId: reqId, details: { fileName: original_pdf_name, fileSize: pdf?.size } });

    const response = NextResponse.json({ ok: true, id });
    return addRateLimitHeaders(response, rateLimitResult.headers);
  } catch (e: any) {
    structuredLog('error', { reqId, event: 'unhandled_exception', error: String(e?.message || e) });
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
