-- ==================================================
-- TABELA DE ASSINATURAS
-- ==================================================

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
  signature_position JSONB, -- { page: number, x: number, y: number, width: number, height: number }
  
  -- Dados da assinatura
  signature_data JSONB DEFAULT '{}', -- metadados (certificado info, timestamp, etc)
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'processing')),
  
  -- Timestamps
  signed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX idx_signatures_user_id ON signatures(user_id);
CREATE INDEX idx_signatures_certificate_id ON signatures(certificate_id);
CREATE INDEX idx_signatures_signed_at ON signatures(signed_at DESC);
CREATE INDEX idx_signatures_status ON signatures(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_signatures_updated_at
BEFORE UPDATE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_signatures_updated_at();

-- ==================================================
-- POLÍTICAS RLS
-- ==================================================

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view their own signatures"
ON signatures
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias assinaturas
CREATE POLICY "Users can create their own signatures"
ON signatures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias assinaturas
CREATE POLICY "Users can update their own signatures"
ON signatures
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias assinaturas
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
