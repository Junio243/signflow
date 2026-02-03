/**
 * Módulo de Verificação de Assinaturas em PDF
 * 
 * Verifica se um PDF possui assinatura digital PKI/PKCS#7 real
 * reconhecida por leitores de PDF (Adobe, Foxit, etc.)
 */

import crypto from 'crypto';

export interface PDFSignatureInfo {
  hasPKISignature: boolean;
  signatureCount: number;
  signatureType: 'none' | 'visual_only' | 'digital_pki' | 'both';
  signatureDetails?: {
    signerName?: string;
    signDate?: Date;
    reason?: string;
    location?: string;
  }[];
  documentHash: string;
  validationMethod: 'pdf_structure' | 'hash_only';
}

/**
 * Verifica se o PDF contém assinatura digital PKI
 * 
 * Busca por indicadores de assinatura PKCS#7 na estrutura do PDF:
 * - /Type /Sig (objeto de assinatura)
 * - /SubFilter /adbe.pkcs7 (formato PKCS#7)
 * - /ByteRange (intervalo de bytes assinados)
 * 
 * @param pdfBuffer Buffer do PDF
 * @returns Informações sobre assinaturas encontradas
 */
export async function verifyPDFSignature(pdfBuffer: Buffer): Promise<PDFSignatureInfo> {
  try {
    const pdfText = pdfBuffer.toString('binary');
    
    // Calcular hash do documento
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    
    // Padrões que indicam assinatura digital PKI
    const signaturePatterns = [
      /\/Type\s*\/Sig/gi,                    // Objeto de assinatura
      /\/SubFilter\s*\/adbe\.pkcs7/gi,       // PKCS#7 (Adobe)
      /\/SubFilter\s*\/ETSI\.CAdES/gi,       // CAdES (padrão europeu)
      /\/ByteRange\s*\[/gi,                   // Intervalo de bytes assinados
      /\/Contents\s*</gi,                     // Conteúdo da assinatura
    ];
    
    // Contar correspondências
    let signatureIndicators = 0;
    const matches: string[] = [];
    
    for (const pattern of signaturePatterns) {
      const found = pdfText.match(pattern);
      if (found) {
        signatureIndicators += found.length;
        matches.push(pattern.source);
      }
    }
    
    // Buscar número de assinaturas
    const sigTypeMatches = pdfText.match(/\/Type\s*\/Sig/gi);
    const signatureCount = sigTypeMatches ? sigTypeMatches.length : 0;
    
    // Determinar tipo de assinatura
    const hasPKISignature = signatureIndicators >= 3 && signatureCount > 0;
    
    // Buscar detalhes das assinaturas
    const signatureDetails = hasPKISignature ? extractSignatureDetails(pdfText, signatureCount) : undefined;
    
    // Verificar se tem marca d'água visual
    const hasVisualSignature = 
      pdfText.includes('Assinado digitalmente') ||
      pdfText.includes('SignFlow') ||
      pdfText.includes('Documento assinado');
    
    let signatureType: PDFSignatureInfo['signatureType'];
    if (hasPKISignature && hasVisualSignature) {
      signatureType = 'both';
    } else if (hasPKISignature) {
      signatureType = 'digital_pki';
    } else if (hasVisualSignature) {
      signatureType = 'visual_only';
    } else {
      signatureType = 'none';
    }
    
    console.log(`🔍 Verificação de assinatura PDF:`);
    console.log(`   - Indicadores PKI encontrados: ${signatureIndicators}`);
    console.log(`   - Número de assinaturas: ${signatureCount}`);
    console.log(`   - Tipo: ${signatureType}`);
    console.log(`   - Hash SHA-256: ${documentHash}`);
    
    return {
      hasPKISignature,
      signatureCount,
      signatureType,
      signatureDetails,
      documentHash,
      validationMethod: 'pdf_structure',
    };
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura PDF:', error);
    
    // Fallback: apenas calcular hash
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    
    return {
      hasPKISignature: false,
      signatureCount: 0,
      signatureType: 'none',
      documentHash,
      validationMethod: 'hash_only',
    };
  }
}

/**
 * Extrai detalhes das assinaturas encontradas no PDF
 */
function extractSignatureDetails(pdfText: string, signatureCount: number): PDFSignatureInfo['signatureDetails'] {
  const details: NonNullable<PDFSignatureInfo['signatureDetails']> = [];
  
  try {
    // Buscar padrões de nome do signatário
    const namePattern = /\/Name\s*\((.*?)\)/g;
    const nameMatches = Array.from(pdfText.matchAll(namePattern));
    
    // Buscar padrões de motivo
    const reasonPattern = /\/Reason\s*\((.*?)\)/g;
    const reasonMatches = Array.from(pdfText.matchAll(reasonPattern));
    
    // Buscar padrões de localização
    const locationPattern = /\/Location\s*\((.*?)\)/g;
    const locationMatches = Array.from(pdfText.matchAll(locationPattern));
    
    // Buscar padrões de data (formato PDF)
    const datePattern = /\/M\s*\(D:(\d{14})/g;
    const dateMatches = Array.from(pdfText.matchAll(datePattern));
    
    // Criar objetos de detalhes
    for (let i = 0; i < signatureCount; i++) {
      const detail: NonNullable<PDFSignatureInfo['signatureDetails']>[0] = {};
      
      if (nameMatches[i]) {
        detail.signerName = decodeURIComponent(nameMatches[i][1]);
      }
      
      if (reasonMatches[i]) {
        detail.reason = decodeURIComponent(reasonMatches[i][1]);
      }
      
      if (locationMatches[i]) {
        detail.location = decodeURIComponent(locationMatches[i][1]);
      }
      
      if (dateMatches[i]) {
        const dateStr = dateMatches[i][1];
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        const hour = parseInt(dateStr.substring(8, 10));
        const minute = parseInt(dateStr.substring(10, 12));
        const second = parseInt(dateStr.substring(12, 14));
        
        detail.signDate = new Date(year, month, day, hour, minute, second);
      }
      
      details.push(detail);
    }
    
    return details.length > 0 ? details : undefined;
  } catch (error) {
    console.warn('⚠️ Erro ao extrair detalhes de assinatura:', error);
    return undefined;
  }
}

/**
 * Verifica assinatura de PDF baixado de URL
 */
export async function verifyPDFFromURL(url: string): Promise<PDFSignatureInfo> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return await verifyPDFSignature(buffer);
  } catch (error) {
    console.error('❌ Erro ao verificar PDF da URL:', error);
    throw error;
  }
}

/**
 * Compara hash de um PDF com hash armazenado
 */
export function compareDocumentHash(pdfBuffer: Buffer, storedHash: string): boolean {
  const currentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  return currentHash === storedHash;
}
