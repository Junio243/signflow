// app/api/sign/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // ← client dentro do handler

    const form = await req.formData();
    const id = form.get('id')?.toString();
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    // busca doc
    const docRes = await supabaseAdmin
      .from('documents')
      .select('id, metadata, signed_pdf_url, qr_code_url, status')
      .eq('id', id)
      .maybeSingle();

    if (docRes.error) {
      return NextResponse.json({ error: docRes.error.message }, { status: 500 });
    }
    const doc = (docRes.data || null) as any;
    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // baixa o original
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (orig.error || !orig.data) {
      return NextResponse.json({ error: orig.error?.message || 'original.pdf não encontrado' }, { status: 500 });
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
    const positions: Array<{ page: number; x: number; y: number; scale?: number; rotation?: number }> =
      (doc?.metadata?.positions || []) as any[];

    let sigImage: any = null;
    if (sigBytes) {
      sigImage = sigMime.includes('png')
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes);
    }

    for (const pos of positions) {
      const pageIndex = Math.min(Math.max((pos.page ?? 1) - 1, 0), pages.length - 1);
      const page = pages[pageIndex];

      if (sigImage) {
        const w = (sigImage.width || 240) * (pos.scale || 0.5);
        const h = (sigImage.height || 120) * (pos.scale || 0.5);
        page.drawImage(sigImage, {
          x: pos.x,
          y: pos.y,
          width: w,
          height: h,
          rotate: pos.rotation ? { type: 'degrees', angle: pos.rotation } as any : undefined,
        });
      } else {
        // fallback: retângulo cinza, se não houver imagem
        page.drawRectangle({ x: pos.x, y: pos.y, width: 160, height: 64, color: rgb(0.9, 0.9, 0.9) });
      }
    }

    // gera QR e insere na última página
    const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const validateUrl = `${base}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { width: 256 });
    const qrImage = await pdfDoc.embedPng(qrPng);
    const last = pages[pages.length - 1];
    const margin = 30;
    const qrSize = 80;
    last.drawImage(qrImage, { x: margin, y: margin, width: qrSize, height: qrSize });

    const signedBytes = await pdfDoc.save();

    // sobe arquivos gerados
    const upSigned = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/signed.pdf`, signedBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (upSigned.error) {
      return NextResponse.json({ error: upSigned.error.message }, { status: 500 });
    }

    const upQr = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/qr.png`, qrPng, {
        contentType: 'image/png',
        upsert: true,
      });
    if (upQr.error) {
      return NextResponse.json({ error: upQr.error.message }, { status: 500 });
    }

    // URLs públicas
    const pubSigned = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/signed.pdf`);
    const pubQr = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);

    // atualiza registro
    // @ts-ignore (evita never do types gerados no build)
    const upd = await supabaseAdmin
      .from('documents')
      .update({
        signed_pdf_url: pubSigned.data.publicUrl,
        qr_code_url: pubQr.data.publicUrl,
        status: 'signed',
      })
      .eq('id', id);

    if (upd.error) {
      return NextResponse.json({ error: upd.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id,
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url: pubQr.data.publicUrl,
      validate_url: validateUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
