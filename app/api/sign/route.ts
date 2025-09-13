import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest){
  try{
    const { id } = await req.json();
    if(!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const { data: doc, error: errDoc } = await supabaseAdmin.from('documents').select('*').eq('id', id).maybeSingle();
    if (errDoc || !doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

    const { data: orig } = await supabaseAdmin.storage.from('signflow').download(`${id}/original.pdf`);
    if(!orig) return NextResponse.json({ error: 'PDF original ausente' }, { status: 404 });

    const sig = await supabaseAdmin.storage.from('signflow').download(`${id}/signature`);

    const pdfDoc = await PDFDocument.load(await orig.arrayBuffer());

    const validateUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/validate/${id}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { errorCorrectionLevel: 'M', type: 'png', width: 300 });
    const qrImage = await pdfDoc.embedPng(qrPng);

    const positions: any[] = (doc.metadata as any)?.positions || [];
    if(sig.data){
      const sigBytes = new Uint8Array(await sig.data.arrayBuffer());
      let sigImg;
      try { sigImg = await pdfDoc.embedPng(sigBytes); }
      catch { sigImg = await pdfDoc.embedJpg(sigBytes); }

      for(const p of positions){
        const page = pdfDoc.getPage(p.page-1);
        const { width, height } = page.getSize();
        const w = 240 * (p.scale||1);
        const h = w * 0.35;
        const xPt = (p.nx||0.5) * width;
        const yPt = height - ((p.ny||0.5) * height);
        page.drawImage(sigImg, { x: xPt - w/2, y: yPt - h/2, width: w, height: h, rotate: { type: 'degrees', angle: p.rotation||0 } as any });
      }
    }

    const last = pdfDoc.getPage(pdfDoc.getPageCount()-1);
    last.drawImage(qrImage, { x: 30, y: 30, width: 80, height: 80 });

    const bytes = await pdfDoc.save();

    const signedPath = `${id}/signed.pdf`;
    const { error: upErr } = await supabaseAdmin.storage.from('signflow').upload(signedPath, bytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabaseAdmin.storage.from('signflow').getPublicUrl(signedPath);

    const { error: upQrErr } = await supabaseAdmin.storage.from('signflow').upload(`${id}/qr.png`, qrPng, { contentType: 'image/png', upsert: true });
    if (upQrErr) throw upErr;
    const { data: pubQr } = supabaseAdmin.storage.from('signflow').getPublicUrl(`${id}/qr.png`);

    const { error: updErr } = await supabaseAdmin.from('documents').update({ signed_pdf_url: pub.publicUrl, qr_code_url: pubQr.publicUrl, status: 'signed' }).eq('id', id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, signed_pdf_url: pub.publicUrl, qr_code_url: pubQr.publicUrl });
  } catch(e:any){
    return NextResponse.json({ error: e.message || 'Falha ao assinar' }, { status: 500 });
  }
}
