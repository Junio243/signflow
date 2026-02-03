-- Unificação dos sistemas de assinatura rápida e avançada
-- Resolve problemas de tabelas conflitantes e histórico

-- 1. Adicionar coluna document_type em documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'advanced';

-- 2. Adicionar coluna user_id em documents (se não existir)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);

-- 4. Garantir que signatures tenha document_id (FK para documents)
ALTER TABLE signatures 
  DROP CONSTRAINT IF EXISTS signatures_document_id_fkey;

ALTER TABLE signatures 
  ADD CONSTRAINT signatures_document_id_fkey 
  FOREIGN KEY (document_id) 
  REFERENCES documents(id) 
  ON DELETE CASCADE;

-- 5. Atualizar documentos existentes
UPDATE documents 
SET document_type = 'advanced' 
WHERE document_type IS NULL;

-- 6. Criar view unificada para dashboard
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
  s.signer_name,
  s.signer_email,
  s.signature_type,
  s.document_hash,
  s.signed_at AS signature_date,
  s.status AS signature_status
FROM documents d
LEFT JOIN signatures s ON d.id = s.document_id
ORDER BY d.created_at DESC;

-- 7. Criar função para obter documentos do usuário
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
$$ LANGUAGE plpgsql;

-- 8. Comentar tabelas e colunas
COMMENT ON COLUMN documents.document_type IS 'Tipo de assinatura: quick (rápida) ou advanced (avançada)';
COMMENT ON VIEW dashboard_documents IS 'View unificada para exibir todos os documentos no dashboard';
COMMENT ON FUNCTION get_user_documents IS 'Retorna todos os documentos de um usuário (rápidos e avançados)';

-- 9. Garantir RLS (Row Level Security) está habilitado
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- 10. Criar policies para documents se não existirem
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

-- 11. Criar policies para signatures
DROP POLICY IF EXISTS "Users can view own signatures" ON signatures;
CREATE POLICY "Users can view own signatures" 
  ON signatures FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own signatures" ON signatures;
CREATE POLICY "Users can insert own signatures" 
  ON signatures FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 12. Trigger para atualizar updated_at em documents
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

-- 13. Adicionar coluna updated_at se não existir
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 14. Criar função para buscar estatísticas
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_signature_stats IS 'Retorna estatísticas de assinaturas do usuário';

-- 15. Resultado
SELECT 'Migration concluída com sucesso! Sistemas de assinatura unificados.' AS status;
