# 🔍 DIAGNÓSTICO: PDF NÃO RECONHECIDO NO ADOBE

## 🚨 **PROBLEMA:**

"Ele continua sem reconhecer os documentos assinados"

**Sintomas:**
- ❌ PDF não mostra assinatura no Adobe Reader
- ❌ Painel de assinaturas vazio
- ❓ QR Code funciona?
- ❓ PDF baixa normalmente?

---

## 🔍 **DIAGNÓSTICO EM 4 PASSOS:**

### **PASSO 1: Verificar se Certificado Existe**

#### **No Supabase - SQL Editor:**

```sql
-- Verificar se certificado foi gerado
SELECT 
  id,
  serial_number,
  environment,
  is_active,
  valid_until,
  created_at,
  EXTRACT(DAY FROM (valid_until - now())) AS dias_restantes
FROM signflow_certificates
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;
```

#### **Resultados Possíveis:**

**✅ CASO 1: Retorna 1 linha**
```
id          | abc-123...
serial_number | 1234567890
environment | development
is_active   | true
valid_until | 2034-02-03
dias_restantes | 2920
```
→ **Certificado existe!** Próximo passo: verificar se está sendo usado.

---

**❌ CASO 2: Retorna 0 linhas (vazio)**

→ **Certificado NÃO foi gerado!**

**Solução:**

1. Verifique se migration de certificados foi aplicada:

```sql
-- Ver se tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'signflow_certificates';
```

Se retornar vazio, aplicar migration:
```bash
# Copie o conteúdo de:
# supabase/migrations/20260203_signflow_certificates.sql
# E execute no SQL Editor
```

2. Forçar geração do certificado (via API):

```bash
# Fazer qualquer assinatura para forçar geração
curl -X POST https://seu-dominio.vercel.app/api/sign/quick \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"document_base64":"...","document_name":"test.pdf"}'
```

---

### **PASSO 2: Verificar Logs do Vercel**

#### **No Vercel Dashboard:**

1. Acesse: https://vercel.com/seu-projeto
2. Functions > Logs
3. Filtrar por: `/api/sign` ou `/api/sign/quick`
4. Procurar por:

**✅ SUCESSO (deve aparecer):**
```
🔐 Aplicando assinatura digital PKI...
🏭 Usando certificado auto-gerenciado SignFlow...
✅ Certificado obtido: 1234567890
✅ PDF assinado com certificado SignFlow!
✅ Assinatura digital PKI aplicada com sucesso!
```

**❌ ERRO (não deve aparecer):**
```
⚠️ Erro ao aplicar assinatura digital PKI: ...
📝 Continuando sem assinatura PKI (apenas visual + QR Code)
```

Se aparecer erro, copie a mensagem completa!

---

### **PASSO 3: Baixar PDF e Verificar Estrutura**

#### **Via Linha de Comando (se tiver `pdfsig`):**

```bash
# Instalar pdfsig
# Ubuntu/Debian:
sudo apt install poppler-utils

# macOS:
brew install poppler

# Windows:
# Baixar de: https://github.com/oschwartz10612/poppler-windows/releases

# Verificar assinaturas no PDF
pdfsig documento-assinado.pdf
```

**✅ RESULTADO ESPERADO (com PKI):**
```
Digital Signature Info of: documento-assinado.pdf
Signature #1:
  - Signer Certificate Common Name: SignFlow Digital Platform
  - Signing Time: Feb 03 2026 20:58:23
  - Signature Validation: Signature is Valid.
  - Certificate Validation: Certificate issuer isn't Trusted.
```

**❌ RESULTADO SEM PKI:**
```
File does not contain any signatures
```

---

#### **Via Adobe Reader:**

1. Abrir PDF no Adobe Reader
2. Clicar no painel esquerdo: 🖋️ **Assinaturas**
3. Ver se lista aparece

**✅ COM PKI:**
- Lista mostra: "Assinado por: SignFlow Digital Platform"
- Status: ⚠️ "Não é possível verificar a identidade" (NORMAL para auto-assinado)

**❌ SEM PKI:**
- Painel vazio
- Sem lista de assinaturas

---

### **PASSO 4: Usar API de Verificação**

```bash
# Testar API de verificação
curl https://seu-dominio.vercel.app/api/verify-signature/<document-id>
```

**✅ COM PKI:**
```json
{
  "validation": {
    "status": "valid",
    "hasPKISignature": true,
    "signatureType": "both",
    "signatureCount": 1
  }
}
```

**❌ SEM PKI:**
```json
{
  "validation": {
    "status": "visual_only",
    "hasPKISignature": false,
    "signatureType": "visual_only",
    "signatureCount": 0
  }
}
```

---

## 💉 **SOLUÇÕES POR CENÁRIO:**

### **Cenário A: Certificado não existe no banco**

**Causa:** Migration de certificados não foi aplicada.

**Solução:**

1. Aplicar migration:

```sql
-- No Supabase SQL Editor, cole o conteúdo de:
-- supabase/migrations/20260203_signflow_certificates.sql
```

2. Forçar geração tentando assinar qualquer documento

3. Verificar novamente:

```sql
SELECT COUNT(*) FROM signflow_certificates WHERE is_active = true;
-- Deve retornar 1
```

---

### **Cenário B: Certificado existe mas não é usado**

**Causa:** Erro ao aplicar assinatura PKI no runtime.

**Solução:**

1. Verificar dependências instaladas:

```bash
# Verificar package.json
grep -E "@signpdf|node-forge" package.json
```

**Deve ter:**
```json
{
  "dependencies": {
    "@signpdf/signpdf": "^3.2.0",
    "@signpdf/signer-p12": "^3.2.0",
    "@signpdf/placeholder-plain": "^3.2.0",
    "node-forge": "^1.3.1"
  }
}
```

**Se faltar:**
```bash
npm install @signpdf/signpdf @signpdf/signer-p12 @signpdf/placeholder-plain node-forge
npm install -D @types/node-forge
git add package.json package-lock.json
git commit -m "fix: adiciona dependências de assinatura PKI"
vercel --prod
```

2. Verificar variáveis de ambiente no Vercel:

- `SUPABASE_URL` - deve estar configurada
- `SUPABASE_SERVICE_ROLE_KEY` - deve estar configurada
- `NEXT_PUBLIC_BASE_URL` - deve estar configurada

---

### **Cenário C: Erro de timeout/memória**

**Causa:** Geração de chave RSA 4096 bits demora muito.

**Solução:**

Reduzir tamanho da chave para 2048 bits (ainda seguro):

```typescript
// Em lib/certificateManager.ts
// Mudar de:
const keys = forge.pki.rsa.generateKeyPair({ bits: 4096 });

// Para:
const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
```

Depois:
```bash
git add lib/certificateManager.ts
git commit -m "fix: reduz tamanho de chave RSA para 2048 bits"
vercel --prod
```

---

### **Cenário D: Tudo configurado mas ainda não funciona**

**Causa:** Cache do Vercel ou problema de build.

**Solução:**

1. Limpar cache e fazer rebuild:

```bash
# Fazer deploy forçando rebuild
vercel --prod --force
```

2. Se ainda não funcionar, deletar e recriar certificado:

```sql
-- Deletar certificado atual
DELETE FROM signflow_certificates WHERE is_active = true;

-- Forçar geração de novo certificado
-- Faça uma nova assinatura
```

---

## 📝 **CHECKLIST DE VERIFICAÇÃO:**

### **Banco de Dados:**
- [ ] Tabela `signflow_certificates` existe
- [ ] Existe certificado ativo (`is_active = true`)
- [ ] Certificado tem `serial_number` preenchido
- [ ] Certificado tem `p12_base64` preenchido
- [ ] Certificado não expirou (`valid_until > now()`)

### **Dependências:**
- [ ] `@signpdf/signpdf` instalado
- [ ] `@signpdf/signer-p12` instalado
- [ ] `@signpdf/placeholder-plain` instalado
- [ ] `node-forge` instalado

### **Deploy:**
- [ ] Deploy no Vercel concluído
- [ ] Sem erros de build
- [ ] Variáveis de ambiente configuradas

### **Runtime:**
- [ ] Logs mostram "🔐 Aplicando assinatura digital PKI"
- [ ] Logs mostram "✅ Certificado obtido"
- [ ] Logs mostram "✅ PDF assinado com certificado SignFlow"
- [ ] Sem logs de erro "⚠️ Erro ao aplicar PKI"

### **PDF Final:**
- [ ] `pdfsig` mostra "Signature #1"
- [ ] Adobe Reader mostra painel de assinaturas
- [ ] API `/api/verify-signature` retorna `hasPKISignature: true`

---

## 📞 **ME ENVIE:**

Para eu te ajudar melhor, me envie:

1. **Resultado do PASSO 1** (SQL de verificação de certificado)
2. **Screenshot dos logs do Vercel** (filtrados por `/api/sign`)
3. **Resultado da API de verificação** (`/api/verify-signature/<id>`)
4. **Comportamento no Adobe Reader** (painel vazio ou com assinatura?)

Com essas informações consigo identificar exatamente onde está o problema!

---

## ⚡ **TESTE RÁPIDO:**

Execute este SQL agora:

```sql
-- Verificar se certificado existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ CERTIFICADO EXISTE'
    ELSE '❌ CERTIFICADO NÃO EXISTE - APLICAR MIGRATION!'
  END AS status
FROM signflow_certificates
WHERE is_active = true;
```

**Me diga o resultado!**
