-- Script completo para configurar tabela documents no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Criar a tabela se não existir (com estrutura básica)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar colunas uma por uma (ignora se já existir)
DO $$ 
BEGIN
  -- Colunas básicas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='original_pdf_name') THEN
    ALTER TABLE documents ADD COLUMN original_pdf_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='signed_pdf_url') THEN
    ALTER TABLE documents ADD COLUMN signed_pdf_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='qr_code_url') THEN
    ALTER TABLE documents ADD COLUMN qr_code_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='hash') THEN
    ALTER TABLE documents ADD COLUMN hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='status') THEN
    ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'signed';
  END IF;

  -- Assinatura
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='signature_type') THEN
    ALTER TABLE documents ADD COLUMN signature_type TEXT;
  END IF;

  -- Perfil
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='profile_type') THEN
    ALTER TABLE documents ADD COLUMN profile_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='profile_data') THEN
    ALTER TABLE documents ADD COLUMN profile_data JSONB;
  END IF;

  -- Signatários
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='signatories') THEN
    ALTER TABLE documents ADD COLUMN signatories JSONB;
  END IF;

  -- Certificado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='certificate_issuer') THEN
    ALTER TABLE documents ADD COLUMN certificate_issuer TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='certificate_valid_from') THEN
    ALTER TABLE documents ADD COLUMN certificate_valid_from TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='certificate_valid_until') THEN
    ALTER TABLE documents ADD COLUMN certificate_valid_until TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='certificate_logo_url') THEN
    ALTER TABLE documents ADD COLUMN certificate_logo_url TEXT;
  END IF;

  -- QR Code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='qr_position') THEN
    ALTER TABLE documents ADD COLUMN qr_position TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='qr_size') THEN
    ALTER TABLE documents ADD COLUMN qr_size TEXT;
  END IF;

  -- Validação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='require_validation_code') THEN
    ALTER TABLE documents ADD COLUMN require_validation_code BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='validation_code') THEN
    ALTER TABLE documents ADD COLUMN validation_code TEXT;
  END IF;

  -- Timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='signed_at') THEN
    ALTER TABLE documents ADD COLUMN signed_at TIMESTAMP DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='canceled_at') THEN
    ALTER TABLE documents ADD COLUMN canceled_at TIMESTAMP;
  END IF;
END $$;

-- 3. Criar índices para performance (ignora se já existir)
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 4. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
