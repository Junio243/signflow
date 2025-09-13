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
    const userId = form.get('user_id')?.toString() || null;

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
    const positions = JSON.parse(positionsRaw || '[]');
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const ins = await supabaseAdmin
      .from('documents')
      // @ts-ignore (evita never do types gerados no build)
      .insert({
        id,
        user_id: userId,
        original_pdf_name,
        metadata: { positions },
        status: 'draft',
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
        signed_pdf_url: null,
        qr_code_url: null,
        ip_hash,
      })
      .select('id')
      .maybeSingle();

    if (ins.error) {
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
