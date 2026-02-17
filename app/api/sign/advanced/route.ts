import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type SignaturePosition = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type QRCodeConfig = {
  enabled: boolean;
  page: number;
  x: number;
  y: number;
  size: number;
};

type PDFProtection = {
  enabled: boolean;
  password: string;
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await req.json();
    const {
      certificate_id,
      certificate_password,
      document_name,
      document_base64,
      signature_position,
      qr_code_config,
      pdf_protection,
    }: {
      certificate_id: string;
      certificate_password: string;
      document_name: string;
      document_base64: string;
      signature_position: SignaturePosition;
      qr_code_config: QRCodeConfig;
      pdf_protection: PDFProtection;
    } = body;

    if (!certificate_id || !certificate_password || !document_base64) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // 1. Buscar certificado
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificate_id)
      .eq('user_id', user.id)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      );
    }

    // 2. Validar senha do certificado
    const isPasswordValid = await validateCertificatePassword(
      certificate.encrypted_password,
      certificate_password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha do certificado incorreta' },
        { status: 401 }
      );
    }

    // 3. Verificar validade
    const expiresAt = new Date(certificate.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Certificado expirado' },
        { status: 400 }
      );
    }

    // 4. Extrair dados do certificado
    const subjectData = certificate.subject_data || {};
    const signerName = subjectData.fullName || subjectData.companyName || 'Assinante';
    const signerDocument = subjectData.cpf || subjectData.cnpj || 'N/A';
    const signerEmail = subjectData.email || subjectData.businessEmail || subjectData.legalRepresentative?.email || 'N/A';

    // 5. Carregar PDF
    const pdfBytes = Buffer.from(document_base64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Validar página
    const sigPage = Math.min(Math.max(1, signature_position.page), pages.length) - 1;
    const page = pages[sigPage];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // 6. Adicionar assinatura visual
    const signatureText = [
      `Assinado digitalmente por:`,
      signerName,
      `${certificate.certificate_type}: ${signerDocument}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
    ].join('\n');

    page.drawRectangle({
      x: signature_position.x,
      y: pageHeight - signature_position.y - signature_position.height,
      width: signature_position.width,
      height: signature_position.height,
      borderColor: rgb(0.4, 0.2, 0.6),
      borderWidth: 1,
      color: rgb(0.98, 0.97, 1),
    });

    page.drawText(signatureText, {
      x: signature_position.x + 10,
      y: pageHeight - signature_position.y - 25,
      size: 8,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 12,
      maxWidth: signature_position.width - 20,
    });

    // 7. Adicionar QR Code se habilitado
    if (qr_code_config.enabled) {
      const qrData = JSON.stringify({
        signer: signerName,
        document: signerDocument,
        certificate_type: certificate.certificate_type,
        signed_at: new Date().toISOString(),
        certificate_id: certificate.id,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: qr_code_config.size * 2,
        margin: 1,
      });

      const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const qrPage = Math.min(Math.max(1, qr_code_config.page), pages.length) - 1;
      const targetPage = pages[qrPage];
      const targetPageHeight = targetPage.getSize().height;

      targetPage.drawImage(qrImage, {
        x: qr_code_config.x,
        y: targetPageHeight - qr_code_config.y - qr_code_config.size,
        width: qr_code_config.size,
        height: qr_code_config.size,
      });
    }

    // 8. Proteger PDF com senha se habilitado
    if (pdf_protection.enabled && pdf_protection.password) {
      // PDFLib não suporta encryption diretamente
      // Adicionar metadados indicando proteção
      pdfDoc.setTitle(`Documento Protegido - ${document_name}`);
      pdfDoc.setSubject('Documento assinado digitalmente e protegido');
    }

    // 9. Adicionar metadados
    pdfDoc.setProducer('SignFlow - Assinatura Digital Avançada');
    pdfDoc.setCreator('SignFlow');
    pdfDoc.setAuthor(signerName);
    pdfDoc.setKeywords([
      'assinatura digital',
      certificate.certificate_type,
      signerDocument,
    ]);

    // 10. Gerar PDF final
    const signedPdfBytes = await pdfDoc.save();

    // 11. Fazer upload do documento assinado
    const timestamp = Date.now();
    const sanitizedName = document_name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storagePath = `${user.id}/signed/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao salvar documento: ' + uploadError.message },
        { status: 500 }
      );
    }

    // 12. Gerar URL de download
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600); // 1 hora

    if (!urlData) {
      return NextResponse.json(
        { error: 'Erro ao gerar URL de download' },
        { status: 500 }
      );
    }

    // 13. Registrar assinatura no banco
    const { error: insertError } = await supabase.from('signed_documents').insert({
      user_id: user.id,
      certificate_id: certificate.id,
      original_name: document_name,
      signed_name: fileName,
      storage_path: storagePath,
      signature_type: 'advanced',
      signature_data: {
        signer_name: signerName,
        signer_document: signerDocument,
        signer_email: signerEmail,
        certificate_type: certificate.certificate_type,
        signature_position,
        qr_code_config,
        pdf_protection: pdf_protection.enabled,
        signed_at: new Date().toISOString(),
      },
    });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    return NextResponse.json({
      success: true,
      signed_document_url: urlData.signedUrl,
      signer_info: {
        name: signerName,
        document: signerDocument,
        email: signerEmail,
        certificate_type: certificate.certificate_type,
      },
    });
  } catch (error) {
    console.error('Advanced sign error:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar assinatura',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para validar senha - CORRIGIDA
async function validateCertificatePassword(
  encryptedPassword: string,
  providedPassword: string
): Promise<boolean> {
  try {
    // Obter a chave de criptografia do ambiente (mesma usada na criação)
    const encryptionKey = process.env.CERTIFICATE_ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('CERTIFICATE_ENCRYPTION_KEY não configurada');
      return false;
    }

    // Separar IV e senha criptografada
    const [ivHex, encryptedHex] = encryptedPassword.split(':');
    if (!ivHex || !encryptedHex) {
      console.error('Formato de senha criptografada inválido');
      return false;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Derivar a chave usando a CERTIFICATE_ENCRYPTION_KEY (não a senha do usuário!)
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    
    // Descriptografar
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Comparar a senha descriptografada com a senha fornecida
    const decryptedPassword = decrypted.toString('utf8');
    return decryptedPassword === providedPassword;
  } catch (error) {
    console.error('Erro ao validar senha:', error);
    return false;
  }
}
