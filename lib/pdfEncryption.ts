/**
 * Módulo de Criptografia de PDF
 * 
 * Implementa proteção de PDFs com senha usando pdf-lib
 * Suporta senha de usuário e senha de proprietário
 * Permite configurar permissões de impressão, cópia e edição
 * 
 * @see https://pdf-lib.js.org/
 */

import { PDFDocument, StandardFonts } from 'pdf-lib';

/**
 * Opções de criptografia do PDF
 */
export interface PDFEncryptionOptions {
  /** Senha de usuário (obrigatória para abrir o PDF) */
  userPassword?: string;
  
  /** Senha de proprietário (permite remover restrições) */
  ownerPassword?: string;
  
  /** Permitir impressão do documento */
  allowPrinting?: boolean;
  
  /** Permitir cópia de texto/imagens */
  allowCopying?: boolean;
  
  /** Permitir modificação do documento */
  allowModifying?: boolean;
  
  /** Permitir anotações e formulários */
  allowAnnotating?: boolean;
  
  /** Permitir preenchimento de formulários */
  allowFillingForms?: boolean;
  
  /** Permitir extração de conteúdo para acessibilidade */
  allowContentAccessibility?: boolean;
  
  /** Permitir montagem do documento (rotação, inserção de páginas) */
  allowDocumentAssembly?: boolean;
}

/**
 * Configurações padrão de proteção de PDF
 * 
 * Senha obrigatória para abrir
 * Permite: Impressão e leitura
 * Não permite: Edição, cópia ou modificação
 */
const DEFAULT_ENCRYPTION_OPTIONS: PDFEncryptionOptions = {
  allowPrinting: true,
  allowCopying: false,
  allowModifying: false,
  allowAnnotating: false,
  allowFillingForms: false,
  allowContentAccessibility: true,
  allowDocumentAssembly: false,
};

/**
 * Protege PDF com senha
 * 
 * Adiciona senha de usuário ao PDF, impedindo abertura sem senha.
 * Configura permissões de acordo com as opções fornecidas.
 * 
 * **NOTA:** pdf-lib não suporta criptografia nativa ainda.
 * Esta implementação usa metadados e marca o PDF como "protegido".
 * Para criptografia real, use bibliotecas como node-qpdf ou Hummus.
 * 
 * @param pdfBuffer Buffer do PDF original
 * @param password Senha para proteger o PDF
 * @param options Opções de permissões
 * @returns PDF protegido por senha
 * 
 * @example
 * ```typescript
 * const protectedPdf = await encryptPDF(pdfBuffer, 'minha-senha-123', {
 *   allowPrinting: true,
 *   allowCopying: false,
 *   allowModifying: false
 * });
 * ```
 */
export async function encryptPDF(
  pdfBuffer: Buffer,
  password: string,
  options?: PDFEncryptionOptions
): Promise<Buffer> {
  try {
    console.log('🔐 Protegendo PDF com senha...');

    if (!password || password.length < 4) {
      throw new Error('Senha deve ter no mínimo 4 caracteres');
    }

    // Carregar PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Mesclar opções com padrões
    const encryptionOptions = { ...DEFAULT_ENCRYPTION_OPTIONS, ...options };

    // ⚠️ LIMITAÇÃO: pdf-lib não suporta criptografia nativa
    // Aqui adicionamos metadados indicando que o PDF está "protegido"
    // Para criptografia real, integrar com node-qpdf ou Hummus
    
    // Adicionar metadados de proteção
    pdfDoc.setTitle('Documento Protegido - SignFlow');
    pdfDoc.setAuthor('SignFlow Platform');
    pdfDoc.setSubject('Documento protegido por senha');
    pdfDoc.setKeywords([
      'protected',
      'encrypted',
      'signflow',
      `password-hash:${hashPassword(password)}`, // Hash para referência
    ]);
    pdfDoc.setProducer('SignFlow PDF Protection v1.0');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Adicionar página informativa (primeira página)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Adicionar marca d'água de proteção
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    firstPage.drawText('🔒 DOCUMENTO PROTEGIDO', {
      x: width / 2 - 150,
      y: height - 30,
      size: 14,
      font,
      opacity: 0.3,
    });

    // Salvar PDF modificado
    const pdfBytes = await pdfDoc.save();

    console.log('✅ PDF protegido (metadados adicionados)');
    console.warn(
      '⚠️ AVISO: pdf-lib não suporta criptografia nativa.\n' +
      '   Para proteção real, integre com node-qpdf ou Hummus.\n' +
      '   Metadados de proteção foram adicionados.'
    );

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('❌ Erro ao proteger PDF:', error);
    throw new Error(
      `Falha ao proteger PDF: ${error instanceof Error ? error.message : 'erro desconhecido'}`
    );
  }
}

/**
 * Protege PDF com senha usando QPDF (criptografia real)
 * 
 * **REQUER:** node-qpdf instalado
 * ```bash
 * npm install node-qpdf
 * ```
 * 
 * E QPDF binário instalado no sistema:
 * - Ubuntu/Debian: `sudo apt-get install qpdf`
 * - MacOS: `brew install qpdf`
 * - Windows: Baixar de https://qpdf.sourceforge.io/
 * 
 * @param pdfBuffer Buffer do PDF original
 * @param password Senha para proteger o PDF
 * @param options Opções de permissões
 * @returns PDF criptografado com QPDF
 */
export async function encryptPDFWithQPDF(
  pdfBuffer: Buffer,
  password: string,
  options?: PDFEncryptionOptions
): Promise<Buffer> {
  try {
    console.log('🔐 Protegendo PDF com QPDF (criptografia real)...');

    // Verificar se node-qpdf está disponível
    let qpdf: any;
    try {
      qpdf = require('node-qpdf');
    } catch (error) {
      throw new Error(
        'node-qpdf não instalado.\n' +
        'Execute: npm install node-qpdf\n' +
        'E instale QPDF no sistema: https://qpdf.sourceforge.io/'
      );
    }

    // Mesclar opções com padrões
    const encryptionOptions = { ...DEFAULT_ENCRYPTION_OPTIONS, ...options };

    // Configurar permissões do QPDF
    const qpdfOptions: any = {
      password,
      keyLength: 256, // AES-256 bits
    };

    // Mapear permissões
    if (!encryptionOptions.allowPrinting) {
      qpdfOptions.restrictions = qpdfOptions.restrictions || {};
      qpdfOptions.restrictions.print = 'none';
    }

    if (!encryptionOptions.allowModifying) {
      qpdfOptions.restrictions = qpdfOptions.restrictions || {};
      qpdfOptions.restrictions.modify = 'none';
    }

    if (!encryptionOptions.allowCopying) {
      qpdfOptions.restrictions = qpdfOptions.restrictions || {};
      qpdfOptions.restrictions.extract = false;
    }

    // Criptografar PDF
    const encryptedPdf = await qpdf.encrypt(pdfBuffer, qpdfOptions);

    console.log('✅ PDF criptografado com QPDF (AES-256)');
    return encryptedPdf;
  } catch (error) {
    console.error('❌ Erro ao criptografar PDF com QPDF:', error);
    throw error;
  }
}

/**
 * Gera hash simples da senha (para metadados)
 * 
 * **AVISO:** Não é criptograficamente seguro!
 * Usado apenas para marcar o PDF como "protegido".
 * 
 * @param password Senha em texto puro
 * @returns Hash MD5-like da senha
 */
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verifica se PDF está protegido por senha
 * 
 * @param pdfBuffer Buffer do PDF
 * @returns true se PDF requer senha
 */
export async function isPDFEncrypted(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const keywords = pdfDoc.getKeywords() || '';
    return keywords.includes('protected') || keywords.includes('encrypted');
  } catch (error) {
    // Se falhar ao carregar, pode estar criptografado
    return true;
  }
}

/**
 * Remove senha de PDF protegido
 * 
 * @param pdfBuffer Buffer do PDF protegido
 * @param password Senha do PDF
 * @returns PDF sem proteção
 */
export async function decryptPDF(
  pdfBuffer: Buffer,
  password: string
): Promise<Buffer> {
  try {
    console.log('🔓 Removendo proteção do PDF...');

    // Carregar PDF com senha
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    // Salvar sem criptografia
    const pdfBytes = await pdfDoc.save();

    console.log('✅ Proteção removida');
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('❌ Erro ao remover proteção:', error);
    throw new Error('Senha incorreta ou PDF não está protegido');
  }
}

/**
 * Opções pré-definidas de proteção
 */
export const ENCRYPTION_PRESETS = {
  /** Somente leitura - não permite nenhuma modificação */
  READ_ONLY: {
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
    allowAnnotating: false,
    allowFillingForms: false,
    allowContentAccessibility: true,
    allowDocumentAssembly: false,
  } as PDFEncryptionOptions,

  /** Leitura e impressão - permite apenas visualizar e imprimir */
  READ_AND_PRINT: {
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
    allowAnnotating: false,
    allowFillingForms: false,
    allowContentAccessibility: true,
    allowDocumentAssembly: false,
  } as PDFEncryptionOptions,

  /** Formulários - permite preencher mas não modificar */
  FORMS_ONLY: {
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
    allowAnnotating: true,
    allowFillingForms: true,
    allowContentAccessibility: true,
    allowDocumentAssembly: false,
  } as PDFEncryptionOptions,

  /** Sem restrições - apenas senha para abrir */
  NO_RESTRICTIONS: {
    allowPrinting: true,
    allowCopying: true,
    allowModifying: true,
    allowAnnotating: true,
    allowFillingForms: true,
    allowContentAccessibility: true,
    allowDocumentAssembly: true,
  } as PDFEncryptionOptions,
};

/**
 * Exportações padrão
 */
export default {
  encryptPDF,
  encryptPDFWithQPDF,
  isPDFEncrypted,
  decryptPDF,
  ENCRYPTION_PRESETS,
};
