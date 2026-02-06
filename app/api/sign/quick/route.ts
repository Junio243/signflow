/**
 * API de Assinatura Rápida Unificada
 * 
 * Endpoint: POST /api/sign/quick
 * 
 * Características:
 * - Usa certificados auto-gerenciados (signflow_certificates)
 * - Cria registro em documents (visível no dashboard)
 * - Gera QR Code automaticamente
 * - Salva em signatures para rastreamento
 * - Adiciona assinatura PKI real
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { signPdfComplete, isCertificateConfigured } from '@/lib/digitalSignature';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface QuickSignPayload {
  document_base64: string;
  document_name: string;
  signer_name?: string;
  signer_email?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    
    // Extrair token do header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Validar payload
    const payload: QuickSignPayload = await req.json();

    if (!payload.document_base64 || !payload.document_name) {
      return NextResponse.json(
        { error: 'Dados incompletos: document_base64 e document_name são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🚀 Iniciando assinatura rápida...');
    console.log('   Usuário:', user.email);
    console.log('   Documento:', payload.document_name);

    // 3. Decodificar PDF
    const pdfBuffer = Buffer.from(payload.document_base64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    console.log('✅ PDF carregado:', pdfDoc.getPageCount(), 'páginas');

    // 4. Adicionar assinatura visual
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const signerName = payload.signer_name || user.email || 'Assinante';
    const signatureText = [
      'Assinado digitalmente por:',
      signerName,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      'Plataforma: SignFlow',
    ].join('\n');

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Retângulo de assinatura
    lastPage.drawRectangle({
      x: width - 260,
      y: 40,
      width: 240,
      height: 70,
      borderColor: rgb(0, 0.4, 0.8),
      borderWidth: 1.5,
      color: rgb(0.95, 0.97, 1),
    });

    // Texto de assinatura
    lastPage.drawText(signatureText, {
      x: width - 250,
      y: 90,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    console.log('✅ Assinatura visual adicionada');

    // 5. Criar documento ID
    const documentId = crypto.randomUUID();

    // 6. Gerar QR Code
    const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const validateUrl = `${base}/validate/${documentId}`;
    const qrPng = await QRCode.toBuffer(validateUrl, { width: 256 });

    // Adicionar QR Code ao PDF
    const qrImage = await pdfDoc.embedPng(qrPng);
    const qrSize = 80;
    const margin = 30;

    lastPage.drawImage(qrImage, {
      x: margin,
      y: margin,
      width: qrSize,
      height: qrSize,
    });

    // Texto ao lado do QR
    lastPage.drawText('Valide este documento:', {
      x: margin + qrSize + 10,
      y: margin + qrSize - 10,
      size: 7,
      font: font,
      color: rgb(0, 0, 0),
    });

    lastPage.drawText(validateUrl, {
      x: margin + qrSize + 10,
      y: margin + qrSize - 25,
      size: 6,
      font: font,
      color: rgb(0, 0, 0.8),
    });

    console.log('✅ QR Code adicionado');

    // 7. Salvar PDF modificado
    let pdfBytes = await pdfDoc.save();
    
    // 8. Calcular hash ANTES da assinatura PKI
    const documentHash = crypto.createHash('sha256').update(pdfBytes).digest('hex');

    // 9. Adicionar assinatura digital PKI
    let hasPKISignature = false;
    try {
      const hasCert = await isCertificateConfigured();
      if (hasCert) {
        console.log('🔐 Aplicando assinatura PKI...');
        pdfBytes = await signPdfComplete(Buffer.from(pdfBytes), {
          reason: 'Assinatura rápida via SignFlow',
          contactInfo: user.email || 'signflow@example.com',
          name: signerName,
          location: 'SignFlow Quick Sign',
        });
        hasPKISignature = true;
        console.log('✅ Assinatura PKI aplicada!');
      } else {
        console.log('ℹ️ Certificado não configurado, continuando sem PKI');
      }
    } catch (pkiError) {
      console.warn('⚠️ Erro ao aplicar PKI:', pkiError);
      hasPKISignature = false;
    }

    // 10. Upload do PDF original
    const originalPath = `${documentId}/original.pdf`;
    const { error: uploadOrigError } = await supabase.storage
      .from('signflow')
      .upload(originalPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadOrigError) {
      console.error('Erro ao fazer upload do original:', uploadOrigError);
      return NextResponse.json(
        { error: 'Erro ao armazenar documento original' },
        { status: 500 }
      );
    }

    // 11. Upload do PDF assinado
    const signedPath = `${documentId}/signed.pdf`;
    const { error: uploadSignedError } = await supabase.storage
      .from('signflow')
      .upload(signedPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadSignedError) {
      console.error('Erro ao fazer upload do assinado:', uploadSignedError);
      await supabase.storage.from('signflow').remove([originalPath]);
      return NextResponse.json(
        { error: 'Erro ao armazenar documento assinado' },
        { status: 500 }
      );
    }

    // 12. Upload do QR Code
    const qrPath = `${documentId}/qr.png`;
    await supabase.storage.from('signflow').upload(qrPath, qrPng, {
      contentType: 'image/png',
      upsert: false,
    });

    // 13. Obter URLs públicas
    const { data: signedUrl } = supabase.storage.from('signflow').getPublicUrl(signedPath);
    const { data: qrUrl } = supabase.storage.from('signflow').getPublicUrl(qrPath);

    console.log('✅ Arquivos armazenados');

    // 14. Calcular expires_at (7 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 15. Criar registro em documents
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: user.id,
        original_pdf_name: payload.document_name,
        signed_pdf_url: signedUrl.publicUrl,
        qr_code_url: qrUrl.publicUrl,
        status: 'signed',
        expires_at: expiresAt.toISOString(),
        metadata: {
          quick_sign: true,
          signer_name: signerName,
          signer_email: payload.signer_email || user.email,
          signed_at: new Date().toISOString(),
          has_pki_signature: hasPKISignature,
        },
      });

    if (docError) {
      console.error('Erro ao criar documento:', docError);
      console.error('Detalhes do erro:', JSON.stringify(docError, null, 2));
      // Limpar arquivos
      await supabase.storage.from('signflow').remove([originalPath, signedPath, qrPath]);
      return NextResponse.json(
        { error: 'Erro ao salvar documento: ' + docError.message },
        { status: 500 }
      );
    }

    console.log('✅ Documento salvo:', documentId);

    // 16. Salvar em signatures
    const { error: sigError } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        user_id: user.id,
        signer_name: signerName,
        signer_email: payload.signer_email || user.email,
        signature_type: hasPKISignature ? 'both' : 'visual',
        document_hash: documentHash,
        signature_data: {
          signerName: signerName,
          signerEmail: payload.signer_email || user.email,
          signatureAlgorithm: hasPKISignature ? 'RSA-SHA256' : 'Visual',
          documentHash: documentHash,
          quickSign: true,
        },
        status: 'completed',
        signed_at: new Date().toISOString(),
      });

    if (sigError) {
      console.warn('⚠️ Erro ao salvar em signatures:', sigError);
      console.warn('Detalhes:', JSON.stringify(sigError, null, 2));
    } else {
      console.log('✅ Assinatura registrada');
    }

    console.log('✨ Assinatura rápida concluída:', documentId);

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        signed_pdf_url: signedUrl.publicUrl,
        qr_code_url: qrUrl.publicUrl,
        validate_url: validateUrl,
        has_pki_signature: hasPKISignature,
      },
      message: 'Documento assinado com sucesso!',
    });
  } catch (error: any) {
    console.error('❌ Erro ao processar assinatura rápida:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Erro ao processar assinatura: ' + (error.message || 'Desconhecido') },
      { status: 500 }
    );
  }
}
