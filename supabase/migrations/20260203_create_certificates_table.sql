-- ============================================
-- Migration: Criar tabela certificates (base)
-- Deve ser executada ANTES de 20260203_certificate_profiles.sql
-- ============================================

-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  certificate_name TEXT NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'custom' CHECK (certificate_type IN ('auto', 'icp-brasil', 'custom')),
  
  -- Armazenamento
  certificate_path TEXT NOT NULL, -- Caminho no Supabase Storage
  encrypted_password TEXT NOT NULL, -- Senha criptografada (AES-256)
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Apenas um certificado ativo por usuário
  CONSTRAINT unique_active_certificate_per_user 
    EXCLUDE (user_id WITH =) WHERE (is_active = true)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_is_active ON public.certificates(is_active);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- Habilitar RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
  ON public.certificates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificates"
  ON public.certificates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE public.certificates IS 'Certificados digitais dos usuários (auto-gerados ou uploadados)';
COMMENT ON COLUMN public.certificates.certificate_type IS 'Tipos: auto (gerado automaticamente), icp-brasil (certificado ICP), custom (próprio)';
COMMENT ON COLUMN public.certificates.encrypted_password IS 'Senha do certificado criptografada com AES-256';
COMMENT ON CONSTRAINT unique_active_certificate_per_user ON public.certificates IS 'Garante apenas 1 certificado ativo por usuário';
