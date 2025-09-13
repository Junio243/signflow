// app/api/sign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';
import { PDFDocument, degrees } from 'pdf-lib';

export const runtime = 'nodejs';

type Position = {
  page: number;     // 1-based
  nx: number;       // 0..1 (largura)
  ny: number;       // 0..1 (altura, topo -> 0)
  scale: number;    // 1.0 = 240pt de largura base
  rotation: number; // graus (-/+) em relação ao centro da assinatura
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.id || '');

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    // 1) Buscar documento no banco
    const { data: doc, error: errDoc } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (errDoc) {
      return NextResponse.json({ error: errDoc.message }, { status: 500 });
    }
    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // 2) Baixar PDF original e (se existir) a imagem da assinatura
    const orig = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if (!orig.data) {
      return NextResponse.json({ error: 'PDF original ausente' }, { status: 404 });
    }

    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);
    const pdfDoc = await PDFDocument.load(await orig.data.arrayBuffer());

    // 3) Gerar QR que aponta para a página pública de validação
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const validateUrl = `${siteUrl}/validate/${id}`;

    const qrPng = await QRCode.toBuffer(validateUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
    });
    const qrImage = await pdfDoc.embedPng(qrPng);

    // 4) Inserir assinaturas (se houver posições e imagem enviada)
    const positions: Position[] =
      (((doc as any)?.metadata as any)?.positions as Position[]) || [];

    if (sig.data && positions.length > 0) {
      const sigBytes = new Uint8Array(await sig.data.arrayBuffer());

      let sigImg;
      try {
        sigImg = await pdfDoc.embedPng(sigBytes);
      } catch {
        // fallback para JPG
        sigImg = await pdfDoc.embedJpg(sigBytes);
      }

      for (const p of positions) {
        const page = pdfDoc.getPage(p.page - 1); // pages are 0-based
        const { width, height } = page.getSize();

        // largura base 240pt (pode ajustar), proporcional ao scale
        const w = 240 * (p.scale || 1);
        const h = w * 0.35;

        // coordenadas normalizadas -> pontos PDF
        const xPt = (p.nx || 0.5) * width;
        const yPt = height - (p.ny || 0.5) * height;

        page.drawImage(sigImg, {
          x: xPt - w / 2,
          y: yPt - h / 2,
          width: w,
          height: h,
          rotate: degrees(p.rotation || 0),
        });
      }
    }

    // 5) Inserir QR na ÚLTIMA página (80x80 pt, offset 30x30 pt)
    const last = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
    last.drawImage(qrImage, { x: 30, y: 30, width: 80, height: 80 });

    // 6) Salvar, enviar para o Storage e tornar público
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

    // 7) Atualizar registro do documento
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

    // 8) Resposta final
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
