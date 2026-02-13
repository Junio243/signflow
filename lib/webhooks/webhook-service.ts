// lib/webhooks/webhook-service.ts
/**
 * Serviço de Webhooks para SignFlow
 * 
 * Permite que usuários configurem webhooks para receber notificações
 * em tempo real sobre eventos na plataforma.
 * 
 * Eventos suportados:
 * - document.uploaded
 * - document.signed
 * - document.validated
 * - document.deleted
 * - signature.created
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export type WebhookEvent =
  | 'document.uploaded'
  | 'document.signed'
  | 'document.validated'
  | 'document.deleted'
  | 'signature.created'
  | 'user.created';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  userId?: string;
}

export interface WebhookConfig {
  id: string;
  user_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  created_at: string;
}

/**
 * Gera assinatura HMAC-SHA256 para validação do webhook
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Dispara um webhook para uma URL configurada
 */
async function triggerWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, secret);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SignFlow-Signature': signature,
        'X-SignFlow-Event': payload.event,
        'User-Agent': 'SignFlow-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      logger.info('Webhook triggered successfully', {
        url,
        event: payload.event,
        status: response.status,
      });
      return { success: true };
    } else {
      const error = `HTTP ${response.status}: ${response.statusText}`;
      logger.warn('Webhook failed', { url, event: payload.event, error });
      return { success: false, error };
    }
  } catch (error: any) {
    logger.error('Webhook exception', error, { url, event: payload.event });
    return { success: false, error: error.message };
  }
}

/**
 * Busca webhooks configurados para um usuário e evento
 */
export async function getWebhooksForEvent(
  userId: string,
  event: WebhookEvent
): Promise<WebhookConfig[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .contains('events', [event]);

    if (error) {
      logger.error('Failed to fetch webhooks', error, { userId, event });
      return [];
    }

    return (data || []) as WebhookConfig[];
  } catch (error) {
    logger.error('Exception fetching webhooks', error as Error, { userId, event });
    return [];
  }
}

/**
 * Dispara webhooks para um evento específico
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await getWebhooksForEvent(userId, event);

    if (webhooks.length === 0) {
      logger.debug('No webhooks configured for event', { userId, event });
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      userId,
    };

    // Dispara webhooks em paralelo
    const results = await Promise.allSettled(
      webhooks.map((webhook) => triggerWebhook(webhook.url, payload, webhook.secret))
    );

    // Log resultados
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        logger.info('Webhook delivered', {
          webhookId: webhooks[index].id,
          event,
        });
      } else {
        logger.warn('Webhook delivery failed', {
          webhookId: webhooks[index].id,
          event,
          error: result.status === 'fulfilled' ? result.value.error : 'rejected',
        });
      }
    });
  } catch (error) {
    logger.error('Exception dispatching webhooks', error as Error, { userId, event });
  }
}

/**
 * Helpers pré-configurados para eventos comuns
 */
export const WebhookHelpers = {
  documentUploaded: (userId: string, documentId: string, fileName: string) => {
    return dispatchWebhookEvent(userId, 'document.uploaded', {
      documentId,
      fileName,
    });
  },

  documentSigned: (userId: string, documentId: string, fileName: string, signaturesCount: number) => {
    return dispatchWebhookEvent(userId, 'document.signed', {
      documentId,
      fileName,
      signaturesCount,
    });
  },

  documentValidated: (userId: string, documentId: string, validatedBy: string) => {
    return dispatchWebhookEvent(userId, 'document.validated', {
      documentId,
      validatedBy,
    });
  },

  documentDeleted: (userId: string, documentId: string) => {
    return dispatchWebhookEvent(userId, 'document.deleted', {
      documentId,
    });
  },
};

export default dispatchWebhookEvent;
