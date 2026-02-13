-- database/migrations/004_audit_and_webhooks.sql
-- Cria tabelas de auditoria e webhooks para SignFlow

-- ============================================
-- TABELA DE AUDITORIA (audit_logs)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem visualizar todos os logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política: Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABELA DE WEBHOOKS
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus webhooks
CREATE POLICY "Users can view their own webhooks"
  ON webhooks
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Usuários podem criar webhooks
CREATE POLICY "Users can create their own webhooks"
  ON webhooks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar seus webhooks
CREATE POLICY "Users can update their own webhooks"
  ON webhooks
  FOR UPDATE
  USING (user_id = auth.uid());

-- Política: Usuários podem deletar seus webhooks
CREATE POLICY "Users can delete their own webhooks"
  ON webhooks
  FOR DELETE
  USING (user_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS webhooks_updated_at_trigger ON webhooks;
CREATE TRIGGER webhooks_updated_at_trigger
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE audit_logs IS 'Registro de auditoria de todas as ações críticas no sistema';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação (ex: document.upload, user.login)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Tipo do recurso afetado (ex: document, user)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID do recurso afetado';
COMMENT ON COLUMN audit_logs.status IS 'Status da ação: success, error, pending';
COMMENT ON COLUMN audit_logs.details IS 'Dados adicionais em formato JSON';

COMMENT ON TABLE webhooks IS 'Configurações de webhooks dos usuários para notificações em tempo real';
COMMENT ON COLUMN webhooks.url IS 'URL de destino do webhook';
COMMENT ON COLUMN webhooks.events IS 'Lista de eventos que disparam este webhook';
COMMENT ON COLUMN webhooks.secret IS 'Secret para assinatura HMAC-SHA256 das payloads';
COMMENT ON COLUMN webhooks.active IS 'Se o webhook está ativo';

-- ============================================
-- GRANTS (PERMISSÕES)
-- ============================================

-- Service role pode fazer tudo (para APIs)
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON webhooks TO service_role;

-- Authenticated users podem fazer operações limitadas
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
