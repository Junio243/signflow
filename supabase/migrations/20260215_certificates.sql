-- Tabela de Certificados Digitais
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação do Certificado
  certificate_type VARCHAR(10) NOT NULL CHECK (certificate_type IN ('e-CPF', 'e-CNPJ')),
  serial_number VARCHAR(64) UNIQUE NOT NULL,
  
  -- Dados do Titular (armazenados como JSONB para flexibilidade)
  subject_data JSONB NOT NULL,
  /* Estrutura do subject_data:
   * Para e-CPF:
   * {
   *   "fullName": "Alexandre Junio Canuto Lopes",
   *   "cpf": "12345678901",
   *   "rg": "123456789",
   *   "birthDate": "1990-01-15",
   *   "email": "alexandre@exemplo.com",
   *   "phone": "(11) 98888-7777",
   *   "mobile": "(11) 98888-7777",
   *   "address": {
   *     "cep": "01310-100",
   *     "street": "Avenida Paulista",
   *     "number": "1578",
   *     "complement": "Apto 101",
   *     "neighborhood": "Bela Vista",
   *     "city": "São Paulo",
   *     "state": "SP"
   *   },
   *   "profession": "Advogado",
   *   "professionalRegistry": "OAB/SP 123456",
   *   "council": "OAB-SP"
   * }
   * 
   * Para e-CNPJ:
   * {
   *   "companyName": "Empresa ABC Ltda",
   *   "tradeName": "ABC Tecnologia",
   *   "cnpj": "12345678000190",
   *   "stateRegistration": "123456789",
   *   "municipalRegistration": "987654",
   *   "legalRepresentative": {
   *     "fullName": "Alexandre Junio Canuto Lopes",
   *     "cpf": "12345678901",
   *     "role": "Diretor",
   *     "email": "alexandre@empresa.com"
   *   },
   *   "address": {
   *     "cep": "01310-100",
   *     "street": "Avenida Paulista",
   *     "number": "1578",
   *     "complement": "Sala 20",
   *     "neighborhood": "Bela Vista",
   *     "city": "São Paulo",
   *     "state": "SP"
   *   },
   *   "businessPhone": "(11) 3333-4444",
   *   "businessEmail": "contato@empresa.com"
   * }
   */
  
  -- Dados Técnicos do Certificado
  public_key TEXT NOT NULL,
  certificate_pem TEXT NOT NULL, -- Certificado completo em formato PEM
  fingerprint_sha256 VARCHAR(64) NOT NULL, -- Hash SHA-256 do certificado
  
  -- Período de Validade
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Status do Certificado
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Metadados Técnicos
  algorithm VARCHAR(50) DEFAULT 'RSA-2048', -- RSA-2048, RSA-4096
  issuer VARCHAR(255) DEFAULT 'SignFlow CA',
  key_usage VARCHAR(255) DEFAULT 'Digital Signature, Non-Repudiation',
  extended_key_usage VARCHAR(255) DEFAULT 'Email Protection, Document Signing',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_serial_number ON certificates(serial_number);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_valid_until ON certificates(valid_until);
CREATE INDEX idx_certificates_type ON certificates(certificate_type);
CREATE INDEX idx_certificates_fingerprint ON certificates(fingerprint_sha256);

-- Índice GIN para busca eficiente em subject_data
CREATE INDEX idx_certificates_subject_data ON certificates USING GIN (subject_data);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- Função para atualizar status de certificados expirados
CREATE OR REPLACE FUNCTION update_expired_certificates()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE certificates
  SET status = 'expired'
  WHERE status = 'active'
    AND valid_until < NOW();
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Função para revogar certificado
CREATE OR REPLACE FUNCTION revoke_certificate(
  p_certificate_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'User requested revocation'
)
RETURNS BOOLEAN AS $$
DECLARE
  cert_exists BOOLEAN;
BEGIN
  -- Verificar se certificado existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM certificates
    WHERE id = p_certificate_id
      AND user_id = p_user_id
      AND status = 'active'
  ) INTO cert_exists;
  
  IF NOT cert_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Revogar certificado
  UPDATE certificates
  SET 
    status = 'revoked',
    revoked_at = NOW(),
    revocation_reason = p_reason
  WHERE id = p_certificate_id
    AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar certificados do usuário
CREATE OR REPLACE FUNCTION get_user_certificates(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  certificate_type VARCHAR(10),
  serial_number VARCHAR(64),
  subject_name TEXT,
  subject_document TEXT, -- CPF ou CNPJ (mascarado)
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status VARCHAR(20),
  days_until_expiry INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.certificate_type,
    c.serial_number,
    CASE 
      WHEN c.certificate_type = 'e-CPF' THEN c.subject_data->>'fullName'
      WHEN c.certificate_type = 'e-CNPJ' THEN c.subject_data->>'companyName'
      ELSE 'Unknown'
    END AS subject_name,
    CASE 
      WHEN c.certificate_type = 'e-CPF' THEN 
        '***' || SUBSTRING(c.subject_data->>'cpf' FROM 4 FOR 6) || '-**'
      WHEN c.certificate_type = 'e-CNPJ' THEN
        '**.***.***/' || SUBSTRING(c.subject_data->>'cnpj' FROM 9 FOR 4) || '-**'
      ELSE 'N/A'
    END AS subject_document,
    c.valid_from,
    c.valid_until,
    c.status,
    EXTRACT(DAY FROM (c.valid_until - NOW()))::INTEGER AS days_until_expiry,
    c.created_at
  FROM certificates c
  WHERE c.user_id = p_user_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios certificados
CREATE POLICY "Users can view their own certificates"
  ON certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios certificados
CREATE POLICY "Users can create their own certificates"
  ON certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios certificados
CREATE POLICY "Users can update their own certificates"
  ON certificates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios certificados
CREATE POLICY "Users can delete their own certificates"
  ON certificates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários nas colunas para documentação
COMMENT ON TABLE certificates IS 'Certificados digitais auto-gerados pelos usuários (e-CPF e e-CNPJ)';
COMMENT ON COLUMN certificates.certificate_type IS 'Tipo de certificado: e-CPF (Pessoa Física) ou e-CNPJ (Pessoa Jurídica)';
COMMENT ON COLUMN certificates.serial_number IS 'Número de série único do certificado (UUID formatado)';
COMMENT ON COLUMN certificates.subject_data IS 'Dados do titular do certificado (JSONB flexível por tipo)';
COMMENT ON COLUMN certificates.public_key IS 'Chave pública em formato PEM';
COMMENT ON COLUMN certificates.certificate_pem IS 'Certificado completo em formato PEM (X.509)';
COMMENT ON COLUMN certificates.fingerprint_sha256 IS 'Impressão digital SHA-256 do certificado (identificação única)';
COMMENT ON COLUMN certificates.status IS 'Status: active (ativo), revoked (revogado), expired (expirado)';

-- View para estatísticas de certificados
CREATE OR REPLACE VIEW certificates_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_certificates,
  COUNT(*) FILTER (WHERE status = 'active') AS active_certificates,
  COUNT(*) FILTER (WHERE status = 'revoked') AS revoked_certificates,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired_certificates,
  COUNT(*) FILTER (WHERE certificate_type = 'e-CPF') AS ecpf_certificates,
  COUNT(*) FILTER (WHERE certificate_type = 'e-CNPJ') AS ecnpj_certificates,
  MIN(created_at) AS first_certificate_date,
  MAX(created_at) AS latest_certificate_date
FROM certificates
GROUP BY user_id;

COMMENT ON VIEW certificates_stats IS 'Estatísticas de certificados por usuário';
