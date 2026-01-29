// ============================================
// NOTIFICATION SERVICE - CORE LOGIC
// ============================================

import { createClient } from '@/lib/supabase/server'
import { emailService, EmailService } from './email-service'
import type { 
  NotificationPayload, 
  Notification, 
  NotificationPreferences,
  NotificationType 
} from './types'

export class NotificationService {
  /**
   * Envia uma notificação para um usuário
   */
  static async send(payload: NotificationPayload): Promise<{ success: boolean; notification?: Notification }> {
    try {
      const supabase = await createClient()
      
      // 1. Buscar preferências do usuário
      const preferences = await this.getUserPreferences(payload.user_id)
      
      // 2. Verificar se usuário quer receber esse tipo
      if (!this.shouldSendNotification(payload.type, preferences)) {
        console.log('[NotificationService] Usuário não quer receber', payload.type)
        return { success: true } // Não é erro, usuário optou por não receber
      }

      // 3. Determinar canais (email, in-app, etc)
      const channels = payload.channels || this.getDefaultChannels(payload.type, preferences)
      
      // 4. Salvar notificação in-app no banco
      const notification = await this.saveNotification(supabase, payload)
      
      // 5. Enviar por cada canal
      const results = await Promise.allSettled([
        channels.includes('email') && preferences.email_enabled
          ? this.sendEmail(payload)
          : Promise.resolve({ success: true }),
        
        // Futuros canais:
        // channels.includes('push') ? this.sendPush(payload) : null,
        // channels.includes('sms') ? this.sendSMS(payload) : null,
      ])

      return { success: true, notification }
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação:', error)
      return { success: false }
    }
  }

  /**
   * Envia notificações em lote
   */
  static async sendBatch(payloads: NotificationPayload[]): Promise<{ success: boolean; count: number }> {
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    )
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success)
    
    return {
      success: successful.length > 0,
      count: successful.length,
    }
  }

  /**
   * Busca notificações de um usuário
   */
  static async getUserNotifications(
    userId: string, 
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<Notification[]> {
    try {
      const supabase = await createClient()
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (options?.unreadOnly) {
        query = query.is('read_at', null)
      }
      
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('[NotificationService] Erro ao buscar notificações:', error)
      return []
    }
  }

  /**
   * Marca notificação como lida
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      return !error
    } catch (error) {
      console.error('[NotificationService] Erro ao marcar como lida:', error)
      return false
    }
  }

  /**
   * Marca todas como lidas
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)
      
      return !error
    } catch (error) {
      console.error('[NotificationService] Erro ao marcar todas como lidas:', error)
      return false
    }
  }

  /**
   * Deleta notificação
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      return !error
    } catch (error) {
      console.error('[NotificationService] Erro ao deletar:', error)
      return false
    }
  }

  /**
   * Busca preferências do usuário
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error || !data) {
        // Retornar preferências padrão
        return this.getDefaultPreferences(userId)
      }
      
      return data
    } catch (error) {
      return this.getDefaultPreferences(userId)
    }
  }

  /**
   * Atualiza preferências
   */
  static async updatePreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...preferences })
      
      return !error
    } catch (error) {
      console.error('[NotificationService] Erro ao atualizar preferências:', error)
      return false
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private static async saveNotification(
    supabase: any,
    payload: NotificationPayload
  ): Promise<Notification> {
    const notification = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      read_at: null,
      clicked_at: null,
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notification)

    if (error) {
      console.error('[NotificationService] Erro ao salvar:', error)
    }

    return notification as unknown as Notification
  }

  private static async sendEmail(payload: NotificationPayload): Promise<{ success: boolean }> {
    try {
      // Buscar email do usuário
      const supabase = await createClient()
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', payload.user_id)
        .single()

      if (!user?.email) {
        console.warn('[NotificationService] Usuário sem email')
        return { success: false }
      }

      const template = this.getEmailTemplate(payload)
      
      return await emailService.send({
        to: user.email,
        subject: template.subject,
        html: template.html,
      })
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar email:', error)
      return { success: false }
    }
  }

  private static getEmailTemplate(payload: NotificationPayload) {
    return EmailService.createEmailTemplate({
      title: payload.title,
      content: `<p>${payload.message}</p>`,
      actionUrl: payload.action_url,
      actionLabel: payload.action_label,
    })
  }

  private static shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    // Verifica se preferência específica está habilitada
    return (preferences as any)[type] !== false
  }

  private static getDefaultChannels(
    type: NotificationType,
    preferences: NotificationPreferences
  ): Array<'email' | 'in_app' | 'push' | 'sms'> {
    const channels: Array<'email' | 'in_app' | 'push' | 'sms'> = ['in_app']
    
    // Tipos urgentes sempre enviam email
    const urgentTypes: NotificationType[] = [
      'document_expiring',
      'signature_request',
      'document_cancelled',
    ]
    
    if (urgentTypes.includes(type) && preferences.email_enabled) {
      channels.push('email')
    }
    
    return channels
  }

  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      user_id: userId,
      email_enabled: true,
      in_app_enabled: true,
      push_enabled: false,
      sms_enabled: false,
      document_ready: true,
      signature_received: true,
      document_expiring: true,
      document_expired: true,
      signature_request: true,
      validation_viewed: false,
      system_update: true,
    }
  }
}
