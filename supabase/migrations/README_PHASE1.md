# 🚀 FASE 1: Sistema de Perfis para Certificados - CONCLUÍDA

## ✅ O que foi criado:

### 1. **Estrutura de Dados**
- ✅ Tabela `certificate_profiles` (perfis de usuário)
- ✅ Atualizações na tabela `certificates`
- ✅ Tipos TypeScript completos

### 2. **Recursos Implementados**

#### **Tabela `certificate_profiles`:**
```sql
- id (UUID, PK)
- user_id (FK → auth.users)
- profile_name ("Dr. João Silva - CRM 12345")
- profile_type (professional, personal, student, legal_representative, corporate)
- cpf_cnpj
- organization ("Hospital São Lucas")
- registration_number (CRM, OAB, CREA)
- is_default (apenas 1 perfil padrão por usuário)
- is_active
- metadata (JSONB flexível)
- created_at, updated_at
```

#### **Tabela `certificates` (atualizada):**
```sql
+ profile_id (FK → certificate_profiles)
+ generation_method ('uploaded' ou 'auto_generated')
+ key_strength (2048 ou 4096 bits)
+ issuer ('SignFlow CA', 'ICP-Brasil', etc.)
+ subject_data (JSONB com dados do titular)
```

#### **Segurança:**
- ✅ Row Level Security (RLS) ativado
- ✅ Políticas: usuários só veem seus próprios perfis
- ✅ Trigger: garante apenas 1 perfil padrão por usuário

---

## 🛠️ Como Aplicar a Migration:

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo de `20260203_certificate_profiles.sql`
5. Cole no editor e clique em **RUN**
6. Verifique se apareceu "Success. No rows returned"

### **Opção 2: Via Supabase CLI (Local)**

```bash
# 1. Instalar Supabase CLI (se ainda não tem)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Linkar com seu projeto
supabase link --project-ref YOUR_PROJECT_REF

# 4. Aplicar a migration
supabase db push
```

### **Opção 3: Executar SQL Manualmente**

Se preferir, pode executar linha por linha no SQL Editor do Supabase.

---

## ✅ Como Verificar se Funcionou:

### **1. Verificar se as tabelas foram criadas:**

```sql
-- Deve retornar a estrutura da tabela
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'certificate_profiles';

-- Deve retornar as novas colunas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'certificates' 
AND column_name IN ('profile_id', 'generation_method', 'key_strength', 'issuer', 'subject_data');
```

### **2. Testar RLS Policies:**

```sql
-- Deve retornar as políticas criadas
SELECT * FROM pg_policies 
WHERE tablename = 'certificate_profiles';
```

### **3. Testar inserção de perfil:**

```sql
-- Inserir um perfil de teste (substitua USER_ID pelo seu)
INSERT INTO certificate_profiles (
  user_id,
  profile_name,
  profile_type,
  cpf_cnpj,
  is_default
) VALUES (
  'SEU_USER_ID_AQUI',
  'Dr. João Silva - CRM 12345',
  'professional',
  '123.456.789-00',
  true
);

-- Verificar se foi criado
SELECT * FROM certificate_profiles;
```

---

## 📄 Tipos TypeScript Criados:

Arquivo: `types/certificates.ts`

```typescript
import { 
  CertificateProfile,
  ProfileType,
  GenerationMethod,
  KeyStrength,
  PROFILE_TYPE_OPTIONS 
} from '@/types/certificates'
```

**Tipos disponíveis:**
- `CertificateProfile` - Estrutura do perfil
- `Certificate` - Estrutura do certificado (atualizada)
- `CreateProfilePayload` - Payload para criar perfil
- `GenerateCertificatePayload` - Payload para gerar certificado
- `PROFILE_TYPE_OPTIONS` - Opções para dropdown de tipos

---

## 👀 Próximos Passos (FASE 2):

⬜ **API de Geração de Certificados:**
- `POST /api/certificates/generate` - Gera certificado auto-assinado
- Criação de par RSA (2048/4096 bits)
- Geração de X.509 self-signed
- Empacotamento em PKCS#12 (.p12)

⬜ **API de Perfis:**
- `POST /api/profiles/create` - Criar perfil
- `GET /api/profiles/list` - Listar perfis do usuário
- `PUT /api/profiles/update` - Atualizar perfil
- `DELETE /api/profiles/delete` - Deletar perfil

---

## 📝 Checklist de Verificação:

- [ ] Migration aplicada com sucesso
- [ ] Tabela `certificate_profiles` existe
- [ ] Tabela `certificates` tem novas colunas
- [ ] RLS policies funcionando
- [ ] Trigger de perfil padrão ativo
- [ ] Tipos TypeScript sem erros

---

## ❓ Problemas Comuns:

### **Erro: "relation already exists"**
→ A migration já foi aplicada antes. Tudo certo!

### **Erro: "column already exists"**
→ As colunas já foram adicionadas. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

### **Erro de permissão**
→ Verifique se você é owner do projeto no Supabase

---

## 💬 Suporte:

Se tiver dúvidas, abra uma issue ou consulte:
- [Supabase Docs - Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
