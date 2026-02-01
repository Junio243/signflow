/**
 * Sistema de Auditoria
 * 
 * Este módulo fornece funções para registrar eventos de auditoria
 * no banco de dados para rastreabilidade e compliance.
 */

import { getSupabaseAdmin } from './supabaseAdmin';
import { createHash } from 'crypto';

/**
 * Tipos de ação permitidos no sistema de auditoria
 */
export type AuditAction =
  // Document operations
  | 'document.upload'
  | 'document.sign'
  | 'document.validate'
  | 'document.delete'
  | 'document.download'
  | 'document.view'
  | 'document.update'
  // Authentication/Authorization
  | 'auth.login'
  | 'auth.logout'
  | 'auth.denied'
  | 'auth.failed'
  // Rate limiting
  | 'rate_limit.exceeded'
  | 'rate_limit.violation'
  // Security
  | 'security.scan'
  | 'security.violation'
  | 'security.suspicious_activity'
  // System
  | 'system.error'
  | 'system.cleanup'
  | 'system.maintenance';

/**
 * Status de uma operação auditada
 */
export type AuditStatus = 'success' | 'failure' | 'denied' | 'error';

/**
 * Tipo de recurso afetado
 */
export type ResourceType = 
  | 'document'
  | 'signature'
  | 'validation'
  | 'user'
  | 'system'
  | 'storage';

/**
 * Parâmetros para registro de auditoria
 */
export interface AuditLogParams {
  /** Ação executada */
  action: AuditAction;
  
  /** Tipo de recurso afetado */
  resourceType: ResourceType;
  
  /** ID do recurso (opcional) */
  resourceId?: string;
  
  /** Status da operação */
  status: AuditStatus;
  
  /** ID do usuário (opcional para ações anônimas) */
  userId?: string | null;
  
  /** Endereço IP do cliente (será hasheado) */
  ip?: string;
  
  /** Detalhes adicionais sobre o evento */
  details?: Record<string, any>;
  
  /** User agent do cliente */
  userAgent?: string;
  
  /** ID da requisição (para correlação) */
  requestId?: string;
}

/**
 * Gera hash SHA-256 de uma string
 */
function hashString(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Registra um evento de auditoria no banco de dados
 * 
 * Esta função é assíncrona mas não lança erros - falhas são logadas
 * no console para não interromper o fluxo principal da aplicação.
 * 
 * @param params Parâmetros do evento de auditoria
 * @returns Promise<boolean> - true se o log foi registrado com sucesso
 * 
 * @example
 * ```typescript
 * await logAudit({
 *   action: 'document.upload',
 *   resourceType: 'document',
 *   resourceId: documentId,
 *   status: 'success',
 *   userId: user?.id,
 *   ip: clientIp,
 *   details: { fileName: 'contract.pdf', size: 1024000 }
 * });
 * ```
 */
export async function logAudit(params: AuditLogParams): Promise<boolean> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Hash do IP para privacidade
    const ipHash = params.ip ? hashString(params.ip) : null;
    
    // Preparar payload
    const payload = {
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      status: params.status,
      user_id: params.userId || null,
      ip_hash: ipHash,
      details: params.details || {},
      user_agent: params.userAgent || null,
      request_id: params.requestId || null,
    };
    
    // Inserir log no banco
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert(payload);
    
    if (error) {
      console.error('[Audit] Erro ao registrar log de auditoria:', {
        error: error.message,
        action: params.action,
        resourceType: params.resourceType,
        status: params.status,
      });
      return false;
    }
    
    return true;
  } catch (error) {
    // Nunca lançar erro - apenas logar
    console.error('[Audit] Exceção ao registrar log de auditoria:', {
      error: error instanceof Error ? error.message : String(error),
      action: params.action,
      resourceType: params.resourceType,
      status: params.status,
    });
    return false;
  }
}

/**
 * Registra múltiplos eventos de auditoria de uma vez
 * 
 * @param events Array de eventos de auditoria
 * @returns Promise<number> - número de eventos registrados com sucesso
 */
export async function logAuditBatch(events: AuditLogParams[]): Promise<number> {
  if (events.length === 0) return 0;
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Preparar todos os payloads
    const payloads = events.map(params => ({
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      status: params.status,
      user_id: params.userId || null,
      ip_hash: params.ip ? hashString(params.ip) : null,
      details: params.details || {},
      user_agent: params.userAgent || null,
      request_id: params.requestId || null,
    }));
    
    // Inserir todos de uma vez
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert(payloads);
    
    if (error) {
      console.error('[Audit] Erro ao registrar lote de logs:', error.message);
      return 0;
    }
    
    return payloads.length;
  } catch (error) {
    console.error('[Audit] Exceção ao registrar lote de logs:', 
      error instanceof Error ? error.message : String(error)
    );
    return 0;
  }
}

/**
 * Helper para extrair IP de uma requisição Next.js
 */
export function extractIpFromRequest(request: Request): string {
  const headers = new Headers(request.headers);
  
  // Tentar vários headers comuns
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  
  // x-forwarded-for pode ser uma lista separada por vírgulas
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // Primeiro IP é o cliente
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback
  return '0.0.0.0';
}
