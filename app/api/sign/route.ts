// app/api/sign/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  PDFDocument,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rotateRadians,
  translate
} from 'pdf-lib';
import QRCode from 'qrcode';
import {
  Metadata,
  Position,
  documentIdSchema,
  storedMetadataSchema,
} from '@/lib/validation/documentSchemas';

type SignerMetadata = {
  name: string;
  reg: string | null;
  certificate_type: string | null;
  certificate_valid_until: string | null;
  certificate_issuer: string | null;
  logo_url: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
};

function toIsoOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function extractSignersFromMetadata(metadata: Metadata): SignerMetadata[] {
  const sanitized = (metadata.signers || []).map(signer => ({
    name: signer.name,
    reg: signer.reg ?? null,
    certificate_type: signer.certificate_type ?? null,
    certificate_valid_until: signer.certificate_valid_until ?? null,
    certificate_issuer: signer.certificate_issuer ?? null,
    logo_url: signer.logo_url ?? null,
    email: signer.email ?? null,
    metadata: signer as Record<string, unknown>,
  } satisfies SignerMetadata));

  if (sanitized.length) {
    return sanitized;
  }

  const theme =
    (metadata && typeof (metadata as any).validation_theme_snapshot === 'object'
      ? (metadata as any).validation_theme_snapshot
      : null) ||
    (metadata && typeof (metadata as any).theme === 'object' ? (metadata as any).theme : null);

  if (theme && typeof theme === 'object') {
    const issuer = typeof (theme as any).issuer === 'string' ? (theme as any).issuer.trim() : '';
    const reg = typeof (theme as any).reg === 'string' && (theme as any).reg.trim() ? (theme as any).reg.trim() : null;
    const certificate_type =
      typeof (theme as any).certificate_type === 'string' && (theme as any).certificate_type.trim()
        ? (theme as any).certificate_type.trim()
        : null;
    const certificate_valid_until =
      typeof (theme as any).certificate_valid_until === 'string' && (theme as any).certificate_valid_until.trim()
        ? (theme as any).certificate_valid_until.trim()
        : null;
    const certificate_issuer =
      typeof (theme as any).certificate_issuer === 'string' && (theme as any).certificate_issuer.trim()
        ? (theme as any).certificate_issuer.trim()
        : null;
    const logo_url =
      typeof (theme as any).logo_url === 'string' && (theme as any).logo_url.trim()
        ? (theme as any).logo_url.trim()
        : null;

    return [
      {
        name: issuer || 'Signatário',
        reg,
        certificate_type,
        certificate_valid_until,
        certificate_issuer,
        logo_url,
        email: null,
        metadata: theme as Record<string, unknown>,
      },
    ];
  }

  return [
    {
      name: 'Signatário',
      reg: null,
      certificate_type: null,
      certificate_valid_until: null,
      certificate_issuer: null,
      logo_url: null,
      email: null,
      metadata: null,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // ← client dentro do handler

    const form = await req.formData();
    const idResult = documentIdSchema.safeParse(form.get('id')?.toString());
    if (!idResult.success) {
      return NextResponse.json({ error: 'id é obrigatório e deve ser um UUID válido' }, { status: 400 });
    }
    const id = idResult.data;

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
    const metadataParsed = storedMetadataSchema.safeParse(doc?.metadata);

    if (!metadataParsed.success) {
      return NextResponse.json({ error: 'Metadados inválidos' }, { status: 400 });
    }

    const normalizedMetadata: Metadata = Array.isArray(metadataParsed.data)
      ? { positions: metadataParsed.data as Position[] }
      : (metadataParsed.data as Metadata) || { positions: [] };

    const positions = normalizedMetadata.positions || [];
    const signatureMeta: { width?: number; height?: number } | null =
      (normalizedMetadata.signature_meta as any) || null;

    let sigImage: any = null;
    if (sigBytes) {
      sigImage = sigMime.includes('png')
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes);
    }

    for (const pos of positions) {
      const pageIndex = Math.min(Math.max((pos.page ?? 1) - 1, 0), pages.length - 1);
      const page = pages[pageIndex];
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      const pageWidthRef = typeof pos.page_width === 'number' && Number.isFinite(pos.page_width)
        ? pos.page_width
        : pageWidth;
      const pageHeightRef = typeof pos.page_height === 'number' && Number.isFinite(pos.page_height)
        ? pos.page_height
        : pageHeight;

      const nx =
        typeof pos.nx === 'number' && Number.isFinite(pos.nx)
          ? Math.max(0, Math.min(1, pos.nx))
          : typeof pos.x === 'number' && Number.isFinite(pos.x)
            ? Math.max(0, Math.min(1, pos.x / pageWidthRef))
            : null;

      const ny =
        typeof pos.ny === 'number' && Number.isFinite(pos.ny)
          ? Math.max(0, Math.min(1, pos.ny))
          : typeof pos.y === 'number' && Number.isFinite(pos.y)
            ? Math.max(0, Math.min(1, pos.y / pageHeightRef))
            : null;

      const normalizedNx = nx !== null ? nx : 0.5;
      const normalizedNy = ny !== null ? ny : 0.5;

      const centerX = normalizedNx * pageWidth;
      const centerY = pageHeight - normalizedNy * pageHeight;

      const scale = typeof pos.scale === 'number' ? pos.scale : 1;
      const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0;

      const baseWidth = signatureMeta?.width || (sigImage?.width ?? 240);
      const baseHeight = signatureMeta?.height || (sigImage?.height ?? 120);
      const width = baseWidth * scale;
      const height = baseHeight * scale;

      if (sigImage) {
        if (rotation) {
          const angle = rotateRadians((rotation * Math.PI) / 180);
          page.pushOperators(pushGraphicsState());
          page.pushOperators(translate(centerX, centerY), angle);
          page.drawImage(sigImage, { x: -width / 2, y: -height / 2, width, height });
          page.pushOperators(popGraphicsState());
        } else {
          page.drawImage(sigImage, {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
          });
        }
      } else {
        const rectWidth = width || 160;
        const rectHeight = height || 64;
        page.drawRectangle({
          x: centerX - rectWidth / 2,
          y: centerY - rectHeight / 2,
          width: rectWidth,
          height: rectHeight,
          color: rgb(0.9, 0.9, 0.9)
        });
      }
    }

    // gera QR e insere nas páginas configuradas
    const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const validateUrl = `${base}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { width: 256 });
    const qrImage = await pdfDoc.embedPng(qrPng);
    
    // Extract QR position settings from metadata
    const qrPosition = (normalizedMetadata as any).qr_position || 'bottom-left';
    const qrPage = (normalizedMetadata as any).qr_page || 'last';
    
    const margin = 30;
    const qrSize = 80;
    
    // Function to calculate QR coordinates based on position
    function getQrCoordinates(pageWidth: number, pageHeight: number, position: string) {
      switch (position) {
        case 'bottom-right':
          return { x: pageWidth - margin - qrSize, y: margin };
        case 'top-left':
          return { x: margin, y: pageHeight - margin - qrSize };
        case 'top-right':
          return { x: pageWidth - margin - qrSize, y: pageHeight - margin - qrSize };
        default: // bottom-left
          return { x: margin, y: margin };
      }
    }
    
    // Determine which pages receive the QR code
    let targetPages: any[] = [];
    if (qrPage === 'first') {
      targetPages = [pages[0]];
    } else if (qrPage === 'all') {
      targetPages = pages;
    } else { // last
      targetPages = [pages[pages.length - 1]];
    }
    
    // Insert QR code in selected pages
    for (const page of targetPages) {
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const coords = getQrCoordinates(pageWidth, pageHeight, qrPosition);
      page.drawImage(qrImage, { x: coords.x, y: coords.y, width: qrSize, height: qrSize });
    }

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
    if (pubSigned.error || !pubSigned.data?.publicUrl) {
      console.error('Erro ao gerar URL pública do PDF assinado:', pubSigned.error);
      return NextResponse.json(
        { error: pubSigned.error?.message || 'Falha ao gerar URL pública do PDF assinado.' },
        { status: 500 },
      );
    }

    const pubQr = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);
    if (pubQr.error || !pubQr.data?.publicUrl) {
      console.error('Erro ao gerar URL pública do QR code:', pubQr.error);
      return NextResponse.json(
        { error: pubQr.error?.message || 'Falha ao gerar URL pública do QR code.' },
        { status: 500 },
      );
    }

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

    const signers = extractSignersFromMetadata(normalizedMetadata);
    const nowIso = new Date().toISOString();
    if (signers.length) {
      const payload = signers.map(signer => ({
        document_id: id,
        signer_name: signer.name,
        signer_reg: signer.reg,
        certificate_type: signer.certificate_type,
        certificate_issuer: signer.certificate_issuer,
        signer_email: signer.email,
        signed_at: nowIso,
        certificate_valid_until: toIsoOrNull(signer.certificate_valid_until),
        logo_url: signer.logo_url,
        metadata: signer.metadata,
      }));

      const insEvents = await supabaseAdmin
        .from('document_signing_events')
        // @ts-ignore (tipagem gerada em tempo de build)
        .insert(payload);

      if (insEvents.error) {
        return NextResponse.json({ error: insEvents.error.message }, { status: 500 });
      }
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
