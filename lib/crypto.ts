/**
 * Módulo Central de Criptografia do SignFlow
 *
 * Implementa criptografia simétrica AES-256-GCM usando a Web Crypto API
 * nativa do Node.js (disponível no Vercel/Edge sem pacotes externos).
 *
 * Características:
 * - AES-256-GCM: criptografia autenticada (confidencialidade + integridade)
 * - IV aleatório por operação (nunca reutilizado)
 * - PBKDF2 para derivação de chave a partir de senha
 * - Sem dependências externas
 *
 * @module lib/crypto
 */

// Algoritmos
const AES_ALGORITHM = 'AES-GCM';
const KEY_DERIVATION_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommendation
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits — recomendado para GCM
const SALT_LENGTH = 16; // 128 bits
const TAG_LENGTH = 128; // bits

// ──────────────────────────────────────────────
// Helpers de encoding
// ──────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}

function base64ToBuffer(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

// ──────────────────────────────────────────────
// Derivação de chave (senha → CryptoKey)
// ──────────────────────────────────────────────

/**
 * Deriva uma CryptoKey AES-256 a partir de uma senha e salt.
 * Usa PBKDF2 com SHA-256 e 310.000 iterações.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = globalThis.crypto;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: KEY_DERIVATION_ALGORITHM },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ──────────────────────────────────────────────
// Criptografia com senha (password-based)
// ──────────────────────────────────────────────

/**
 * Criptografa uma string usando AES-256-GCM derivado de senha.
 *
 * Formato de saída (base64):
 *   [16 bytes salt][12 bytes IV][ciphertext+tag]
 *
 * @param plaintext Texto a ser criptografado
 * @param password  Senha de criptografia
 * @returns String base64 com salt + IV + ciphertext
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<string> {
  const crypto = globalThis.crypto;

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Concatenar: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return bufferToBase64(combined.buffer);
}

/**
 * Descriptografa uma string cifrada com `encryptWithPassword`.
 *
 * @param encryptedBase64 Dados criptografados (base64)
 * @param password        Senha de criptografia
 * @returns Texto descriptografado
 */
export async function decryptWithPassword(
  encryptedBase64: string,
  password: string
): Promise<string> {
  const crypto = globalThis.crypto;

  const combined = base64ToBuffer(encryptedBase64);

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ──────────────────────────────────────────────
// Criptografia com chave aleatória (chave bruta)
// ──────────────────────────────────────────────

export interface EncryptedData {
  /** Ciphertext + GCM tag em base64 */
  ciphertext: string;
  /** IV em base64 (96 bits) */
  iv: string;
  /** Chave AES-256 em base64 (guardar com segurança!) */
  key: string;
}

/**
 * Criptografa dados binários ou texto com uma chave AES-256 gerada automaticamente.
 * Útil para criptografar arquivos/PDFs sem depender de senha do usuário.
 *
 * @param data Buffer ou string a ser criptografado
 * @returns Objeto com ciphertext, IV e chave (todos em base64)
 */
export async function encryptData(data: Uint8Array | string): Promise<EncryptedData> {
  const crypto = globalThis.crypto;

  const rawData =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;

  // Gerar chave aleatória
  const key = await crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true, // exportável
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    rawData
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
    key: bufferToBase64(exportedKey),
  };
}

/**
 * Descriptografa dados cifrados com `encryptData`.
 *
 * @param encrypted Objeto com ciphertext, iv e key (em base64)
 * @returns Buffer descriptografado
 */
export async function decryptData(encrypted: EncryptedData): Promise<Uint8Array> {
  const crypto = globalThis.crypto;

  const rawKey = base64ToBuffer(encrypted.key);
  const iv = base64ToBuffer(encrypted.iv);
  const ciphertext = base64ToBuffer(encrypted.ciphertext);

  const key = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: AES_ALGORITHM },
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );

  return new Uint8Array(plaintext);
}

// ──────────────────────────────────────────────
// Hash seguro (SHA-256)
// ──────────────────────────────────────────────

/**
 * Gera hash SHA-256 de uma string.
 *
 * @param data Dados a fazer hash
 * @returns Hash hexadecimal
 */
export async function sha256(data: string): Promise<string> {
  const crypto = globalThis.crypto;
  const hash = await crypto.subtle.digest(
    HASH_ALGORITHM,
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ──────────────────────────────────────────────
// Proteção de chaves privadas (para certificateManager)
// ──────────────────────────────────────────────

/**
 * Criptografa uma chave privada PEM para armazenamento seguro no banco.
 *
 * A chave de criptografia é derivada de `SIGNFLOW_ENCRYPTION_KEY` via PBKDF2.
 * Se a variável não estiver configurada, lança erro em produção.
 *
 * @param privateKeyPem Chave privada em formato PEM
 * @returns Chave privada criptografada (base64)
 */
export async function encryptPrivateKey(privateKeyPem: string): Promise<string> {
  const password = getEncryptionPassword();
  return encryptWithPassword(privateKeyPem, password);
}

/**
 * Descriptografa uma chave privada armazenada com `encryptPrivateKey`.
 *
 * @param encryptedPem Chave privada criptografada (base64)
 * @returns Chave privada em formato PEM
 */
export async function decryptPrivateKey(encryptedPem: string): Promise<string> {
  const password = getEncryptionPassword();
  return decryptWithPassword(encryptedPem, password);
}

/**
 * Verifica se um valor parece estar criptografado (base64 com tamanho mínimo).
 * Usado para migração gradual — distingue valores legados (PEM) dos novos (base64).
 */
export function isEncrypted(value: string): boolean {
  // PEM sempre começa com "-----BEGIN"
  return !value.startsWith('-----BEGIN') && value.length > 44;
}

// ──────────────────────────────────────────────
// Interno
// ──────────────────────────────────────────────

function getEncryptionPassword(): string {
  const key = process.env.SIGNFLOW_ENCRYPTION_KEY;

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SIGNFLOW_ENCRYPTION_KEY não configurada. ' +
        'Defina esta variável de ambiente no Vercel para habilitar criptografia de chaves privadas.'
      );
    }
    // Em desenvolvimento, usa fallback com aviso
    console.warn(
      '⚠️  SIGNFLOW_ENCRYPTION_KEY não configurada.\n' +
      '   Usando chave de desenvolvimento. NÃO use em produção!'
    );
    return 'signflow-dev-key-change-in-production';
  }

  return key;
}

// ──────────────────────────────────────────────
// Utilitários
// ──────────────────────────────────────────────

/**
 * Gera uma string aleatória criptograficamente segura.
 *
 * @param length Comprimento em bytes (padrão: 32)
 * @returns String hexadecimal aleatória
 */
export function generateSecureToken(length = 32): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compara duas strings em tempo constante para evitar timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default {
  encryptWithPassword,
  decryptWithPassword,
  encryptData,
  decryptData,
  encryptPrivateKey,
  decryptPrivateKey,
  isEncrypted,
  sha256,
  generateSecureToken,
  timingSafeEqual,
};
