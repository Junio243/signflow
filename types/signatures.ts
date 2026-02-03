// ==================================================
// TIPOS PARA SISTEMA DE ASSINATURA
// ==================================================

/**
 * Tipo de assinatura
 */
export type SignatureType = 'visual' | 'digital' | 'both'

/**
 * Status da assinatura
 */
export type SignatureStatus = 'completed' | 'failed' | 'processing'

/**
 * Posição da assinatura visual no PDF
 */
export interface SignaturePosition {
  page: number        // Número da página (1-based)
  x: number          // Posição X (pixels ou coordenadas PDF)
  y: number          // Posição Y
  width: number      // Largura da assinatura
  height: number     // Altura da assinatura
}

/**
 * Dados da assinatura (metadados)
 */
export interface SignatureData {
  signerName: string
  signerEmail?: string
  certificateSubject: string
  certificateIssuer: string
  certificateSerialNumber: string
  signatureAlgorithm: string
  timestamp: string
  reason?: string
  location?: string
}

/**
 * Registro de assinatura no banco
 */
export interface Signature {
  id: string
  user_id: string
  certificate_id: string
  
  // Documento original
  original_document_name: string
  original_document_path: string
  original_document_size?: number
  
  // Documento assinado
  signed_document_path: string
  signed_document_size?: number
  
  // Hash
  document_hash: string
  signature_hash: string
  
  // Tipo e posição
  signature_type: SignatureType
  signature_position?: SignaturePosition
  
  // Dados
  signature_data: SignatureData
  
  // Status
  status: SignatureStatus
  
  // Timestamps
  signed_at: string
  created_at: string
  updated_at: string
  
  metadata?: Record<string, any>
}

/**
 * Payload para criar assinatura
 */
export interface CreateSignaturePayload {
  certificate_id: string
  certificate_password: string
  
  // Arquivo PDF (base64 ou FormData)
  document_file?: File
  document_base64?: string
  document_name: string
  
  // Tipo de assinatura
  signature_type: SignatureType
  
  // Posição (obrigatório se visual ou both)
  signature_position?: SignaturePosition
  
  // Texto da assinatura visual
  signature_text?: string
  
  // Razão e localização (opcional)
  reason?: string
  location?: string
}

/**
 * Resposta da API de validar certificado
 */
export interface ValidateCertificateResponse {
  success: boolean
  valid: boolean
  certificate?: {
    commonName: string
    organization: string
    issuer: string
    serialNumber: string
    validFrom: string
    validTo: string
  }
  error?: string
}

/**
 * Resposta da API de processar assinatura
 */
export interface ProcessSignatureResponse {
  success: boolean
  signature?: Signature
  signed_document_url?: string
  error?: string
}

/**
 * Opções de visualização de assinatura
 */
export interface SignatureAppearance {
  showName: boolean
  showDate: boolean
  showReason: boolean
  showLogo: boolean
  fontSize: number
  fontColor: string
  backgroundColor: string
}
