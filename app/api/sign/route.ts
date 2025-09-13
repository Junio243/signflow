// @ts-nocheck
// app/api/sign/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PDFDocument, degrees } from 'pdf-lib';
import QRCode from 'qrcode';

// Util: extrai 'id' tanto de JSON quanto de form-data
async function getIdFromRequest(req: NextRequest): Promise<string | null> {
  const ctype = req.headers.get('content-type')?.toLowerCase() || '';
  try {
    if (ctype.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (body && typeof body.id === 'string') return body.id;
    } else if (ctype.includes('multipart/form-data')) {
      const form = await req.formData();
      const id = form.get('id');
      if (typeof id === 'string') return id;
    }
  } catch {}
  // fallback: tentar pegar via query ?id=
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  return id;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const id = await getIdFromRequest(req);
    if (!id) {
      return NextResponse.json({ error: 'Campo "id" é obrigatório para assinar.' }, { status: 400 });
    }

    // Busca metadados do documento (posições etc.)
    const { data: docRow, error: errDoc } = await supabaseAdmin
      .from('documents')
      .select('metadata, original_pdf_name, user_id, created_at')
      .eq('id', id)
      .maybeSingle();

    if (errDoc) {
      return NextResponse.json({ error: `Erro ao buscar documento: ${errDoc.message}` }, { status: 500 });
    }
    if (!docRow) {
      return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });
    }

    const positions: any[] = (docRow?.metadata?.positions && Array.isArray(docRow.metadata.positions))
      ? docRow.metadata.positions
      : [];

    // Baixa o PDF original do Storage
    const bucket = 'signflow';
    const originalPath = `${id}/original.pdf`;
    const dl = await supabaseAdmin.storage.from(bucket).download(originalPath);
    if (dl.error || !dl.data) {
      return NextResponse.json({ error: `Falha ao baixar original.pdf: ${dl.error?.message || 'sem dados'}` }, { status: 500 });
    }
    const originalBytes = new Uint8Array(await dl.data.arrayBuffer());

    // Prepara QR Code com link de validação pública
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const validateUrl = `${siteUrl}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 4,
    });

    // Carrega o PDF e insere a assinatura (se houver) + QR
    const pdfDoc = await PDFDocument.load(originalBytes);

    // Tenta baixar assinatura (opcional)
    let sigBytes: Uint8Array | null = null;
    let sigType: 'png' | 'jpg' | null = null;
    {
      const dlSig = await supabaseAdmin.storage.from(bucket).download(`${id}/signature`);
      if (dlSig.data) {
        const arr = new Uint8Array(await dlSig.data.arrayBuffer());
        sigBytes = arr;

        // Tentamos inferir tipo (alguns storages não retornam mimetype no download)
        // Heurística simples: PNG começa com 89 50 4E 47
        if (arr.length >= 4 && arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          sigType = 'png';
        } else {
          sigType = 'jpg'; // fallback
        }
      }
    }

    // Embeds necessários
    let sigImage: any = null;
    if (sigBytes) {
      try {
        sigImage = sigType === 'png'
          ? await pdfDoc.embedPng(sigBytes)
          : await pdfDoc.embedJpg(sigBytes);
      } catch {
        // Se falhar embed como png, tenta jpeg
        try {
          sigImage = await pdfDoc.embedJpg(sigBytes);
        } catch {
          sigImage = null;
        }
      }
    }

    const qrImage = await pdfDoc.embedPng(qrPng);

    // Desenha assinaturas conforme as posições
    // Padrão de tamanho base da assinatura
    const baseW = 120;
    const baseH = 60;

    if (sigImage && positions.length > 0) {
      const pages = pdfDoc.getPages();
      for (const pos of positions) {
        const pageIndex = typeof pos.page === 'number' ? Math.max(0, pos.page - 1) : 0;
        const page = pages[pageIndex] || pages[pages.length - 1];

        const scale = typeof pos.scale === 'number' ? pos.scale : 1;
        const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0;
        const x = typeof pos.x === 'number' ? pos.x : 30;
        const y = typeof pos.y === 'number' ? pos.y : 30;

        const width = (typeof pos.width === 'number' ? pos.width : baseW) * scale;
        const height = (typeof pos.height === 'number' ? pos.height : baseH) * scale;

        page.drawImage(sigImage, {
          x,
          y,
          width,
          height,
          rotate: degrees(rotation),
          opacity: (typeof pos.opacity === 'number' ? pos.opacity : 1),
        });
      }
    }

    // Insere QR Code na última página (80x80, margem 30, canto inferior esquerdo)
    {
      const pages = pdfDoc.getPages();
      const last = pages[pages.length - 1];
      last.drawImage(qrImage, {
        x: 30,
        y: 30,
        width: 80,
        height: 80,
      });
    }

    // Salva o PDF final
    const signedBytes = await pdfDoc.save();

    // Upload do PDF assinado
    const signedPath = `${id}/signed.pdf`;
    const upSigned = await supabaseAdmin.storage
      .from(bucket)
      .upload(signedPath, signedBytes, { contentType: 'application/pdf', upsert: true });
    if (upSigned.error) {
      return NextResponse.json({ error: `Falha ao subir signed.pdf: ${upSigned.error.message}` }, { status: 500 });
    }

    // Upload do QR (também queremos servir/baixar)
    const qrPath = `${id}/qr.png`;
    const upQr = await supabaseAdmin.storage
      .from(bucket)
      .upload(qrPath, qrPng, { contentType: 'image/png', upsert: true });
    if (upQr.error) {
      return NextResponse.json({ error: `Falha ao subir qr.png: ${upQr.error.message}` }, { status: 500 });
    }

    // URLs públicas
    const pubSigned = supabaseAdmin.storage.from(bucket).getPublicUrl(signedPath);
    const pubQr = supabaseAdmin.storage.from(bucket).getPublicUrl(qrPath);

    // Atualiza registro em documents
    const { error: errUpd } = await supabaseAdmin
      .from('documents')
      .update({
        signed_pdf_url: pubSigned.data.publicUrl,
        qr_code_url: pubQr.data.publicUrl,
        status: 'signed',
      } as any)
      .eq('id', id);

    if (errUpd) {
      return NextResponse.json({ error: `Falha ao atualizar documento: ${errUpd.message}` }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        id,
        signed_pdf_url: pubSigned.data.publicUrl,
        qr_code_url: pubQr.data.publicUrl,
        validate_url: validateUrl,
        message: 'Documento assinado com sucesso.',
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'Erro desconhecido em /api/sign') },
      { status: 500 }
    );
  }
}
