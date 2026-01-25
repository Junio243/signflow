// ============================================
// EMAIL SERVICE - RESEND INTEGRATION
// ============================================

import { EmailTemplate } from './types'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'SignFlow <notificacoes@signflow.app>'

export class EmailService {
  private apiKey: string

  constructor() {
    if (!RESEND_API_KEY) {
      console.warn('[EmailService] RESEND_API_KEY não configurada. Emails não serão enviados.')
      this.apiKey = ''
    } else {
      this.apiKey = RESEND_API_KEY
    }
  }

  async send({
    to,
    subject,
    html,
    text,
    replyTo,
  }: {
    to: string | string[]
    subject: string
    html: string
    text?: string
    replyTo?: string
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.apiKey) {
      console.log('[EmailService] Mock: Email seria enviado para', to)
      return { success: true, id: 'mock-' + Date.now() }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || this.htmlToText(html),
          reply_to: replyTo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[EmailService] Erro ao enviar email:', data)
        return { 
          success: false, 
          error: data.message || 'Erro ao enviar email' 
        }
      }

      return { success: true, id: data.id }
    } catch (error) {
      console.error('[EmailService] Exceção ao enviar email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  async sendBatch(emails: Array<{
    to: string
    subject: string
    html: string
    text?: string
  }>): Promise<{ success: boolean; results: any[] }> {
    if (!this.apiKey) {
      console.log('[EmailService] Mock: Lote de', emails.length, 'emails')
      return { success: true, results: [] }
    }

    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          emails: emails.map(email => ({
            from: FROM_EMAIL,
            to: [email.to],
            subject: email.subject,
            html: email.html,
            text: email.text || this.htmlToText(email.html),
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[EmailService] Erro no lote:', data)
        return { success: false, results: [] }
      }

      return { success: true, results: data.data }
    } catch (error) {
      console.error('[EmailService] Exceção no lote:', error)
      return { success: false, results: [] }
    }
  }

  // Helper: Converte HTML básico para texto
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Template genérico de email
  static createEmailTemplate({
    title,
    content,
    actionUrl,
    actionLabel,
    footerText,
  }: {
    title: string
    content: string
    actionUrl?: string
    actionLabel?: string
    footerText?: string
  }): EmailTemplate {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <img src="https://seu-dominio.vercel.app/logo.png" alt="SignFlow" style="height: 40px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          
          <!-- Action Button -->
          ${actionUrl && actionLabel ? `
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${actionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
                ${actionLabel}
              </a>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              ${footerText || 'SignFlow - Assinaturas digitais com validade jurídica'}<br>
              <a href="https://seu-dominio.vercel.app/unsubscribe" style="color: #6b7280; text-decoration: underline; margin-top: 8px; display: inline-block;">Cancelar inscrição</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    return { subject: title, html }
  }
}

export const emailService = new EmailService()
