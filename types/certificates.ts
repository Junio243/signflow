// ============================================
// Types para Sistema de Certificados com Perfis
// ============================================

/**
 * Tipos de perfis suportados
 */
export type ProfileType = 
  | 'professional'         // Médico, Advogado, Engenheiro, etc.
  | 'personal'             // Pessoa Física genérica
  | 'student'              // Estudante
  | 'legal_representative' // Representante Legal
  | 'corporate'            // Pessoa Jurídica

/**
 * Método de geração do certificado
 */
export type GenerationMethod = 'uploaded' | 'auto_generated'

/**
 * Força da chave RSA
 */
export type KeyStrength = 2048 | 4096

/**
 * Tipo de certificado
 */
export type CertificateType = 'auto' | 'icp-brasil' | 'custom'

/**
 * Perfil de Certificado
 */
export interface CertificateProfile {
  id: string
  user_id: string
  
  // Identificação
  profile_name: string           // Ex: "Dr. João Silva - CRM 12345"
  profile_type: ProfileType
  
  // Dados do titular
  cpf_cnpj?: string | null
  organization?: string | null   // Ex: "Hospital São Lucas"
  registration_number?: string | null  // Ex: CRM, OAB, CREA
  
  // Configurações
  is_default: boolean
  is_active: boolean
  
  // Metadados adicionais (flexível)
  metadata?: Record<string, any>
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Dados do titular do certificado (subject)
 */
export interface CertificateSubjectData {
  commonName: string        // Nome completo
  emailAddress?: string
  organizationName?: string // Nome da organização
  organizationalUnit?: string // Departamento/Setor
  locality?: string         // Cidade
  state?: string            // Estado
  country?: string          // País (ex: "BR")
  
  // Campos customizados
  cpf?: string
  cnpj?: string
  registrationNumber?: string  // CRM, OAB, etc.
  profession?: string
}

/**
 * Certificado Digital
 */
export interface Certificate {
  id: string
  user_id: string
  profile_id?: string | null
  
  // Identificação
  certificate_name: string
  certificate_type: CertificateType
  generation_method: GenerationMethod
  
  // Segurança
  key_strength: KeyStrength
  issuer: string                // Ex: "SignFlow CA", "ICP-Brasil"
  
  // Arquivos
  certificate_path: string      // Caminho no Supabase Storage
  encrypted_password: string    // Senha criptografada (AES-256)
  
  // Metadados do titular
  subject_data: CertificateSubjectData
  
  // Status
  is_active: boolean
  expires_at?: string | null
  
  // Timestamps
  created_at: string
  updated_at?: string
}

/**
 * Payload para criar um perfil
 */
export interface CreateProfilePayload {
  profile_name: string
  profile_type: ProfileType
  cpf_cnpj?: string
  organization?: string
  registration_number?: string
  is_default?: boolean
  metadata?: Record<string, any>
}

/**
 * Payload para gerar um certificado auto-assinado
 */
export interface GenerateCertificatePayload {
  profile_id: string
  certificate_name: string
  password: string              // Senha para proteger a chave privada
  key_strength: KeyStrength
  validity_years: number        // 1, 2, 5 anos
  
  // Dados do titular (opcional, pode puxar do perfil)
  subject_data?: Partial<CertificateSubjectData>
}

/**
 * Payload para fazer upload de certificado existente
 */
export interface UploadCertificatePayload {
  profile_id?: string
  certificate_name: string
  password: string
  certificate_type: CertificateType
  file: File
}

/**
 * Opções de perfil pré-definidas (para UI)
 */
export const PROFILE_TYPE_OPTIONS: Array<{
  value: ProfileType
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'professional',
    label: 'Profissional',
    description: 'Médico, Advogado, Engenheiro, etc.',
    icon: '👨‍⚕️',
  },
  {
    value: 'personal',
    label: 'Pessoa Física',
    description: 'Uso pessoal genérico',
    icon: '👤',
  },
  {
    value: 'student',
    label: 'Estudante',
    description: 'Estudante universitário ou de cursos',
    icon: '🎓',
  },
  {
    value: 'legal_representative',
    label: 'Representante Legal',
    description: 'Procurador, tutor, curador',
    icon: '⚖️',
  },
  {
    value: 'corporate',
    label: 'Pessoa Juríidica',
    description: 'Empresa, organização',
    icon: '🏢',
  },
]

/**
 * Opções de validade (em anos)
 */
export const VALIDITY_OPTIONS = [
  { value: 1, label: '1 ano' },
  { value: 2, label: '2 anos' },
  { value: 3, label: '3 anos' },
  { value: 5, label: '5 anos' },
  { value: 10, label: '10 anos' },
]

/**
 * Opções de força da chave
 */
export const KEY_STRENGTH_OPTIONS: Array<{
  value: KeyStrength
  label: string
  description: string
}> = [
  {
    value: 2048,
    label: '2048 bits',
    description: 'Padrão (rápido, seguro)',
  },
  {
    value: 4096,
    label: '4096 bits',
    description: 'Alta segurança (mais lento)',
  },
]
