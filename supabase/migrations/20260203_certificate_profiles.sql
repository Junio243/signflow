-- Migration: Sistema de Perfis para Certificados
-- Permite múltiplos perfis por usuário (Médico, Advogado, Estudante, etc.)
-- Cada certificado é associado a um perfil específico

-- ============================================
-- 1. Criar tabela de perfis de certificados
-- ============================================
CREATE TABLE IF NOT EXISTS public.certificate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação do perfil
  profile_name TEXT NOT NULL, -- Ex: "Dr. João Silva - CRM 12345", "Advogado - OAB/SP 123456"
  profile_type TEXT NOT NULL CHECK (profile_type IN ('professional', 'personal', 'student', 'legal_representative', 'corporate')),
  
  -- Dados do titular
  cpf_cnpj TEXT, -- Documento associado ao perfil
  organization TEXT, -- Ex: "Hospital São Lucas", "Universidade Federal"
  registration_number TEXT, -- Ex: CRM, OAB, CREA, etc.
  
  -- Configurações
  is_default BOOLEAN DEFAULT false, -- Perfil padrão para assinaturas
  is_active BOOLEAN DEFAULT true,
  
  -- Metadados adicionais (JSON flexível)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_user_profile_name UNIQUE (user_id, profile_name)
);

-- Índice para busca por usuário
CREATE INDEX idx_certificate_profiles_user_id ON public.certificate_profiles(user_id);

-- Índice para busca por tipo
CREATE INDEX idx_certificate_profiles_type ON public.certificate_profiles(profile_type);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_certificate_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_certificate_profiles_updated_at
  BEFORE UPDATE ON public.certificate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_profiles_updated_at();

-- ============================================
-- 2. Atualizar tabela certificates
-- ============================================

-- Adicionar novas colunas
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.certificate_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'uploaded' CHECK (generation_method IN ('uploaded', 'auto_generated')),
  ADD COLUMN IF NOT EXISTS key_strength INTEGER DEFAULT 2048 CHECK (key_strength IN (2048, 4096)),
  ADD COLUMN IF NOT EXISTS issuer TEXT DEFAULT 'Self-Signed',
  ADD COLUMN IF NOT EXISTS subject_data JSONB DEFAULT '{}';

-- Índice para busca por perfil
CREATE INDEX IF NOT EXISTS idx_certificates_profile_id ON public.certificates(profile_id);

-- Índice para busca por método de geração
CREATE INDEX IF NOT EXISTS idx_certificates_generation_method ON public.certificates(generation_method);

-- ============================================
-- 3. Políticas RLS (Row Level Security)
-- ============================================

-- Habilitar RLS na tabela certificate_profiles
ALTER TABLE public.certificate_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seus próprios perfis
CREATE POLICY "Users can view their own certificate profiles"
  ON public.certificate_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios perfis
CREATE POLICY "Users can create their own certificate profiles"
  ON public.certificate_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update their own certificate profiles"
  ON public.certificate_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios perfis
CREATE POLICY "Users can delete their own certificate profiles"
  ON public.certificate_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. Função: Garantir apenas 1 perfil padrão por usuário
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o perfil sendo inserido/atualizado está marcado como padrão
  IF NEW.is_default = true THEN
    -- Desmarcar todos os outros perfis padrão do mesmo usuário
    UPDATE public.certificate_profiles
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_profile
  BEFORE INSERT OR UPDATE ON public.certificate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_profile();

-- ============================================
-- 5. Seed: Criar perfis padrão sugeridos (opcional)
-- ============================================
-- Nota: Estes são apenas templates. Perfis reais serão criados por usuários.

COMMENT ON TABLE public.certificate_profiles IS 'Perfis de certificados: Médico, Advogado, Estudante, etc. Cada certificado é vinculado a um perfil.';
COMMENT ON COLUMN public.certificate_profiles.profile_type IS 'Tipos: professional (médico, advogado), personal (PF), student, legal_representative, corporate (PJ)';
COMMENT ON COLUMN public.certificate_profiles.registration_number IS 'Número de registro profissional: CRM, OAB, CREA, CRO, etc.';
COMMENT ON COLUMN public.certificates.generation_method IS 'Como o certificado foi criado: uploaded (enviado pelo usuário) ou auto_generated (gerado pelo sistema)';
COMMENT ON COLUMN public.certificates.key_strength IS 'Força da chave RSA em bits: 2048 (padrão) ou 4096 (alta segurança)';
COMMENT ON COLUMN public.certificates.issuer IS 'Emissor do certificado: Self-Signed, SignFlow CA, ICP-Brasil, etc.';
COMMENT ON COLUMN public.certificates.subject_data IS 'Dados do titular em formato JSON: nome, CPF, profissão, organização, etc.';
