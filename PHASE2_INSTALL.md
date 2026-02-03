# 🛠️ FASE 2: Instalação e Configuração

## ✅ APIs Criadas:

1. **POST** `/api/profiles/create` - Criar perfil de certificado
2. **GET** `/api/profiles/list` - Listar perfis do usuário
3. **POST** `/api/certificates/generate` - Gerar certificado auto-assinado

---

## 📝 Passos de Instalação:

### **1. Instalar tipos do node-forge**

```bash
npm install --save-dev @types/node-forge
```

### **2. Adicionar variável de ambiente**

Adicione no arquivo `.env.local`:

```bash
# Chave para criptografar senhas de certificados (AES-256)
CERTIFICATE_ENCRYPTION_KEY=sua-chave-super-secreta-aqui-minimo-32-caracteres
```

**IMPORTANTE:** Use uma chave forte! Exemplo de geração:

```bash
# No terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **3. Criar bucket no Supabase Storage**

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/storage
2. Clique em **"New bucket"**
3. Nome: `certificates`
4. **Público:** DESMARCAR (deve ser privado)
5. Clique em **"Create bucket"**

### **4. Configurar RLS no bucket**

No SQL Editor do Supabase, execute:

```sql
-- Políticas de Storage para bucket 'certificates'
-- Usuários só podem fazer upload/download de seus próprios certificados

CREATE POLICY "Users can upload their own certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own certificates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🧪 Testar as APIs:

### **1. Criar um perfil:**

```bash
curl -X POST http://localhost:3000/api/profiles/create \
  -H "Content-Type: application/json" \
  -d '{
    "profile_name": "Dr. João Silva - CRM 12345",
    "profile_type": "professional",
    "cpf_cnpj": "123.456.789-00",
    "organization": "Hospital São Lucas",
    "registration_number": "CRM/SP 12345",
    "is_default": true
  }'
```

### **2. Listar perfis:**

```bash
curl http://localhost:3000/api/profiles/list
```

### **3. Gerar certificado auto-assinado:**

```bash
curl -X POST http://localhost:3000/api/certificates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "SEU_PROFILE_ID_AQUI",
    "certificate_name": "Certificado Dr. João Silva 2026",
    "password": "senha-super-segura-123",
    "key_strength": 2048,
    "validity_years": 5,
    "subject_data": {
      "commonName": "Dr. João Silva",
      "organizationName": "Hospital São Lucas",
      "locality": "São Paulo",
      "state": "SP",
      "country": "BR"
    }
  }'
```

---

## ✅ Verificar se funcionou:

### **1. Verificar bucket no Supabase:**
- Acesse: Storage > certificates
- Deve aparecer uma pasta com seu `user_id`
- Dentro dela, o arquivo `.p12` gerado

### **2. Verificar no banco:**

```sql
SELECT 
  c.id,
  c.certificate_name,
  c.generation_method,
  c.key_strength,
  c.is_active,
  c.expires_at,
  p.profile_name
FROM certificates c
LEFT JOIN certificate_profiles p ON c.profile_id = p.id
ORDER BY c.created_at DESC;
```

---

## 📊 Especificações Técnicas:

### **Certificado X.509 Gerado:**

- **Algoritmo:** RSA (2048 ou 4096 bits)
- **Hash:** SHA-256
- **Validade:** Customizável (1 a 10 anos)
- **Tipo:** Auto-assinado (self-signed)
- **Formato:** PKCS#12 (.p12)
- **Extensões:**
  - `basicConstraints`: CA=false
  - `keyUsage`: digitalSignature, nonRepudiation, keyEncipherment
  - `extKeyUsage`: clientAuth, emailProtection
  - `subjectKeyIdentifier`

### **Segurança:**

- ✅ Chave privada protegida por senha
- ✅ Senha criptografada com AES-256-CBC
- ✅ Storage privado (RLS habilitado)
- ✅ Apenas owner pode acessar seus certificados
- ✅ IV (Initialization Vector) aleatório para cada senha

---

## 🚀 Próximos Passos (FASE 3):

⬜ **Interface de Geração:**
- Formulário visual para criar perfis
- Formulário visual para gerar certificados
- Preview do certificado antes de gerar
- Download do arquivo .p12

⬜ **Integração com Assinatura:**
- Seletor de certificado na hora de assinar
- Descriptografia da chave privada
- Assinatura PAdES com certificado auto-gerado

---

## ❓ Troubleshooting:

### **Erro: "CERTIFICATE_ENCRYPTION_KEY não configurada"**
→ Adicione a variável no `.env.local`

### **Erro: "Failed to create bucket"**
→ Verifique se você é admin do projeto no Supabase

### **Erro: "Policy violation"**
→ Execute as políticas RLS do bucket no SQL Editor

### **Certificado gerado mas não aparece no Storage**
→ Verifique as permissões do bucket (deve ser privado com RLS)

---

## 📝 Checklist:

- [ ] `@types/node-forge` instalado
- [ ] `CERTIFICATE_ENCRYPTION_KEY` configurada no `.env.local`
- [ ] Bucket `certificates` criado no Supabase
- [ ] Políticas RLS do bucket aplicadas
- [ ] APIs testadas e funcionando
- [ ] Certificado gerado com sucesso
- [ ] Arquivo .p12 visível no Storage

---

## 💬 Suporte:

Se tiver dúvidas:
- [node-forge Documentation](https://github.com/digitalbazaar/forge)
- [PKCS#12 Format](https://en.wikipedia.org/wiki/PKCS_12)
- [X.509 Certificates](https://en.wikipedia.org/wiki/X.509)
