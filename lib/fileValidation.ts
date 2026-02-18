/**
 * Validação de Arquivos por Magic Bytes — SignFlow
 *
 * Verifica o tipo real de um arquivo inspecionando seus primeiros bytes
 * ("magic bytes" / "file signature"), independente do MIME type informado
 * pelo cliente — que pode ser facilmente falsificado.
 *
 * Tipos suportados:
 * - PDF  (%PDF-)
 * - PNG  (\x89PNG\r\n\x1a\n)
 * - JPEG (\xFF\xD8\xFF)
 * - GIF  (GIF87a / GIF89a)
 * - WebP (RIFF....WEBP)
 *
 * @module lib/fileValidation
 */

export type AllowedFileType = 'pdf' | 'png' | 'jpeg' | 'gif' | 'webp';

export interface FileValidationResult {
  valid: boolean;
  detectedType: AllowedFileType | null;
  error?: string;
}

/** Assinaturas de bytes por tipo de arquivo */
const MAGIC_BYTES: Record<AllowedFileType, { offset: number; bytes: number[] }[]> = {
  pdf: [
    // %PDF-
    { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  ],
  png: [
    // \x89PNG\r\n\x1a\n
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  jpeg: [
    // FF D8 FF E0 (JFIF)
    { offset: 0, bytes: [0xff, 0xd8, 0xff, 0xe0] },
    // FF D8 FF E1 (EXIF)
    { offset: 0, bytes: [0xff, 0xd8, 0xff, 0xe1] },
    // FF D8 FF E2
    { offset: 0, bytes: [0xff, 0xd8, 0xff, 0xe2] },
    // FF D8 FF DB
    { offset: 0, bytes: [0xff, 0xd8, 0xff, 0xdb] },
    // FF D8 FF EE
    { offset: 0, bytes: [0xff, 0xd8, 0xff, 0xee] },
  ],
  gif: [
    // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
    // GIF89a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  ],
  webp: [
    // RIFF....WEBP — verifica bytes 0-3 (RIFF) e 8-11 (WEBP)
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
  ],
};

/** Lê os primeiros N bytes de um File/Blob */
async function readMagicBytes(file: File | Blob, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Verifica se os bytes do arquivo batem com a assinatura esperada */
function matchesMagicBytes(
  fileBytes: Uint8Array,
  signature: { offset: number; bytes: number[] }
): boolean {
  const { offset, bytes } = signature;
  if (fileBytes.length < offset + bytes.length) return false;
  return bytes.every((b, i) => fileBytes[offset + i] === b);
}

/**
 * Detecta o tipo real de um arquivo pelos seus magic bytes.
 *
 * @param file Arquivo a ser verificado
 * @returns Tipo detectado ou null se não reconhecido
 */
export async function detectFileType(
  file: File | Blob
): Promise<AllowedFileType | null> {
  const bytes = await readMagicBytes(file, 16);

  for (const [type, signatures] of Object.entries(MAGIC_BYTES) as [AllowedFileType, typeof MAGIC_BYTES[AllowedFileType]][]) {
    for (const sig of signatures) {
      if (matchesMagicBytes(bytes, sig)) {
        // Caso especial: WebP precisa checar também bytes 8-11 = 'WEBP'
        if (type === 'webp') {
          if (
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50
          ) {
            return 'webp';
          }
          continue;
        }
        return type;
      }
    }
  }

  return null;
}

/**
 * Valida se um arquivo é realmente um PDF.
 *
 * Verifica tanto o MIME type declarado quanto os magic bytes reais.
 * Um arquivo só passa se AMBOS baterem.
 *
 * @param file Arquivo a validar
 * @returns Resultado da validação
 */
export async function validatePDF(file: File): Promise<FileValidationResult> {
  // 1. Verificar tamanho mínimo
  if (file.size < 5) {
    return { valid: false, detectedType: null, error: 'Arquivo muito pequeno para ser um PDF válido.' };
  }

  // 2. Verificar MIME type declarado
  const declaredMime = file.type?.toLowerCase();
  if (declaredMime && declaredMime !== 'application/pdf') {
    return {
      valid: false,
      detectedType: null,
      error: `Tipo de arquivo inválido: "${declaredMime}". Envie um arquivo PDF (application/pdf).`,
    };
  }

  // 3. Verificar magic bytes reais
  const detectedType = await detectFileType(file);
  if (detectedType !== 'pdf') {
    return {
      valid: false,
      detectedType,
      error:
        detectedType
          ? `O arquivo parece ser ${detectedType.toUpperCase()}, não um PDF. Envie um arquivo PDF válido.`
          : 'O conteúdo do arquivo não corresponde a um PDF válido. O arquivo pode estar corrompido ou ter sido renomeado.',
    };
  }

  return { valid: true, detectedType: 'pdf' };
}

/**
 * Valida se um arquivo é realmente uma imagem (PNG, JPEG, GIF ou WebP).
 *
 * @param file Arquivo a validar
 * @param allowedTypes Tipos de imagem permitidos (padrão: png, jpeg)
 * @returns Resultado da validação
 */
export async function validateImage(
  file: File,
  allowedTypes: AllowedFileType[] = ['png', 'jpeg']
): Promise<FileValidationResult> {
  if (file.size < 4) {
    return { valid: false, detectedType: null, error: 'Arquivo muito pequeno para ser uma imagem válida.' };
  }

  const detectedType = await detectFileType(file);

  if (!detectedType || !allowedTypes.includes(detectedType)) {
    const allowed = allowedTypes.map((t) => t.toUpperCase()).join(', ');
    return {
      valid: false,
      detectedType,
      error: detectedType
        ? `Tipo de imagem não permitido: ${detectedType.toUpperCase()}. Use: ${allowed}.`
        : `Arquivo inválido. Use uma imagem ${allowed}.`,
    };
  }

  return { valid: true, detectedType };
}

/**
 * Versão para uso em API Routes (recebe ArrayBuffer em vez de File).
 * Útil quando o arquivo já foi lido como buffer.
 *
 * @param buffer Buffer do arquivo
 * @param allowedTypes Tipos permitidos
 */
export function detectTypeFromBuffer(
  buffer: Uint8Array,
  allowedTypes: AllowedFileType[]
): AllowedFileType | null {
  for (const [type, signatures] of Object.entries(MAGIC_BYTES) as [AllowedFileType, typeof MAGIC_BYTES[AllowedFileType]][]) {
    if (!allowedTypes.includes(type)) continue;
    for (const sig of signatures) {
      if (matchesMagicBytes(buffer, sig)) {
        if (type === 'webp') {
          if (
            buffer[8] === 0x57 &&
            buffer[9] === 0x45 &&
            buffer[10] === 0x42 &&
            buffer[11] === 0x50
          ) return 'webp';
          continue;
        }
        return type;
      }
    }
  }
  return null;
}
