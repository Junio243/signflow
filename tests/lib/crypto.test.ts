import { describe, it, expect } from 'vitest';
import {
  encryptWithPassword,
  decryptWithPassword,
  encryptData,
  decryptData,
  sha256,
  generateSecureToken,
  timingSafeEqual,
  isEncrypted,
} from '@/lib/crypto';

describe('signflow crypto (AES-256-GCM via WebCrypto)', () => {
  describe('encryptWithPassword / decryptWithPassword', () => {
    it('round-trip devolve o texto original', async () => {
      const enc = await encryptWithPassword('contrato-123', 'senha-forte');
      expect(typeof enc).toBe('string');
      expect(enc.length).toBeGreaterThan(44);
      expect(await decryptWithPassword(enc, 'senha-forte')).toBe('contrato-123');
    });

    it('senhas diferentes geram cifras diferentes', async () => {
      const a = await encryptWithPassword('mesmo-texto', 'senha-a');
      const b = await encryptWithPassword('mesmo-texto', 'senha-b');
      expect(a).not.toBe(b);
    });

    it('falha com senha errada', async () => {
      const enc = await encryptWithPassword('segredo', 'certa');
      await expect(decryptWithPassword(enc, 'errada')).rejects.toThrow();
    });
  });

  describe('encryptData / decryptData', () => {
    it('round-trip com string', async () => {
      const enc = await encryptData('pdf-bytes-aqui');
      expect(enc.ciphertext).toBeTruthy();
      expect(enc.iv).toBeTruthy();
      expect(enc.key).toBeTruthy();
      const dec = await decryptData(enc);
      expect(Buffer.from(dec).toString()).toBe('pdf-bytes-aqui');
    });

    it('round-trip com Uint8Array', async () => {
      const input = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const enc = await encryptData(input);
      const dec = await decryptData(enc);
      expect(Array.from(dec)).toEqual([0x25, 0x50, 0x44, 0x46]);
    });
  });

  describe('sha256', () => {
    it('gera hex de 64 chars e é determinístico', async () => {
      const h1 = await sha256('docvault');
      const h2 = await sha256('docvault');
      expect(h1).toHaveLength(64);
      expect(h1).toMatch(/^[a-f0-9]+$/);
      expect(h1).toBe(h2);
    });

    it('conteúdos diferentes geram hashes diferentes', async () => {
      expect(await sha256('a')).not.toBe(await sha256('b'));
    });
  });

  describe('generateSecureToken / timingSafeEqual / isEncrypted', () => {
    it('gera token hex único do tamanho esperado', () => {
      const t = generateSecureToken(32);
      expect(t).toHaveLength(64);
      expect(t).toMatch(/^[a-f0-9]+$/);
      expect(generateSecureToken()).not.toBe(generateSecureToken());
    });

    it('timingSafeEqual compara em tempo constante', () => {
      expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
      expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
      expect(timingSafeEqual('abc', 'abcdef')).toBe(false);
    });

    it('isEncrypted distingue PEM de base64', () => {
      expect(isEncrypted('-----BEGIN PRIVATE KEY-----\nabc')).toBe(false);
      expect(isEncrypted('a'.repeat(45))).toBe(true);
    });
  });
});
