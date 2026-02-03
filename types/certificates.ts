// ========================================
// TIPOS DE CERTIFICADOS E PERFIS
// ========================================

export type CertificateType = 'auto' | 'icp-brasil' | 'custom'
export type GenerationMethod = 'uploaded' | 'auto_generated'
export type ProfileType = 'professional' | 'personal' | 'student' | 'legal_representative' | 'corporate'
export type KeyStrength = 2048 | 4096

// ========================================
// PERFIL DE CERTIFICADO
// ========================================

export interface CertificateProfile {
  id: string
  user_id: string
  profile_name: string
  profile_type: ProfileType
  cpf_cnpj?: string | null
  organization?: string | null
  registration_number?: string | null
  is_default: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateProfilePayload {
  profile_name: string
  profile_type: ProfileType
  cpf_cnpj?: string
  organization?: string
  registration_number?: string
  is_default?: boolean
  metadata?: Record<string, any>
}

// ========================================
// CERTIFICADO
// ========================================

export interface Certificate {
  id: string
  user_id: string
  profile_id?: string | null
  certificate_name: string
  certificate_type: CertificateType
  generation_method: GenerationMethod
  key_strength?: number | null
  issuer?: string | null
  certificate_path: string
  encrypted_password: string
  is_active: boolean
  expires_at?: string | null
  subject_data?: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface GenerateCertificatePayload {
  profile_id: string
  certificate_name: string
  password: string
  key_strength?: KeyStrength
  validity_years?: number
  subject_data?: {
    commonName?: string
    organizationName?: string
    emailAddress?: string
    locality?: string
    state?: string
    country?: string
  }
}

// ========================================
// OPÇÕES DE FORMULÁRIOS
// ========================================

export const PROFILE_TYPE_OPTIONS = [
  { value: 'personal' as ProfileType, label: 'Pessoal', icon: '👤' },
  { value: 'professional' as ProfileType, label: 'Profissional', icon: '💼' },
  { value: 'student' as ProfileType, label: 'Estudante', icon: '🎓' },
  { value: 'legal_representative' as ProfileType, label: 'Rep. Legal', icon: '⚖️' },
  { value: 'corporate' as ProfileType, label: 'Corporativo', icon: '🏢' },
]

export const KEY_STRENGTH_OPTIONS = [
  { value: 2048 as KeyStrength, label: '2048 bits', description: 'Padrão (Rápido)' },
  { value: 4096 as KeyStrength, label: '4096 bits', description: 'Mais Seguro (Lento)' },
]

export const VALIDITY_OPTIONS = [
  { value: 1, label: '1 ano' },
  { value: 2, label: '2 anos' },
  { value: 3, label: '3 anos' },
  { value: 5, label: '5 anos' },
  { value: 10, label: '10 anos' },
]
