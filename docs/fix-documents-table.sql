-- Migration para corrigir tabela documents
-- Execute no SQL Editor do Supabase Dashboard

-- =============================================
-- ATENÇÃO: Execute este script no Supabase!
-- =============================================

-- 1. Adicionar coluna user_id (referência ao usuário)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='user_id') THEN
    ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Coluna user_id adicionada';
  ELSE
    RAISE NOTICE 'Coluna user_id já existe';
  END IF;
END $$;

-- 2. Adicionar coluna signed_pdf_path (caminho no storage)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='signed_pdf_path') THEN
    ALTER TABLE documents ADD COLUMN signed_pdf_path TEXT;
    RAISE NOTICE 'Coluna signed_pdf_path adicionada';
  ELSE
    RAISE NOTICE 'Coluna signed_pdf_path já existe';
  END IF;
END $$;

-- 3. Adicionar coluna metadata (JSONB - configurações e dados da assinatura)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='metadata') THEN
    ALTER TABLE documents ADD COLUMN metadata JSONB;
    RAISE NOTICE 'Coluna metadata adicionada';
  ELSE
    RAISE NOTICE 'Coluna metadata já existe';
  END IF;
END $$;

-- 4. Adicionar coluna validation_theme_snapshot (JSONB - tema de validação)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='validation_theme_snapshot') THEN
    ALTER TABLE documents ADD COLUMN validation_theme_snapshot JSONB;
    RAISE NOTICE 'Coluna validation_theme_snapshot adicionada';
  ELSE
    RAISE NOTICE 'Coluna validation_theme_snapshot já existe';
  END IF;
END $$;

-- 5. Criar índice para user_id (performance)
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- 6. Criar índice para metadata (busca em JSON)
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);

-- 7. Criar índice para validation_theme_snapshot (busca em JSON)
CREATE INDEX IF NOT EXISTS idx_documents_validation_theme ON documents USING gin(validation_theme_snapshot);

-- 8. Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  CASE 
    WHEN column_name IN ('user_id', 'signed_pdf_path', 'metadata', 'validation_theme_snapshot') 
    THEN '✅ NOVA'
    ELSE ''
  END as status
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 9. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📋 Tabela documents agora possui todas as colunas necessárias';
  RAISE NOTICE '🚀 Você pode assinar documentos normalmente agora';
END $$;
