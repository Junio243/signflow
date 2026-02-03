-- ==================================================
-- TABELA DE ASSINATURAS (SAFE VERSION)
-- ==================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  
  -- Documento original
  original_document_name TEXT NOT NULL,
  original_document_path TEXT NOT NULL,
  original_document_size INTEGER,
  
  -- Documento assinado
  signed_document_path TEXT NOT NULL,
  signed_document_size INTEGER,
  
  -- Hash e verificação
  document_hash TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  
  -- Tipo e posição da assinatura
  signature_type TEXT NOT NULL CHECK (signature_type IN ('visual', 'digital', 'both')),
  signature_position JSONB,
  
  -- Dados da assinatura
  signature_data JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'processing')),
  
  -- Timestamps
  signed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Índices (ignorar se já existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signatures_user_id') THEN
    CREATE INDEX idx_signatures_user_id ON signatures(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signatures_certificate_id') THEN
    CREATE INDEX idx_signatures_certificate_id ON signatures(certificate_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signatures_signed_at') THEN
    CREATE INDEX idx_signatures_signed_at ON signatures(signed_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signatures_status') THEN
    CREATE INDEX idx_signatures_status ON signatures(status);
  END IF;
END $$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (remover se existir e recriar)
DROP TRIGGER IF EXISTS trigger_update_signatures_updated_at ON signatures;
CREATE TRIGGER trigger_update_signatures_updated_at
BEFORE UPDATE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_signatures_updated_at();

-- ==================================================
-- POLÍTICAS RLS
-- ==================================================

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can create their own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON signatures;

-- Criar políticas
CREATE POLICY "Users can view their own signatures"
ON signatures
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures"
ON signatures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures"
ON signatures
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures"
ON signatures
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==================================================
-- BUCKET NO STORAGE PARA DOCUMENTOS
-- ==================================================

-- Criar bucket 'documents' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas de storage
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Políticas de storage para documentos
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
