// @ts-nocheck
// app/api/upload/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createHash, randomUUID } from 'crypto';

// --------- utils ----------
function plusDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getClientIp(req: Request) {
  // Vercel/Next costuma preencher x-forwarded-for
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}

function sha256Hex(input: string) {
  return createHash('sha256').update(input).digest('hex');
}
// ---------------------------

/**
 * Espera um multipart/form-data com:
 * - file: PDF (obrigatório, até 20MB)
 * - signature: PNG/JPG (opcional, até 5MB)
 * - user_id: string (opcional; pode ser null)
 * - positions: string (opcional; JSON com [{page,x,y,scale,rotation},...])
 * - original_pdf_name: string (opcional; se não vier, usa file.name)
 */
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // <-- cria o client somente aqui (runtime)
    const form = await req.formData();

    const pdf = form.get('file') as File | null;
    if (!pdf) {
      return NextResponse.json({ error: 'Arquivo PDF é obrigatório (campo "file").' }, { status: 400 });
    }

    // Validações de PDF
    const pdfType = (pdf as any).type || '';
    if (!pdfType.includes('pdf')) {
      return NextResponse.json({ error: 'O arquivo enviado não é um PDF válido.' }, { status: 400 });
    }
    const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
    const maxPdf = 20 * 1024 * 1024; // 20MB
    if (pdfBytes.byteLength > maxPdf) {
      return NextResponse.json({ error: 'PDF maior que 20MB.' }, { status: 400 });
    }

    // Assinatura (opcional)
    const sig = form.get('signature') as File | null;
    let sigBytes: Uint8Array | null = null;
    let sigExt: 'png' | 'jpg' | 'jpeg' | null = null;

    if (sig) {
      const t = (sig as any).type || '';
      const ok = ['image/png', 'image/jpeg', 'image/jpg'].includes(t);
      if (!ok) {
        return NextResponse.json({ error: 'Assinatura deve ser PNG ou JPG.' }, { status: 400 });
      }
      const arr = new Uint8Array(await sig.arrayBuffer());
      const maxSig = 5 * 1024 * 1024; // 5MB
      if (arr.byteLength > maxSig) {
        return NextResponse.json({ error: 'Imagem de assinatura maior que 5MB.' }, { status: 400 });
      }
      sigBytes = arr;
      if (t === 'image/png') sigExt = 'png';
      if (t === 'image/jpeg' || t === 'image/jpg') sigExt = 'jpg';
    }

    // Metadados opcionais
    const userId = (form.get('user_id') as string) || null;
    const originalNameForm = (form.get('original_pdf_name') as string) || '';
    const original_pdf_name = originalNameForm || (pdf as any).name || 'documento.pdf';

    let positions: any[] = [];
    const positionsRaw = form.get('positions') as string | null;
    if (positionsRaw) {
      try {
        const parsed = JSON.parse(positionsRaw);
        if (Array.isArray(parsed)) positions = parsed;
      } catch {
        // se vier inválido, simplesmente deixa []
      }
    }

    // ID do documento e expiração
    const id = randomUUID();
    const createdAt = new Date();
    const expiresAt = plusDays(createdAt, 7);

    // Hash de IP simples (rate-limit/abuso)
    const ip = getClientIp(req);
    const ip_hash = sha256Hex(ip);

    // Uploads no Storage (bucket: signflow)
    const bucket = 'signflow';
    // original.pdf
    {
      const up = await supabaseAdmin.storage
        .from(bucket)
        .upload(`${id}/original.pdf`, pdfBytes, { contentType: 'application/pdf', upsert: true });

      if (up.error) {
        return NextResponse.json({ error: `Falha ao subir PDF: ${up.error.message}` }, { status: 500 });
      }
    }

    // signature (se enviada)
    if (sigBytes && sigExt) {
      const upSig = await supabaseAdmin.storage
        .from(bucket)
        .upload(`${id}/signature`, sigBytes, {
          contentType: sigExt === 'png' ? 'image/png' : 'image/jpeg',
          upsert: true,
        });

      if (upSig.error) {
        return NextResponse.json({ error: `Falha ao subir assinatura: ${upSig.error.message}` }, { status: 500 });
      }
    }

    // Cria registro em `documents`
    const payload = {
      id,
      user_id: userId,
      original_pdf_name,
      signed_pdf_url: null as string | null,
      qr_code_url: null as string | null,
      metadata: { positions },
      status: 'draft',
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_hash,
    };

    const { error: errDoc } = await supabaseAdmin
      .from('documents')
      .insert(payload as any); // <- cast para evitar "never" no build

    if (errDoc) {
      // rollback básico no storage, se quiser:
      await supabaseAdmin.storage.from(bucket).remove([
        `${id}/original.pdf`,
        `${id}/signature`,
      ]);
      return NextResponse.json({ error: `Falha ao salvar registro: ${errDoc.message}` }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        id,
        message: 'Upload realizado. Documento criado com status "draft".',
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'Erro desconhecido em /api/upload') },
      { status: 500 }
    );
  }
}
