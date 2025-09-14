// app/api/sign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/types';
import QRCode from 'qrcode';
import { PDFDocument, degrees } from 'pdf-lib';

export const runtime = 'nodejs';

type Position = {
  page: number;     // 1-based
  nx: number;       // 0..1 (largura)
  ny: number;       // 0..1 (altura, topo -> 0)
  scale: number;    // 1.0 = 240pt de largura base
  rotation: number; // graus
};

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    // 1) Buscar documento
    const { data: doc, error: errDoc } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (errDoc) return NextResponse.json({ error: errDoc.message }, { status: 500 });
    if (!doc)   return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

    // 2) Baixar PDF original
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (!orig.data) {
      return NextResponse.json({ error: 'PDF original ausente' }, { status: 404 });
    }
    const pdfDoc = await PDFDocument.load(await orig.data.arrayBuffer());

    // (Opcional) imagem de assinatura enviada
    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);

    // 3) QR para página pública de validação
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const validateUrl = `${siteUrl}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
    });
    const qrImage = await pdfDoc.embedPng(qrPng);

    // 4) Inserir assinaturas (se houver posições + imagem)
    const positions: Position[] =
      ((((doc as any)?.metadata as any)?.positions) as Position[]) || [];

    if (sig.data && positions.length) {
      const sigBytes = new Uint8Array(await sig.data.arrayBuffer());
      let sigImg;
      try {
        sigImg = await pdfDoc.embedPng(sigBytes);
      } catch {
        sigImg = await pdfDoc.embedJpg(sigBytes);
      }

      for (const p of positions) {
        const page = pdfDoc.getPage(p.page - 1); // 0-based
        const { width, height } = page.getSize();

        const w = 240 * (p.scale ?? 1); // largura base 240pt
        const h = w * 0.35;

        // coordenadas normalizadas -> pontos PDF
        const xPt = (p.nx ?? 0.5) * width;
        const yPt = height - (p.ny ?? 0.5) * height;

        page.drawImage(sigImg, {
          x: xPt - w / 2,
          y: yPt - h / 2,
          width: w,
          height: h,
          rotate: degrees(p.rotation ?? 0),
        });
      }
    }

    // 5) Inserir QR na última página (80x80 pt, offset 30x30)
    const last = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
    last.drawImage(qrImage, { x: 30, y: 30, width: 80, height: 80 });

    // 6) Salvar e publicar no Storage
    const bytes = await pdfDoc.save();
    const signedPath = `${id}/signed.pdf`;

    const upSigned = await supabaseAdmin.storage
      .from('signflow')
      .upload(signedPath, bytes, { contentType: 'application/pdf', upsert: true });
    if (upSigned.error) {
      return NextResponse.json({ error: upSigned.error.message }, { status: 500 });
    }
    const pubSigned = supabaseAdmin.storage.from('signflow').getPublicUrl(signedPath);

    const upQr = await supabaseAdmin.storage
      .from('signflow')
      .upload(`${id}/qr.png`, qrPng, { contentType: 'image/png', upsert: true });
    if (upQr.error) {
      return NextResponse.json({ error: upQr.error.message }, { status: 500 });
    }
    const pubQr = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);

    // 7) Atualizar registro (payload tipado para evitar 'never')
    const payload = {
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url: pubQr.data.publicUrl,
      status: 'signed',
    } satisfies Database['public']['Tables']['documents']['Update'];

    const upd = await supabaseAdmin
      .from('documents')
      // Supabase types infer `never` without casting
      .update(payload as never)
      .eq('id', id);

    if (upd.error) {
      return NextResponse.json({ error: upd.error.message }, { status: 500 });
    }

    // 8) Resposta
    return NextResponse.json({
      ok: true,
      id,
      signed_pdf_url: pubSigned.data.publicUrl,
      qr_code_url: pubQr.data.publicUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Falha ao assinar' }, { status: 500 });
  }
}
