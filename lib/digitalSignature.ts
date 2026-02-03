/**
 * Módulo de Assinatura Digital com Certificado PKI
 * 
 * Implementa assinatura digital em PDFs usando certificados P12/PFX
 * Compatível com Adobe Reader, Foxit e outros leitores de PDF
 * 
 * NOVIDADE: Agora usa certificados auto-gerenciados pelo SignFlow!
 * O sistema gera e gerencia certificados automaticamente no banco de dados.
 * 
 * @see https://www.npmjs.com/package/@signpdf/signpdf
 */

import signpdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import fs from 'fs';
import path from 'path';
import {
  getOrCreateSignFlowCertificate,
  getCertificateP12Buffer,
  getCertificatePassword
} from './certificateManager';

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
  /** Forçar uso de certificado externo (arquivo P12) */
  useExternalCertificate?: boolean;
  /** Caminho para certificado P12/PFX externo (sobrescreve auto-gerenciado) */
  certificatePath?: string;
  /** Senha do certificado externo */
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
 * Assina digitalmente um PDF usando certificado gerenciado pelo SignFlow
 * 
 * Este método usa certificados auto-gerados e armazenados no banco de dados.
 * Não requer configuração manual de certificados!
 * 
 * @param pdfBuffer Buffer do PDF com placeholder
 * @returns PDF assinado digitalmente
 */
async function signPdfWithManagedCertificate(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('🏭 Usando certificado auto-gerenciado SignFlow...');

    // Obter ou gerar certificado automaticamente
    const certificate = await getOrCreateSignFlowCertificate();
    console.log(`✅ Certificado obtido: ${certificate.serial_number}`);

    // Converter para buffer P12
    const certificateBuffer = getCertificateP12Buffer(certificate);
    const certificatePassword = getCertificatePassword();

    // Criar signer com certificado P12
    const signer = new P12Signer(certificateBuffer, {
      passphrase: certificatePassword,
    });

    // Assinar PDF com PKCS#7
    const signedPdf = await signpdf.sign(pdfBuffer, signer);

    console.log('✅ PDF assinado com certificado SignFlow!');
    return signedPdf;
  } catch (error) {
    console.error('❌ Erro ao assinar com certificado gerenciado:', error);
    throw error;
  }
}

/**
 * Assina digitalmente um PDF com certificado P12/PFX externo
 * 
 * Usa certificado digital externo (ICP-Brasil, etc.) fornecido manualmente.
 * 
 * @param pdfBuffer Buffer do PDF com placeholder
 * @param certificatePath Caminho para o certificado P12
 * @param certificatePassword Senha do certificado
 * @returns PDF assinado digitalmente
 * @throws Error se certificado não for encontrado ou senha inválida
 */
export async function signPdfWithExternalCertificate(
  pdfBuffer: Buffer,
  certificatePath?: string,
  certificatePassword?: string
): Promise<Buffer> {
  try {
    console.log('📄 Usando certificado externo...');

    // Usar certificado padrão se não especificado
    const certPath = certificatePath || process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
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

    console.log('✅ PDF assinado com certificado externo!');
    return signedPdf;
  } catch (error) {
    console.error('❌ Erro ao assinar PDF com certificado externo:', error);
    throw new Error(
      `Falha na assinatura digital: ${error instanceof Error ? error.message : 'erro desconhecido'}`
    );
  }
}

/**
 * Fluxo completo: adiciona placeholder e assina digitalmente
 * 
 * Esta é a função principal para assinar PDFs com certificado digital.
 * 
 * **MODO AUTOMÁTICO (Padrão)**:
 * - Usa certificado auto-gerenciado pelo SignFlow
 * - Gerado e armazenado automaticamente no banco de dados
 * - Zero configuração necessária!
 * 
 * **MODO EXTERNO (Opcional)**:
 * - Use `useExternalCertificate: true` para certificados ICP-Brasil
 * - Requer certificado P12 e senha
 * 
 * @param pdfBuffer Buffer do PDF original
 * @param options Opções de assinatura (motivo, contato, certificado, etc.)
 * @returns PDF assinado digitalmente com certificado PKI
 * 
 * @example
 * ```typescript
 * // Modo automático (certificado SignFlow)
 * const signedPdf = await signPdfComplete(pdfBuffer, {
 *   reason: 'Aprovação de contrato',
 *   name: 'João Silva'
 * });
 * 
 * // Modo externo (certificado ICP-Brasil)
 * const signedPdf = await signPdfComplete(pdfBuffer, {
 *   reason: 'Aprovação de contrato',
 *   useExternalCertificate: true,
 *   certificatePath: './meu-certificado.p12',
 *   certificatePassword: 'minha-senha'
 * });
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
    
    let signedPdf: Buffer;

    // Decidir qual tipo de certificado usar
    const useExternal = options?.useExternalCertificate || 
                        options?.certificatePath || 
                        process.env.CERTIFICATE_PATH;

    if (useExternal) {
      // Modo externo: usar certificado P12 fornecido
      console.log('🔹 Modo: Certificado Externo (ICP-Brasil ou similar)');
      signedPdf = await signPdfWithExternalCertificate(
        pdfWithPlaceholder,
        options?.certificatePath,
        options?.certificatePassword
      );
    } else {
      // Modo automático: usar certificado auto-gerenciado
      console.log('🔸 Modo: Certificado Auto-Gerenciado SignFlow');
      signedPdf = await signPdfWithManagedCertificate(pdfWithPlaceholder);
    }

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
 * Agora verifica tanto certificados externos quanto auto-gerenciados.
 * 
 * @returns true se algum tipo de certificado está disponível
 */
export async function isCertificateConfigured(): Promise<boolean> {
  // Verificar certificado externo
  const certPath = process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
  if (fs.existsSync(certPath)) {
    return true;
  }

  // Verificar certificado auto-gerenciado
  try {
    const cert = await getOrCreateSignFlowCertificate();
    return !!cert;
  } catch (error) {
    console.warn('⚠️ Erro ao verificar certificado auto-gerenciado:', error);
    return false;
  }
}

/**
 * Verifica se certificado está configurado (versão síncrona)
 * 
 * Verifica apenas certificados externos.
 * Para certificados auto-gerenciados, use isCertificateConfigured() (async).
 * 
 * @returns true se certificado externo existe
 */
export function isCertificateConfiguredSync(): boolean {
  const certPath = process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
  return fs.existsSync(certPath);
}

/**
 * Obtém caminho do certificado configurado (externo)
 * 
 * @returns Caminho completo para o certificado ou null se não configurado
 */
export function getCertificatePath(): string | null {
  const certPath = process.env.CERTIFICATE_PATH || path.join(process.cwd(), 'certificates', 'certificate.p12');
  return fs.existsSync(certPath) ? certPath : null;
}
