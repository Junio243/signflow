// types/certificate.ts

/**
 * Tipos de certificados suportados
 */
export type CertificateType = 'e-CPF' | 'e-CNPJ';

/**
 * Status do certificado
 */
export type CertificateStatus = 'active' | 'revoked' | 'expired';

/**
 * Algoritmos de criptografia suportados
 */
export type CertificateAlgorithm = 'RSA-2048' | 'RSA-4096';

/**
 * Período de validade do certificado
 */
export type CertificateValidity = '1year' | '3years' | '5years';

/**
 * Formato de exportação do certificado
 */
export type CertificateFormat = 'PKCS12' | 'PEM' | 'DER';

/**
 * Endereço completo
 */
export interface Address {
  cep: string;
  street: string; // logradouro
  number: string;
  complement?: string;
  neighborhood: string; // bairro
  city: string;
  state: string; // UF
}

/**
 * Dados do titular - Pessoa Física (e-CPF)
 */
export interface PersonalData {
  fullName: string;
  cpf: string;
  rg?: string;
  birthDate: string; // ISO 8601: YYYY-MM-DD
  email: string;
  phone: string;
  mobile?: string;
  address: Address;
  
  // Dados profissionais (opcional)
  profession?: string;
  professionalRegistry?: string; // OAB, CRM, CRC, etc
  council?: string; // OAB-SP, CREMESP, etc
}

/**
 * Dados do representante legal
 */
export interface LegalRepresentative {
  fullName: string;
  cpf: string;
  role: string; // Diretor, Sócio, Gerente, etc
  email: string;
}

/**
 * Dados do titular - Pessoa Jurídica (e-CNPJ)
 */
export interface CompanyData {
  companyName: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  cnpj: string;
  stateRegistration?: string; // Inscrição Estadual
  municipalRegistration?: string; // Inscrição Municipal
  
  legalRepresentative: LegalRepresentative;
  
  address: Address;
  businessPhone: string;
  businessEmail: string;
}

/**
 * Dados do titular (union type)
 */
export type SubjectData = PersonalData | CompanyData;

/**
 * Certificado digital completo
 */
export interface Certificate {
  id: string;
  user_id: string;
  
  // Identificação
  certificate_type: CertificateType;
  serial_number: string;
  
  // Dados do titular
  subject_data: SubjectData;
  
  // Dados técnicos
  public_key: string;
  certificate_pem: string;
  fingerprint_sha256: string;
  
  // Validade
  valid_from: string; // ISO 8601
  valid_until: string; // ISO 8601
  
  // Status
  status: CertificateStatus;
  revoked_at?: string;
  revocation_reason?: string;
  
  // Metadados
  algorithm: CertificateAlgorithm;
  issuer: string;
  key_usage: string;
  extended_key_usage: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Resumo do certificado (para listagem)
 */
export interface CertificateSummary {
  id: string;
  certificate_type: CertificateType;
  serial_number: string;
  subject_name: string;
  subject_document: string; // CPF/CNPJ mascarado
  valid_from: string;
  valid_until: string;
  status: CertificateStatus;
  days_until_expiry: number;
  created_at: string;
}

/**
 * Formulário para geração de certificado e-CPF
 */
export interface ECPFFormData extends PersonalData {
  // Configurações do certificado
  validity: CertificateValidity;
  algorithm: CertificateAlgorithm;
  password: string;
  confirmPassword: string;
}

/**
 * Formulário para geração de certificado e-CNPJ
 */
export interface ECNPJFormData extends CompanyData {
  // Configurações do certificado
  validity: CertificateValidity;
  algorithm: CertificateAlgorithm;
  password: string;
  confirmPassword: string;
}

/**
 * Union type para formulário
 */
export type CertificateFormData = ECPFFormData | ECNPJFormData;

/**
 * Opções para geração de certificado
 */
export interface CertificateGenerationOptions {
  type: CertificateType;
  subjectData: SubjectData;
  validity: CertificateValidity;
  algorithm: CertificateAlgorithm;
  password: string;
}

/**
 * Resultado da geração de certificado
 */
export interface CertificateGenerationResult {
  certificate: Certificate;
  pkcs12: Blob; // Arquivo .p12 para download
  downloadUrl: string;
}

/**
 * Configurações para assinatura avançada com certificado
 */
export interface AdvancedSignatureConfig {
  certificateId: string;
  certificatePassword: string;
  
  // Configurações visuais
  signaturePosition?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // QR Code
  includeQRCode: boolean;
  qrCodePosition?: {
    page: number;
    x: number;
    y: number;
    size: number;
  };
  
  // Proteção do PDF
  protectPDF: boolean;
  pdfPassword?: string;
  
  // Outras opções
  includeTimestamp: boolean;
  reason?: string;
  location?: string;
}

/**
 * Erros de validação
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Helper type guards
 */
export function isPersonalData(data: SubjectData): data is PersonalData {
  return 'cpf' in data && 'fullName' in data;
}

export function isCompanyData(data: SubjectData): data is CompanyData {
  return 'cnpj' in data && 'companyName' in data;
}

export function isECPFFormData(data: CertificateFormData): data is ECPFFormData {
  return 'cpf' in data;
}

export function isECNPJFormData(data: CertificateFormData): data is ECNPJFormData {
  return 'cnpj' in data;
}

/**
 * Constantes
 */
export const CERTIFICATE_VALIDITY_DAYS: Record<CertificateValidity, number> = {
  '1year': 365,
  '3years': 1095,
  '5years': 1825,
};

export const CERTIFICATE_VALIDITY_LABELS: Record<CertificateValidity, string> = {
  '1year': '1 ano',
  '3years': '3 anos',
  '5years': '5 anos',
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  'e-CPF': 'e-CPF (Pessoa Física)',
  'e-CNPJ': 'e-CNPJ (Pessoa Jurídica)',
};

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatus, string> = {
  'active': 'Ativo',
  'revoked': 'Revogado',
  'expired': 'Expirado',
};

export const CERTIFICATE_STATUS_COLORS: Record<CertificateStatus, string> = {
  'active': '#10b981', // green
  'revoked': '#ef4444', // red
  'expired': '#6b7280', // gray
};

/**
 * Regex patterns para validação
 */
export const VALIDATION_PATTERNS = {
  cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  cnpj: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
  cep: /^\d{5}-?\d{3}$/,
  phone: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  serialNumber: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
};
