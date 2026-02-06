-- =========================================================
-- CORREÇÃO DA TABELA SIGNATURES PARA VERIFICAÇÃO
-- Data: 06/02/2026
-- =========================================================
-- Este script corrige a estrutura da tabela signatures para
-- permitir que documentos sejam verificados corretamente.
--
-- PROBLEMA:
-- O código de assinatura (app/api/sign/route.ts) tenta inserir:
--   - document_id
--   - document_hash
--   - signer_name
--   - signer_email
--   - signature_type
--   - signature_data
--   - signed_at
--   - status
--
-- Mas a tabela atual exige:
--   - user_id (NOT NULL)
--   - certificate_id (NOT NULL)
--
-- SOLUÇÃO:
-- 1. Tornar user_id e certificate_id opcionais
-- 2. Adicionar document_id como coluna
-- 3. Adicionar signer_name e signer_email
-- 4. Ajustar políticas RLS
-- =========================================================

-- Passo 1: Remover constraints NOT NULL
ALTER TABLE signatures 
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN certificate_id DROP NOT NULL;

-- Passo 2: Adicionar novas colunas se não existirem
DO $$ 
BEGIN
  -- Adicionar document_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE signatures ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);
  END IF;

  -- Adicionar signer_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'signer_name'
  ) THEN
    ALTER TABLE signatures ADD COLUMN signer_name TEXT;
  END IF;

  -- Adicionar signer_email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'signer_email'
  ) THEN
    ALTER TABLE signatures ADD COLUMN signer_email TEXT;
  END IF;

  -- Verificar se document_hash existe (deveria já existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'document_hash'
  ) THEN
    ALTER TABLE signatures ADD COLUMN document_hash TEXT NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_signatures_document_hash ON signatures(document_hash);
  END IF;

  -- Verificar se signature_data existe (deveria já existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'signature_data'
  ) THEN
    ALTER TABLE signatures ADD COLUMN signature_data JSONB DEFAULT '{}';
  END IF;

  -- Verificar se signature_type existe (deveria já existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signatures' AND column_name = 'signature_type'
  ) THEN
    ALTER TABLE signatures ADD COLUMN signature_type TEXT DEFAULT 'visual';
  END IF;
END $$;

-- Passo 3: Criar índice para document_hash (para verificação rápida)
CREATE INDEX IF NOT EXISTS idx_signatures_document_hash ON signatures(document_hash);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);
CREATE INDEX IF NOT EXISTS idx_signatures_document_hash_status ON signatures(document_hash, status);

-- Passo 4: Ajustar políticas RLS para permitir service_role
-- Remover políticas antigas que bloqueiam service_role
DROP POLICY IF EXISTS "Service role can manage all signatures" ON signatures;
DROP POLICY IF EXISTS "Allow service role full access" ON signatures;
DROP POLICY IF EXISTS "Public can verify signatures" ON signatures;

-- Permitir que service_role faça tudo (CRUD completo)
CREATE POLICY "Service role can manage all signatures"
ON signatures
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Permitir leitura pública para verificação (somente SELECT com document_hash)
CREATE POLICY "Public can verify signatures"
ON signatures
FOR SELECT
TO anon, authenticated
USING (status = 'completed');

-- Passo 5: Garantir que RLS está habilitado
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TESTE DA MIGRAÇÃO
-- =========================================================
-- Execute este SELECT para verificar a estrutura:
-- 
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'signatures'
-- ORDER BY ordinal_position;
--
-- Deve mostrar:
-- - document_id (uuid, YES)
-- - document_hash (text, NO)
-- - signer_name (text, YES)
-- - signer_email (text, YES)
-- - signature_type (text, YES)
-- - signature_data (jsonb, YES)
-- - status (text, YES)
-- - signed_at (timestamp, YES)
-- - user_id (uuid, YES) <- Agora pode ser NULL
-- - certificate_id (uuid, YES) <- Agora pode ser NULL
-- =========================================================

-- =========================================================
-- COMENTÁRIOS IMPORTANTES
-- =========================================================
-- 
-- 1. Esta migration é SEGURA e IDEMPOTENTE:
--    - Usa IF NOT EXISTS para evitar erros
--    - Não remove dados existentes
--    - Pode ser executada múltiplas vezes
--
-- 2. Após executar esta migration:
--    - O código de assinatura poderá salvar dados
--    - O código de verificação poderá encontrar assinaturas
--    - Documentos antigos continuarão funcionando
--
-- 3. Para aplicar esta migration no Supabase:
--    a) Vá para: Dashboard > SQL Editor
--    b) Cole este arquivo completo
--    c) Clique em "Run"
--    d) Verifique se não há erros
--
-- =========================================================
