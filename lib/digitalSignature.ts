/**
 * Módulo de Assinatura Digital com Certificado PKI
 * 
 * Implementa assinatura digital em PDFs usando certificados P12/PFX
 * Compatível com Adobe Reader, Foxit e outros leitores de PDF
 * 
 * @see https://www.npmjs.com/package/@signpdf/signpdf
 */

import signpdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import fs from 'fs';
import path from 'path';

/**
 * Opções para assinatura digital
 */
export interface DigitalSignatureOptions {
  /** Motivo da assinatura */
  reason?: string;
  /** Informações de contato do signatário */
  contactInfo?: string;
  /** Nome do signatário */
  name?: string;
  /** Localização onde foi assinado */
  location?: string;
  /** Caminho para o certificado P12/PFX */
  certificatePath?: string;
  /** Senha do certificado */
  certificatePassword?: string;
}

/**
 * Adiciona placeholder de assinatura em PDF
 * 
 * O placeholder reserva espaço no PDF para a assinatura digital
 * que será adicionada posteriormente.
 * 
 * @param pdfBuffer Buffer do PDF original
 * @param reason Motivo da assinatura
 * @param contactInfo Informações de contato
 * @param name Nome do signatário
 * @param location Localização onde foi assinado
 * @returns PDF com placeholder de assinatura
 */
export function addSignaturePlaceholder(
  pdfBuffer: Buffer,
  reason: string = 'Documento assinado digitalmente pelo SignFlow',
  contactInfo: string = 'suporte@signflow.com',
  name: string = 'SignFlow Digital Signature',
  location: string = 'SignFlow Platform'
): Buffer {
  try {
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason,
      contactInfo,
      name,
      location,
    });

    return pdfWithPlaceholder;
  } catch (error) {
    console.error('Erro ao adicionar placeholder de assinatura:', error);
    throw new Error(`Falha ao adicionar placeholder: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
  }
}

/**
 * Assina digitalmente um PDF com certificado P12/PFX
 * 
 * Usa certificado digital padrão PKI para criar assinatura PKCS#7
 * que é reconhecida por Adobe Reader e outros leitores de PDF.
 * 
 * @param pdfBuffer Buffer do PDF com placeholder
 * @param certificatePath Caminho para o certificado P12
 * @param certificatePassword Senha do certificado
 * @returns PDF assinado digitalmente
 * @throws Error se certificado não for encontrado ou senha inválida
 */
export async function signPdfDigitally(
  pdfBuffer: Buffer,
  certificatePath?: string,
  certificatePassword?: string
): Promise<Buffer> {
  try {
    // Usar certificado padrão se não especificado
    const certPath = certificatePath || path.join(process.cwd(), 'certificates', 'certificate.p12');
    const certPassword = certificatePassword || process.env.CERTIFICATE_PASSWORD || '';

    // Verificar se certificado existe
    if (!fs.existsSync(certPath)) {
      throw new Error(
        `Certificado não encontrado: ${certPath}\n` +
        'Gere um certificado com: npm run generate-certificate\n' +
        'Ou configure CERTIFICATE_PATH no .env.local'
      );
    }

    // Carregar certificado
    const certificateBuffer = fs.readFileSync(certPath);

    // Criar signer com certificado P12
    const signer = new P12Signer(certificateBuffer, {
      passphrase: certPassword,
    });

    // Assinar PDF com PKCS#7
    const signedPdf = await signpdf.sign(pdfBuffer, signer);

    console.log('✅ PDF assinado digitalmente com sucesso');
    return signedPdf;
  } catch (error) {
    console.error('❌ Erro ao assinar PDF digitalmente:', error);
    throw new Error(
      `Falha na assinatura digital: ${error instanceof Error ? error.message : 'erro desconhecido'}`
    );
  }
}

/**
 * Fluxo completo: adiciona placeholder e assina digitalmente
 * 
 * Esta é a função principal para assinar PDFs com certificado digital.
 * Ela executa todo o processo:
 * 1. Adiciona placeholder de assinatura no PDF
 * 2. Assina digitalmente com certificado P12/PFX
 * 3. Retorna PDF final assinado
 * 
 * @param pdfBuffer Buffer do PDF original
 * @param options Opções de assinatura (motivo, contato, certificado, etc.)
 * @returns PDF assinado digitalmente com certificado PKI
 * 
 * @example
 * ```typescript
 * const pdfBuffer = fs.readFileSync('documento.pdf');
 * const signedPdf = await signPdfComplete(pdfBuffer, {
 *   reason: 'Aprovação de contrato',
 *   contactInfo: 'joao@empresa.com',
 *   name: 'João Silva',
 *   location: 'São Paulo, Brasil'
 * });
 * fs.writeFileSync('documento-assinado.pdf', signedPdf);
 * ```
 */
export async function signPdfComplete(
  pdfBuffer: Buffer,
  options?: DigitalSignatureOptions
): Promise<Buffer> {
  try {
    console.log('🔐 Iniciando assinatura digital do PDF...');

    // 1. Adicionar placeholder de assinatura
    console.log('1/2 Adicionando placeholder de assinatura...');
    const pdfWithPlaceholder = addSignaturePlaceholder(
      pdfBuffer,
      options?.reason,
      options?.contactInfo,
      options?.name,
      options?.location
    );

    // 2. Assinar digitalmente com certificado
    console.log('2/2 Assinando com certificado digital...');
    const signedPdf = await signPdfDigitally(
      pdfWithPlaceholder,
      options?.certificatePath,
      options?.certificatePassword
    );

    console.log('✨ Assinatura digital completa!');
    return signedPdf;
  } catch (error) {
    console.error('❌ Erro no processo de assinatura digital:', error);
    throw error;
  }
}

/**
 * Verifica se certificado digital está configurado
 * 
 * @returns true se certificado existe e é acessível
 */
export function isCertificateConfigured(): boolean {
  const certPath = process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
  return fs.existsSync(certPath);
}

/**
 * Obtém caminho do certificado configurado
 * 
 * @returns Caminho completo para o certificado ou null se não configurado
 */
export function getCertificatePath(): string | null {
  const certPath = process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
  return fs.existsSync(certPath) ? certPath : null;
}
