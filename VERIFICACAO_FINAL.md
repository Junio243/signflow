# ✅ VERIFICAÇÃO FINAL DA MIGRATION

## 📊 STATUS ATUAL:

### ✅ **Tabela `documents` - OK!**

Colunas confirmadas:
- ✅ `document_type` (adicionada)
- ✅ `updated_at` (adicionada)
- ✅ Todas as outras colunas existentes

---

## 🔍 **PRÓXIMO PASSO: VERIFICAR `signatures`**

### **Execute este SQL no Supabase:**

```sql
-- Verificar estrutura da tabela signatures
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'signatures'
ORDER BY ordinal_position;
```

### **Resultado esperado (DEVE TER):**

```
column_name       | data_type                | is_nullable
------------------|--------------------------|------------
id                | uuid                     | NO
user_id           | uuid                     | YES
document_id       | uuid                     | YES          <-- ESSENCIAL!
signer_name       | text                     | YES
signer_email      | text                     | YES
signature_type    | text                     | YES
document_hash     | text                     | YES
signature_data    | jsonb                    | YES
signed_at         | timestamp with time zone | YES
status            | text                     | YES
created_at        | timestamp with time zone | YES
```

---

## ⚠️ **SE `document_id` NÃO APARECER:**

Execute este SQL para corrigir:

```sql
-- Adicionar coluna document_id
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS document_id UUID;

-- Adicionar outras colunas essenciais
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signer_name TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signer_email TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signature_type TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS document_hash TEXT;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signature_data JSONB;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Criar FK
ALTER TABLE signatures DROP CONSTRAINT IF EXISTS signatures_document_id_fkey;
ALTER TABLE signatures 
  ADD CONSTRAINT signatures_document_id_fkey 
  FOREIGN KEY (document_id) 
  REFERENCES documents(id) 
  ON DELETE CASCADE;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);

SELECT 'Tabela signatures corrigida!' AS status;
```

---

## ✅ **DEPOIS DE CONFIRMAR `signatures`:**

### **1. Verificar View**

```sql
-- Testar view
SELECT * FROM dashboard_documents LIMIT 1;
```

**Se der erro:** A view não foi criada. Execute:

```sql
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
```

---

### **2. Verificar Função**

```sql
-- Testar função (substitua pelo seu user_id)
SELECT * FROM get_user_documents('seu-user-id-aqui');
```

**Se der erro:** Execute:

```sql
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
```

---

## 🚀 **CHECKLIST FINAL:**

### **Banco de Dados:**
- [x] Tabela `documents` tem coluna `document_type`
- [x] Tabela `documents` tem coluna `updated_at`
- [ ] Tabela `signatures` tem coluna `document_id` ← **VERIFICAR AGORA**
- [ ] Tabela `signatures` tem coluna `document_hash`
- [ ] View `dashboard_documents` existe
- [ ] Função `get_user_documents` existe

### **Código:**
- [ ] Deploy no Vercel (`vercel --prod`)
- [ ] Frontend atualizado para `/api/sign/quick`
- [ ] Dashboard usando `dashboard_documents`

### **Testes:**
- [ ] Assinatura rápida sem erro
- [ ] QR Code gerado
- [ ] Histórico mostra documentos

---

## 👁️ **O QUE FAZER AGORA:**

1. **Execute o SQL de verificação da tabela `signatures`** (acima)
2. **Me envie o resultado**
3. Se `document_id` não existir, execute o SQL de correção
4. Depois confirmo que está tudo OK
5. Aí fazemos o deploy!

---

## 📝 **COMANDO RÁPIDO:**

Copie e cole no SQL Editor:

```sql
-- VER ESTRUTURA DE SIGNATURES
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'signatures' 
  AND column_name IN ('id', 'user_id', 'document_id', 'signer_name', 'document_hash', 'signature_type')
ORDER BY column_name;

-- Resultado esperado: 6 linhas
-- Se retornar menos de 6, falta coluna!
```

**Me envie quantas linhas retornaram!**
