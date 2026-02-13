// lib/audit.ts
/**
 * Sistema de Auditoria Completo
 * 
 * Registra todas as ações críticas no sistema para compliance e segurança
 */

import { getSupabaseAdmin } from './supabaseAdmin';
import { logger } from './logger';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  action: string; // Ex: 'document.upload', 'document.sign', 'user.login'
  resourceType: string; // Ex: 'document', 'user', 'signature'
  resourceId?: string; // ID do recurso afetado
  userId?: string | null; // ID do usuário que executou a ação
  status: 'success' | 'error' | 'pending'; // Resultado da ação
  ip?: string; // IP do cliente
  userAgent?: string; // User agent do navegador
  requestId?: string; // ID único da requisição
  details?: Record<string, any>; // Detalhes adicionais
}

/**
 * Registra um evento de auditoria no banco de dados
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    const auditRecord = {
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      user_id: entry.userId || null,
      status: entry.status,
      ip_address: entry.ip || null,
      user_agent: entry.userAgent || null,
      request_id: entry.requestId || null,
      details: entry.details || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditRecord);

    if (error) {
      logger.error('Failed to write audit log', error, { entry });
    } else {
      logger.debug('Audit log written', { action: entry.action, resourceId: entry.resourceId });
    }
  } catch (error) {
    logger.error('Exception in logAudit', error as Error, { entry });
  }
}

/**
 * Helper: extrai IP da requisição
 */
export function extractIpFromRequest(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Helper: extrai User-Agent da requisição
 */
export function extractUserAgentFromRequest(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Helpers pré-configurados para eventos comuns
 */
export const AuditHelpers = {
  documentUpload: (documentId: string, userId: string | null, ip: string, success: boolean, details?: Record<string, any>) => {
    return logAudit({
      action: 'document.upload',
      resourceType: 'document',
      resourceId: documentId,
      userId,
      status: success ? 'success' : 'error',
      ip,
      details,
    });
  },

  documentSign: (documentId: string, userId: string | null, ip: string, success: boolean, details?: Record<string, any>) => {
    return logAudit({
      action: 'document.sign',
      resourceType: 'document',
      resourceId: documentId,
      userId,
      status: success ? 'success' : 'error',
      ip,
      details,
    });
  },

  documentDelete: (documentId: string, userId: string | null, ip: string, success: boolean) => {
    return logAudit({
      action: 'document.delete',
      resourceType: 'document',
      resourceId: documentId,
      userId,
      status: success ? 'success' : 'error',
      ip,
    });
  },

  documentValidation: (documentId: string, ip: string, success: boolean, accessCodeProvided: boolean) => {
    return logAudit({
      action: 'document.validation',
      resourceType: 'document',
      resourceId: documentId,
      status: success ? 'success' : 'error',
      ip,
      details: { accessCodeProvided },
    });
  },

  userLogin: (userId: string, ip: string, userAgent: string, success: boolean) => {
    return logAudit({
      action: 'user.login',
      resourceType: 'user',
      resourceId: userId,
      userId,
      status: success ? 'success' : 'error',
      ip,
      userAgent,
    });
  },

  securityEvent: (eventType: string, ip: string, details: Record<string, any>) => {
    return logAudit({
      action: `security.${eventType}`,
      resourceType: 'security',
      status: 'error',
      ip,
      details,
    });
  },
};

export default logAudit;
