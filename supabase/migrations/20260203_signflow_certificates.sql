-- Tabela para armazenar certificados digitais gerados pelo SignFlow
-- Cada ambiente (development, production, etc.) terá seu próprio certificado

CREATE TABLE IF NOT EXISTS signflow_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do certificado
  certificate_pem TEXT NOT NULL,
  private_key_pem TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  p12_base64 TEXT NOT NULL,
  
  -- Metadados
  serial_number TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL DEFAULT 'SignFlow Digital Platform',
  subject TEXT NOT NULL DEFAULT 'SignFlow Digital Platform',
  
  -- Validade
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Ambiente
  environment TEXT NOT NULL DEFAULT 'development',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_signflow_certificates_environment 
  ON signflow_certificates(environment);

CREATE INDEX IF NOT EXISTS idx_signflow_certificates_active 
  ON signflow_certificates(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_signflow_certificates_validity 
  ON signflow_certificates(valid_until);

CREATE INDEX IF NOT EXISTS idx_signflow_certificates_env_active 
  ON signflow_certificates(environment, is_active) 
  WHERE is_active = true;

-- Índice único para garantir apenas um certificado ativo por ambiente
CREATE UNIQUE INDEX IF NOT EXISTS idx_signflow_certificates_active_per_env 
  ON signflow_certificates(environment) 
  WHERE is_active = true;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_signflow_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_signflow_certificates_updated_at ON signflow_certificates;
CREATE TRIGGER trigger_update_signflow_certificates_updated_at
  BEFORE UPDATE ON signflow_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_signflow_certificates_updated_at();

-- Trigger para desativar certificados antigos ao ativar novo
CREATE OR REPLACE FUNCTION deactivate_old_certificates()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está ativando um certificado
  IF NEW.is_active = true THEN
    -- Desativar todos os outros certificados ativos do mesmo ambiente
    UPDATE signflow_certificates
    SET is_active = false
    WHERE environment = NEW.environment
      AND id != NEW.id
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deactivate_old_certificates ON signflow_certificates;
CREATE TRIGGER trigger_deactivate_old_certificates
  BEFORE INSERT OR UPDATE ON signflow_certificates
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_old_certificates();

-- View para certificados válidos
CREATE OR REPLACE VIEW signflow_certificates_valid AS
SELECT 
  id,
  serial_number,
  issuer,
  subject,
  valid_from,
  valid_until,
  environment,
  is_active,
  created_at,
  EXTRACT(DAY FROM (valid_until - now())) AS days_until_expiry,
  CASE 
    WHEN valid_until < now() THEN 'expired'
    WHEN valid_until < (now() + interval '30 days') THEN 'expiring_soon'
    ELSE 'valid'
  END AS validity_status
FROM signflow_certificates
WHERE is_active = true
  AND valid_until > now()
ORDER BY environment, created_at DESC;

-- Comentários
COMMENT ON TABLE signflow_certificates IS 'Armazena certificados digitais auto-gerados pelo SignFlow para assinatura de PDFs';
COMMENT ON COLUMN signflow_certificates.certificate_pem IS 'Certificado público em formato PEM';
COMMENT ON COLUMN signflow_certificates.private_key_pem IS 'Chave privada em formato PEM (CRIPTOGRAFADA)';
COMMENT ON COLUMN signflow_certificates.p12_base64 IS 'Certificado PKCS#12 em base64 para uso direto';
COMMENT ON COLUMN signflow_certificates.serial_number IS 'Número de série único do certificado';
COMMENT ON COLUMN signflow_certificates.environment IS 'Ambiente do certificado (development, production, staging, etc.)';
COMMENT ON COLUMN signflow_certificates.is_active IS 'Indica se este é o certificado ativo para o ambiente';

-- Permissões (ajustar conforme RLS)
-- IMPORTANTE: A chave privada deve ser protegida!
-- Em produção, considere usar Row Level Security (RLS)

-- Exemplo de RLS (descomente e ajuste conforme necessário):
-- ALTER TABLE signflow_certificates ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Apenas leitura de certificados ativos" ON signflow_certificates
--   FOR SELECT
--   USING (is_active = true);

-- CREATE POLICY "Apenas serviço pode escrever" ON signflow_certificates
--   FOR INSERT
--   WITH CHECK (auth.role() = 'service_role');

-- Função helper para obter certificado ativo de um ambiente
CREATE OR REPLACE FUNCTION get_active_certificate(env TEXT DEFAULT 'development')
RETURNS TABLE (
  id UUID,
  serial_number TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  days_until_expiry NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.serial_number,
    sc.valid_from,
    sc.valid_until,
    EXTRACT(DAY FROM (sc.valid_until - now())) AS days_until_expiry
  FROM signflow_certificates sc
  WHERE sc.environment = env
    AND sc.is_active = true
    AND sc.valid_until > now()
  ORDER BY sc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para listar certificados próximos do vencimento
CREATE OR REPLACE FUNCTION get_expiring_certificates(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  environment TEXT,
  serial_number TEXT,
  valid_until TIMESTAMPTZ,
  days_until_expiry NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.environment,
    sc.serial_number,
    sc.valid_until,
    EXTRACT(DAY FROM (sc.valid_until - now())) AS days_until_expiry
  FROM signflow_certificates sc
  WHERE sc.is_active = true
    AND sc.valid_until > now()
    AND sc.valid_until < (now() + (days_threshold || ' days')::interval)
  ORDER BY sc.valid_until ASC;
END;
$$ LANGUAGE plpgsql;

-- Inserir certificado inicial (opcional - será gerado automaticamente pelo sistema)
-- O sistema gerará automaticamente na primeira execução se não existir
