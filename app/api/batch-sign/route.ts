import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

const supabaseAdmin = getSupabaseAdmin();

interface BatchSignRequest {
  documentIds: string[];
  signatureImage?: string;
  signerName?: string;
  signerInfo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body: BatchSignRequest = await req.json();
    const { documentIds, signatureImage, signerName, signerInfo } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista de documentos inválida' },
        { status: 400 }
      );
    }

    if (documentIds.length > 20) {
      return NextResponse.json(
        { error: 'Máximo de 20 documentos por lote' },
        { status: 400 }
      );
    }

    const { data: documents, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id);

    if (fetchError || !documents) {
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      );
    }

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { error: 'Alguns documentos não foram encontrados ou não pertencem a você' },
        { status: 403 }
      );
    }

    const alreadySigned = documents.filter(doc => doc.status === 'signed');
    if (alreadySigned.length > 0) {
      return NextResponse.json(
        { 
          error: 'Alguns documentos já estão assinados',
          alreadySignedIds: alreadySigned.map(d => d.id)
        },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      documents.map(doc => signDocument(doc, signatureImage, signerName, signerInfo, user.id))
    );

    const successful: any[] = [];
    const failed: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({
          documentId: documentIds[index],
          ...result.value
        });
      } else {
        failed.push({
          documentId: documentIds[index],
          error: result.reason?.message || 'Erro desconhecido'
        });
      }
    });

    return NextResponse.json({
      success: true,
      total: documentIds.length,
      successful: successful.length,
      failed: failed.length,
      results: {
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('[BATCH_SIGN_ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao processar assinatura em lote' },
      { status: 500 }
    );
  }
}

async function signDocument(
  document: any,
  signatureImage: string | undefined,
  signerName: string | undefined,
  signerInfo: string | undefined,
  userId: string
) {
  try {
    const { data: pdfData } = await supabaseAdmin.storage
      .from('signflow')
      .download(document.original_pdf_path);

    if (!pdfData) {
      throw new Error('PDF não encontrado');
    }

    const pdfBytes = await pdfData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    if (signatureImage && document.metadata?.positions?.length > 0) {
      const signatureBytes = Buffer.from(
        signatureImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      const signatureImg = await pdfDoc.embedPng(signatureBytes);

      for (const position of document.metadata.positions) {
        const page = pdfDoc.getPage(position.page);
        const { width, height } = page.getSize();

        page.drawImage(signatureImg, {
          x: position.x,
          y: height - position.y - position.height,
          width: position.width,
          height: position.height,
          rotate: { angle: position.rotation || 0 }
        });
      }
    }

    const validateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/validate/${document.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(validateUrl, {
      width: 100,
      margin: 1
    });

    const qrBytes = Buffer.from(
      qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    const qrImage = await pdfDoc.embedPng(qrBytes);

    const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
    const { width: pageWidth, height: pageHeight } = lastPage.getSize();

    lastPage.drawImage(qrImage, {
      x: 20,
      y: 20,
      width: 80,
      height: 80
    });

    lastPage.drawText('Valide em:', {
      x: 110,
      y: 70,
      size: 8
    });

    lastPage.drawText(validateUrl, {
      x: 110,
      y: 55,
      size: 7,
      maxWidth: pageWidth - 130
    });

    const signedPdfBytes = await pdfDoc.save();
    const signedFileName = `signed/${document.id}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('signflow')
      .upload(signedFileName, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload do PDF assinado');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('signflow')
      .getPublicUrl(signedFileName);

    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({
        signed_pdf_url: urlData.publicUrl,
        signed_pdf_path: signedFileName,
        status: 'signed',
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', document.id);

    if (updateError) {
      throw new Error('Erro ao atualizar documento');
    }

    await supabaseAdmin
      .from('signing_events')
      .insert({
        document_id: document.id,
        signer_name: signerName || 'Usuário',
        signer_reg: signerInfo || null,
        signed_at: new Date().toISOString()
      });

    return {
      signedPdfUrl: urlData.publicUrl,
      validateUrl
    };

  } catch (error) {
    throw error;
  }
}