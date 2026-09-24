import { describe, it, expect } from 'vitest';
import { detectTypeFromBuffer } from '@/lib/fileValidation';

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const unknownBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

describe('fileValidation (magic bytes)', () => {
  it('detecta PDF (%PDF-)', () => {
    expect(detectTypeFromBuffer(pdfBytes, ['pdf', 'png', 'jpeg'])).toBe('pdf');
  });

  it('detecta PNG', () => {
    expect(detectTypeFromBuffer(pngBytes, ['png', 'jpeg'])).toBe('png');
  });

  it('detecta JPEG', () => {
    expect(detectTypeFromBuffer(jpegBytes, ['png', 'jpeg'])).toBe('jpeg');
  });

  it('detecta GIF e WebP', () => {
    expect(detectTypeFromBuffer(gifBytes, ['gif', 'pdf'])).toBe('gif');
    expect(detectTypeFromBuffer(webpBytes, ['webp', 'pdf'])).toBe('webp');
  });

  it('retorna null para bytes desconhecidos', () => {
    expect(detectTypeFromBuffer(unknownBytes, ['pdf', 'png', 'jpeg'])).toBeNull();
  });

  it('respeita allowedTypes (não detecta fora da lista)', () => {
    expect(detectTypeFromBuffer(pdfBytes, ['png', 'jpeg'])).toBeNull();
  });

  it('rejeita PNG renomeado como PDF (anti-spoof)', () => {
    // mesmo que o cliente diga application/pdf, os bytes mandam
    expect(detectTypeFromBuffer(pngBytes, ['pdf'])).toBeNull();
  });
});
