// lib/utils/validation.ts
import { z } from 'zod';

/**
 * Common validation schemas and utilities
 */

export const uuidSchema = z.string().uuid({
  message: 'ID deve ser um UUID válido',
});

export const emailSchema = z.string().email({
  message: 'Email inválido',
});

export const urlSchema = z.string().url({
  message: 'URL inválida',
});

/**
 * Validate UUID string
 * Returns UUID if valid, null otherwise
 */
export function validateUuid(value: unknown): string | null {
  const result = uuidSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Validate email string
 * Returns email if valid, null otherwise
 */
export function validateEmail(value: unknown): string | null {
  const result = emailSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Safe parse with default value
 */
export function parseWithDefault<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  defaultValue: T
): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : defaultValue;
}

/**
 * Validate and sanitize string input
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}
