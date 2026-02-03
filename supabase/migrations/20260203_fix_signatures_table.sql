-- Correção da tabela signatures
-- Adiciona colunas faltantes e corrige estrutura

-- 1. Verificar se tabela signatures existe, se não, criar
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar colunas faltantes (IF NOT EXISTS para evitar erros)
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signer_name TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signer_email TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signer_reg TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signature_type TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS document_hash TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signature_hash TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signature_data JSONB;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 3. Adicionar colunas antigas se existirem (compatibilidade)
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS certificate_id UUID;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_name TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_path TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_size BIGINT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_document_path TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_document_size BIGINT;

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);

-- 5. Adicionar FK para documents (se tabela documents existir)
DO $$
BEGIN
  -- Verificar se tabela documents existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
    -- Remover FK antiga se existir
    ALTER TABLE signatures DROP CONSTRAINT IF EXISTS signatures_document_id_fkey;
    
    -- Adicionar nova FK
    ALTER TABLE signatures 
      ADD CONSTRAINT signatures_document_id_fkey 
      FOREIGN KEY (document_id) 
      REFERENCES documents(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Habilitar RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- 7. Criar policies
DROP POLICY IF EXISTS "Users can view own signatures" ON signatures;
CREATE POLICY "Users can view own signatures" 
  ON signatures FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own signatures" ON signatures;
CREATE POLICY "Users can insert own signatures" 
  ON signatures FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own signatures" ON signatures;
CREATE POLICY "Users can update own signatures" 
  ON signatures FOR UPDATE 
  USING (auth.uid() = user_id);

-- 8. Comentar tabela
COMMENT ON TABLE signatures IS 'Registro de assinaturas digitais realizadas';
COMMENT ON COLUMN signatures.document_id IS 'Referência ao documento em documents';
COMMENT ON COLUMN signatures.signature_type IS 'Tipo: digital_pki, visual_only, both';
COMMENT ON COLUMN signatures.document_hash IS 'Hash SHA-256 do documento assinado';
COMMENT ON COLUMN signatures.signature_data IS 'Metadados da assinatura em JSON';

-- 9. Resultado
SELECT 'Tabela signatures corrigida com sucesso!' AS status;

-- 10. Mostrar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'signatures' 
ORDER BY ordinal_position;
