-- MIGRATION COMPLETA E CONSOLIDADA
-- Executa tudo na ordem correta
-- Safe para executar múltiplas vezes (idempotente)

-- ============================================
-- PARTE 1: CORRIGIR TABELA SIGNATURES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '1. Corrigindo tabela signatures...';
END $$;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas essenciais
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

-- Colunas legadas (compatibilidade)
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS certificate_id UUID;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_name TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_path TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS original_document_size BIGINT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_document_path TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_document_size BIGINT;

DO $$
BEGIN
  RAISE NOTICE '   ✓ Tabela signatures corrigida';
END $$;

-- ============================================
-- PARTE 2: CORRIGIR TABELA DOCUMENTS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '2. Corrigindo tabela documents...';
END $$;

-- Adicionar colunas em documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'advanced';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Atualizar valores nulos
UPDATE documents SET document_type = 'advanced' WHERE document_type IS NULL;

DO $$
BEGIN
  RAISE NOTICE '   ✓ Tabela documents corrigida';
END $$;

-- ============================================
-- PARTE 3: CRIAR ÍNDICES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '3. Criando índices...';
END $$;

-- Índices em documents
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Índices em signatures
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);

DO $$
BEGIN
  RAISE NOTICE '   ✓ Índices criados';
END $$;

-- ============================================
-- PARTE 4: CRIAR FOREIGN KEYS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '4. Criando foreign keys...';
END $$;

-- FK de signatures para documents
ALTER TABLE signatures DROP CONSTRAINT IF EXISTS signatures_document_id_fkey;
ALTER TABLE signatures 
  ADD CONSTRAINT signatures_document_id_fkey 
  FOREIGN KEY (document_id) 
  REFERENCES documents(id) 
  ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '   ✓ Foreign keys criadas';
END $$;

-- ============================================
-- PARTE 5: HABILITAR RLS E POLICIES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '5. Configurando RLS...';
END $$;

-- RLS em documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents" 
  ON documents FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
CREATE POLICY "Users can insert own documents" 
  ON documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON documents;
CREATE POLICY "Users can update own documents" 
  ON documents FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS em signatures
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

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

DO $$
BEGIN
  RAISE NOTICE '   ✓ RLS configurado';
END $$;

-- ============================================
-- PARTE 6: CRIAR VIEWS E FUNÇÕES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '6. Criando views e funções...';
END $$;

-- View unificada
CREATE OR REPLACE VIEW dashboard_documents AS
SELECT 
  d.id,
  d.user_id,
  d.document_type,
  d.original_pdf_name,
  d.signed_pdf_url,
  d.qr_code_url,
  d.status,
  d.metadata,
  d.created_at,
  d.updated_at,
  s.signer_name,
  s.signer_email,
  s.signature_type,
  s.document_hash,
  s.signed_at AS signature_date,
  s.status AS signature_status
FROM documents d
LEFT JOIN signatures s ON d.id = s.document_id
ORDER BY d.created_at DESC;

-- Função para buscar documentos
CREATE OR REPLACE FUNCTION get_user_documents(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  document_type TEXT,
  original_pdf_name TEXT,
  signed_pdf_url TEXT,
  qr_code_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  signer_name TEXT,
  signature_type TEXT,
  signature_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.document_type,
    d.original_pdf_name,
    d.signed_pdf_url,
    d.qr_code_url,
    d.status,
    d.created_at,
    s.signer_name,
    s.signature_type,
    s.signed_at AS signature_date
  FROM documents d
  LEFT JOIN signatures s ON d.id = s.document_id
  WHERE d.user_id = p_user_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas
CREATE OR REPLACE FUNCTION get_user_signature_stats(p_user_id UUID)
RETURNS TABLE (
  total_documents BIGINT,
  quick_signatures BIGINT,
  advanced_signatures BIGINT,
  pki_signatures BIGINT,
  visual_signatures BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id) AS total_documents,
    COUNT(DISTINCT CASE WHEN d.document_type = 'quick' THEN d.id END) AS quick_signatures,
    COUNT(DISTINCT CASE WHEN d.document_type = 'advanced' THEN d.id END) AS advanced_signatures,
    COUNT(DISTINCT CASE WHEN s.signature_type IN ('digital_pki', 'both') THEN d.id END) AS pki_signatures,
    COUNT(DISTINCT CASE WHEN s.signature_type IN ('visual_only', 'both') THEN d.id END) AS visual_signatures
  FROM documents d
  LEFT JOIN signatures s ON d.id = s.document_id
  WHERE d.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON documents;
CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

DO $$
BEGIN
  RAISE NOTICE '   ✓ Views e funções criadas';
END $$;

-- ============================================
-- PARTE 7: COMENTÁRIOS
-- ============================================

COMMENT ON TABLE documents IS 'Documentos assinados (rápidos e avançados)';
COMMENT ON COLUMN documents.document_type IS 'Tipo: quick (rápida) ou advanced (avançada)';
COMMENT ON TABLE signatures IS 'Registro de assinaturas digitais realizadas';
COMMENT ON COLUMN signatures.document_id IS 'Referência ao documento em documents';
COMMENT ON COLUMN signatures.signature_type IS 'Tipo: digital_pki, visual_only, both';
COMMENT ON COLUMN signatures.document_hash IS 'Hash SHA-256 do documento';
COMMENT ON VIEW dashboard_documents IS 'View unificada para dashboard';
COMMENT ON FUNCTION get_user_documents IS 'Retorna todos documentos do usuário';
COMMENT ON FUNCTION get_user_signature_stats IS 'Estatísticas de assinaturas';

-- ============================================
-- RESULTADO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Fazer deploy: vercel --prod';
  RAISE NOTICE '2. Atualizar frontend para usar /api/sign/quick';
  RAISE NOTICE '3. Dashboard usar dashboard_documents view';
  RAISE NOTICE '';
END $$;

-- Mostrar estrutura final
SELECT 
  '=== ESTRUTURA DA TABELA SIGNATURES ===' AS info;

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'signatures'
ORDER BY ordinal_position;

SELECT 
  '=== ESTRUTURA DA TABELA DOCUMENTS ===' AS info;

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents'
ORDER BY ordinal_position;
