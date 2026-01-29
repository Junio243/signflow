/**
 * Validation and sanitization utilities
 */

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid();

export function validateUuid(value: unknown): string | null {
  const result = uuidSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function isValidUuid(value: unknown): boolean {
  return uuidSchema.safeParse(value).success;
}

// Email validation
export const emailSchema = z.string().email();

export function validateEmail(value: unknown): string | null {
  const result = emailSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function isValidEmail(value: unknown): boolean {
  return emailSchema.safeParse(value).success;
}

// CPF validation (Brazilian tax ID)
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check length
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// URL validation
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Sanitize string input
export function sanitizeString(input: string, maxLength = 255): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS vectors
}

// Sanitize HTML
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Parse JSON safely
export function parseJsonSafe<T = unknown>(json: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
}
