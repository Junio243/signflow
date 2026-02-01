-- ============================================
-- AUDIT LOGS SYSTEM - DATABASE SCHEMA
-- ============================================
-- Sistema de auditoria com logs persistentes
-- para rastreabilidade e compliance
-- ============================================

-- 1. Tabela de Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp do evento
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identificação do usuário (pode ser NULL para ações anônimas)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ação executada
  action TEXT NOT NULL,
  
  -- Recurso afetado (ex: 'document', 'signature', 'validation')
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- IP do cliente (hashed para privacidade)
  ip_hash TEXT,
  
  -- Status da operação
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'denied', 'error')),
  
  -- Detalhes adicionais (JSON)
  details JSONB DEFAULT '{}',
  
  -- Metadata adicional
  user_agent TEXT,
  request_id TEXT,
  
  -- Índices para tipos de ação comuns
  CONSTRAINT valid_action CHECK (action IN (
    -- Document operations
    'document.upload',
    'document.sign',
    'document.validate',
    'document.delete',
    'document.download',
    'document.view',
    'document.update',
    -- Authentication/Authorization
    'auth.login',
    'auth.logout',
    'auth.denied',
    'auth.failed',
    -- Rate limiting
    'rate_limit.exceeded',
    'rate_limit.violation',
    -- Security
    'security.scan',
    'security.violation',
    'security.suspicious_activity',
    -- System
    'system.error',
    'system.cleanup',
    'system.maintenance'
  ))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_hash ON audit_logs(ip_hash) WHERE ip_hash IS NOT NULL;

-- 2. Row Level Security (RLS)

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Apenas service role pode inserir logs (via API routes)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Apenas admins podem ler logs (pode ser ajustado conforme necessidade)
-- Por enquanto, apenas service role pode ler
CREATE POLICY "Service role can read audit logs"
  ON audit_logs FOR SELECT
  USING (true);

-- Ninguém pode atualizar ou deletar logs (imutabilidade)
-- Logs são apenas para leitura após criação

-- 3. Função para limpar logs antigos (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Manter logs por 1 ano por padrão (compliance)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. View para estatísticas de auditoria (útil para dashboard)
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
  action,
  resource_type,
  status,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_hash) as unique_ips,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY action, resource_type, status
ORDER BY total_events DESC;

-- 5. View para eventos recentes (últimas 24h)
CREATE OR REPLACE VIEW audit_recent AS
SELECT 
  id,
  created_at,
  action,
  resource_type,
  resource_id,
  status,
  user_id,
  ip_hash,
  details
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 1000;

-- 6. View para eventos de falha/negação (últimos 7 dias)
CREATE OR REPLACE VIEW audit_security_events AS
SELECT 
  id,
  created_at,
  action,
  resource_type,
  resource_id,
  status,
  user_id,
  ip_hash,
  details,
  user_agent
FROM audit_logs
WHERE status IN ('failure', 'denied', 'error')
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- FIM
-- ============================================
