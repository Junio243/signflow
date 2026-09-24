/**
 * API de Verificação de Assinatura Digital
 * 
 * Endpoint: GET /api/verify-signature/[id]
 * 
 * Verifica se o PDF possui assinatura digital PKI real
 * e retorna informações detalhadas sobre a assinatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyPDFSignature } from '@/lib/pdfVerification';
import { documentIdSchema } from '@/lib/validation/documentSchemas';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Validar ID
    const idResult = documentIdSchema.safeParse((await params).id);
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    const id = idResult.data;
    
    // Buscar documento
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, signed_pdf_url, status')
      .eq('id', id)
      .maybeSingle();
    
    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se tem PDF assinado
    if (!doc.signed_pdf_url) {
      return NextResponse.json({
        id: doc.id,
        status: doc.status,
        hasPDFSignature: false,
        signatureType: 'none',
        message: 'Documento ainda não foi assinado',
      });
    }
    
    // Baixar PDF assinado
    console.log(`🔍 Baixando PDF para verificação: ${doc.signed_pdf_url}`);
    const pdfResponse = await fetch(doc.signed_pdf_url);
    
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: 'Falha ao baixar PDF assinado' },
        { status: 500 }
      );
    }
    
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    
    // Verificar assinatura
    const verification = await verifyPDFSignature(pdfBuffer);
    
    // Buscar assinatura salva no banco
    const { data: signature } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Comparar hash se existir
    let hashMatch = false;
    if (signature?.document_hash) {
      hashMatch = signature.document_hash === verification.documentHash;
    }
    
    // Determinar status de validação
    let validationStatus: 'valid' | 'invalid' | 'visual_only' | 'no_signature';
    let validationMessage: string;
    
    if (verification.hasPKISignature) {
      validationStatus = hashMatch ? 'valid' : 'invalid';
      validationMessage = hashMatch
        ? 'Documento contém assinatura digital PKI válida reconhecida por leitores de PDF'
        : 'Documento contém assinatura PKI mas o hash não corresponde (possível adulteração)';
    } else if (verification.signatureType === 'visual_only') {
      validationStatus = 'visual_only';
      validationMessage = 'Documento possui apenas assinatura visual, sem assinatura digital PKI';
    } else {
      validationStatus = 'no_signature';
      validationMessage = 'Documento não possui assinatura digital';
    }
    
    // Retornar resultado
    return NextResponse.json({
      id: doc.id,
      status: doc.status,
      validation: {
        status: validationStatus,
        message: validationMessage,
        hasPKISignature: verification.hasPKISignature,
        signatureType: verification.signatureType,
        signatureCount: verification.signatureCount,
        documentHash: verification.documentHash,
        hashMatch,
        storedHash: signature?.document_hash || null,
        validationMethod: verification.validationMethod,
      },
      signatureDetails: verification.signatureDetails || [],
      databaseSignature: signature ? {
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        signedAt: signature.signed_at,
        signatureType: signature.signature_type,
      } : null,
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar assinatura', details: error.message },
      { status: 500 }
    );
  }
}
