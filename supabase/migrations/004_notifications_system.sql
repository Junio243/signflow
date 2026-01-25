-- ============================================
-- NOTIFICATION SYSTEM - DATABASE SCHEMA
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo e conteúdo
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Ação (link)
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata adicional (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Índices
  CONSTRAINT valid_type CHECK (type IN (
    'document_ready',
    'signature_received',
    'document_expiring',
    'document_expired',
    'document_cancelled',
    'signature_request',
    'validation_viewed',
    'system_update',
    'welcome',
    'reminder'
  ))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 2. Tabela de Preferências de Notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canais habilitados
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  
  -- Preferências por tipo de notificação
  document_ready BOOLEAN DEFAULT TRUE,
  signature_received BOOLEAN DEFAULT TRUE,
  document_expiring BOOLEAN DEFAULT TRUE,
  document_expired BOOLEAN DEFAULT TRUE,
  signature_request BOOLEAN DEFAULT TRUE,
  validation_viewed BOOLEAN DEFAULT FALSE,
  system_update BOOLEAN DEFAULT TRUE,
  
  -- Horário de silêncio (quiet hours)
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Digest (agrupar notificações)
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security (RLS)

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- API routes usarão service role

-- Políticas para notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Função para criar preferências padrão ao criar usuário
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar preferências automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- 5. Função para limpar notificações antigas (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
     OR (expires_at IS NOT NULL AND expires_at < NOW());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View para estatísticas de notificações
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read_at IS NOT NULL) as total_read,
  COUNT(*) FILTER (WHERE read_at IS NULL) as total_unread,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as total_clicked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE read_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as read_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as click_rate
FROM notifications
GROUP BY user_id;

-- ============================================
-- DADOS DE TESTE (OPCIONAL)
-- ============================================

-- Exemplo: Inserir notificação de teste
-- SUBSTITUA 'SEU_USER_ID' pelo ID real de um usuário
/*
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  action_url,
  action_label
) VALUES (
  'SEU_USER_ID',
  'welcome',
  'Bem-vindo ao SignFlow! 🎉',
  'Obrigado por se juntar a nós. Comece criando seu primeiro documento assinado.',
  'normal',
  '/editor',
  'Criar documento'
);
*/

-- ============================================
-- FIM
-- ============================================
