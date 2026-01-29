import { logger } from './logger';

// Configurações de validação
export const FILE_VALIDATION = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf'],
  PDF_MAGIC_BYTES: [0x25, 0x50, 0x44, 0x46], // %PDF
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida um arquivo enviado
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Validar se arquivo existe
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo foi enviado.' };
  }

  // Validar tamanho
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    const maxSizeMB = FILE_VALIDATION.MAX_SIZE / (1024 * 1024);
    return { 
      valid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` 
    };
  }

  // Validar se arquivo não está vazio
  if (file.size === 0) {
    return { valid: false, error: 'Arquivo está vazio.' };
  }

  // Validar tipo MIME
  if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não permitido. Apenas arquivos PDF são aceitos.' 
    };
  }

  // Validar extensão
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: 'Extensão de arquivo inválida. Apenas .pdf é permitido.' 
    };
  }

  // Validar magic bytes (primeiros bytes do arquivo)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Verificar se tem bytes suficientes
    if (bytes.length < 4) {
      return { valid: false, error: 'Arquivo corrompido ou inválido.' };
    }

    // Verificar magic bytes do PDF
    const isPdf = FILE_VALIDATION.PDF_MAGIC_BYTES.every(
      (byte, index) => bytes[index] === byte
    );

    if (!isPdf) {
      logger.warn('File validation failed: Invalid PDF magic bytes', {
        fileName: file.name,
        firstBytes: Array.from(bytes.slice(0, 4)),
      });
      return { 
        valid: false, 
        error: 'Arquivo não é um PDF válido ou está corrompido.' 
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('File validation error', error, { fileName: file.name });
    return { 
      valid: false, 
      error: 'Erro ao validar arquivo. Tente novamente.' 
    };
  }
}

/**
 * Valida nome de arquivo para evitar path traversal
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove caracteres especiais perigosos
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limitar tamanho do nome
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    sanitized = sanitized.slice(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
}
