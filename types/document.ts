/**
 * Type definitions for document-related entities
 */

export type DocumentStatus = 'draft' | 'signed' | 'expired' | 'canceled';

export interface Document {
  id: string;
  user_id: string | null;
  original_pdf_name: string;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  signed_pdf_url: string | null;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  ip_hash: string | null;
  validation_theme_snapshot?: Record<string, unknown> | null;
  validation_profile_id?: string | null;
}

export interface DocumentMetadata {
  positions?: SignaturePosition[];
  signature_meta?: {
    width?: number;
    height?: number;
  } | null;
  signers?: SignerInfo[];
  qr_position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  qr_page?: 'first' | 'last' | 'all';
  validation_requires_code?: boolean;
  validation_access_code?: string | null;
  validation_theme_snapshot?: Record<string, unknown> | null;
  validation_profile_id?: string | null;
}

export interface SignaturePosition {
  page?: number;
  x?: number;
  y?: number;
  nx?: number;
  ny?: number;
  scale?: number;
  rotation?: number;
  page_width?: number;
  page_height?: number;
}

export interface SignerInfo {
  name: string;
  reg?: string | null;
  email?: string | null;
  certificate_type?: string | null;
  certificate_valid_until?: string | null;
  certificate_issuer?: string | null;
  logo_url?: string | null;
}

export interface SigningEvent {
  id: string;
  document_id: string;
  signer_name: string;
  signer_reg: string | null;
  signer_email: string | null;
  certificate_type: string | null;
  certificate_issuer: string | null;
  certificate_valid_until: string | null;
  logo_url: string | null;
  signed_at: string;
  metadata: Record<string, unknown> | null;
}

export interface DocumentValidation {
  isValid: boolean;
  document?: Document;
  signingEvents?: SigningEvent[];
  error?: string;
  requiresAccessCode?: boolean;
}
