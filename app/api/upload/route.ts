// app/api/upload/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

    const id = crypto.randomUUID();
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

    // cria registro
    let positions: any[] = [];
    try {
      const parsed = JSON.parse(positionsRaw || '[]');
      positions = Array.isArray(parsed) ? parsed : [];
    } catch {
      positions = [];
    }

    let signatureMeta: any = null;
    try {
      signatureMeta = JSON.parse(signatureMetaRaw || 'null');
    } catch {
      signatureMeta = null;
    }

    let validationTheme: any = null;
    try {
      validationTheme = JSON.parse(validationThemeRaw || 'null');
    } catch {
      validationTheme = null;
    }

    let signers: any[] = [];
    try {
      const parsed = JSON.parse(signersRaw || '[]');
      signers = Array.isArray(parsed) ? parsed : [];
    } catch {
      signers = [];
    }

    const sanitizedSigners = signers
      .map(raw => {
        if (!raw || typeof raw !== 'object') return null;
        const name = typeof raw.name === 'string' ? raw.name.trim() : '';
        if (!name) return null;

        const reg = typeof raw.reg === 'string' && raw.reg.trim() ? raw.reg.trim() : null;
        const certificate_type =
          typeof raw.certificate_type === 'string' && raw.certificate_type.trim()
            ? raw.certificate_type.trim()
            : null;
        const certificate_valid_until =
          typeof raw.certificate_valid_until === 'string' && raw.certificate_valid_until.trim()
            ? raw.certificate_valid_until.trim()
            : null;
        const certificate_issuer =
          typeof raw.certificate_issuer === 'string' && raw.certificate_issuer.trim()
            ? raw.certificate_issuer.trim()
            : null;
        const email = typeof raw.email === 'string' && raw.email.trim() ? raw.email.trim() : null;
        const logo_url = typeof raw.logo_url === 'string' && raw.logo_url.trim() ? raw.logo_url.trim() : null;

        return {
          name,
          reg,
          certificate_type,
          certificate_valid_until,
          certificate_issuer,
          email,
          logo_url,
        };
      })
      .filter(Boolean);
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const metadata: Record<string, any> = { positions };
    if (signatureMeta) metadata.signature_meta = signatureMeta;
    if (validationTheme) metadata.validation_theme_snapshot = validationTheme;
    if (validationProfileId) metadata.validation_profile_id = validationProfileId;
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
    if (validationProfileId) {
      basePayload.validation_profile_id = validationProfileId;
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
