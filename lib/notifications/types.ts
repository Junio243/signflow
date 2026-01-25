// ============================================
// NOTIFICATION SYSTEM - TYPE DEFINITIONS
// ============================================

export type NotificationType = 
  | 'document_ready'           // Documento pronto para assinar
  | 'signature_received'       // Assinatura recebida
  | 'document_expiring'        // Documento expirando em breve
  | 'document_expired'         // Documento expirado
  | 'document_cancelled'       // Documento cancelado
  | 'signature_request'        // Solicitação de assinatura
  | 'validation_viewed'        // Alguém visualizou validação
  | 'system_update'            // Atualização do sistema
  | 'welcome'                  // Boas-vindas
  | 'reminder'                 // Lembrete genérico

export type NotificationChannel = 'email' | 'in_app' | 'push' | 'sms'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface NotificationPayload {
  type: NotificationType
  user_id: string
  title: string
  message: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  metadata?: Record<string, any>
  action_url?: string
  action_label?: string
  expires_at?: Date
}

export interface Notification extends NotificationPayload {
  id: string
  created_at: Date
  read_at: Date | null
  clicked_at: Date | null
}

export interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  
  // Preferências por tipo
  document_ready: boolean
  signature_received: boolean
  document_expiring: boolean
  document_expired: boolean
  signature_request: boolean
  validation_viewed: boolean
  system_update: boolean
  
  // Configurações avançadas
  quiet_hours_start?: string  // "22:00"
  quiet_hours_end?: string    // "08:00"
  digest_enabled?: boolean    // Agrupar notificações
  digest_frequency?: 'daily' | 'weekly'
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface NotificationStats {
  total_sent: number
  total_delivered: number
  total_read: number
  total_clicked: number
  delivery_rate: number
  open_rate: number
  click_rate: number
}
