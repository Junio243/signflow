// app/api/upload/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  documentIdSchema,
  metadataSchema,
  positionSchema,
  signerSchema,
} from '@/lib/validation/documentSchemas';

function sha256Hex(input: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // ← client dentro do handler

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

    if (!pdf) {
      return NextResponse.json({ error: 'PDF é obrigatório' }, { status: 400 });
    }

    const id = documentIdSchema.parse(crypto.randomUUID());
    const ip = req.headers.get('x-forwarded-for') || req.ip || '0.0.0.0';
    const ip_hash = await sha256Hex(ip);

    // uploads no Storage
    const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
    const up1 = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/original.pdf`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (up1.error) {
      return NextResponse.json({ error: up1.error.message }, { status: 500 });
    }

    if (signature) {
      const sigBytes = new Uint8Array(await signature.arrayBuffer());
      const up2 = await supabaseAdmin.storage
        .from('signflow')
        .upload(`${id}/signature`, sigBytes, {
          contentType: signature.type || 'image/png',
          upsert: true,
        });
      if (up2.error) {
        return NextResponse.json({ error: up2.error.message }, { status: 500 });
      }
    }

    const parseJsonField = (raw: string, fieldName: string): { success: true; data: unknown } | { success: false; error: string } => {
      try {
        return { success: true, data: JSON.parse(raw) };
      } catch {
        return { success: false, error: `${fieldName} deve ser um JSON válido` };
      }
    };

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

    const positions = metadataResult.data.positions.map(pos => positionSchema.parse(pos));
    const signatureMeta = metadataResult.data.signature_meta ?? null;
    const validationTheme = metadataResult.data.validation_theme_snapshot ?? null;
    const validationProfileIdSanitized = metadataResult.data.validation_profile_id ?? null;
    const sanitizedSigners = (metadataResult.data.signers || []).map(signer => signerSchema.parse(signer));
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

    let ins = await supabaseAdmin
      .from('documents')
      // @ts-ignore (evita never do types gerados no build)
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
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
