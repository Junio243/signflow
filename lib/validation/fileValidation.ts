// lib/validation/fileValidation.ts
import { logger } from '@/lib/logger';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['application/pdf'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate uploaded file
 * Checks: existence, size, MIME type, and actual PDF content
 */
export async function validateUploadedFile(
  file: File | null | undefined
): Promise<FileValidationResult> {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'Nenhum arquivo foi enviado.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio.',
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Apenas arquivos PDF são aceitos.',
    };
  }

  // Validate actual PDF content (magic bytes)
  try {
    const isValidPdf = await isPdfFile(file);
    if (!isValidPdf) {
      return {
        valid: false,
        error: 'Arquivo corrompido ou não é um PDF válido.',
      };
    }
  } catch (error) {
    logger.error('Error validating PDF content', error);
    return {
      valid: false,
      error: 'Erro ao validar arquivo.',
    };
  }

  return {
    valid: true,
    file,
  };
}

/**
 * Check if file is a valid PDF by reading magic bytes
 * PDF files start with %PDF (0x25 0x50 0x44 0x46)
 */
export async function isPdfFile(file: File): Promise<boolean> {
  try {
    // Read first 4 bytes
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check PDF magic bytes: %PDF
    return (
      bytes.length >= 4 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46    // F
    );
  } catch (error) {
    logger.error('Error reading file bytes', error);
    return false;
  }
}

/**
 * Sanitize filename to prevent path traversal and other issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and other dangerous characters
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
}
