# 🔍 GUIA DE DIAGNÓSTICO: ASSINATURA DIGITAL PKI

## 🎯 **PROBLEMA ATUAL**

O SignFlow **NÃO ESTÁ APLICANDO** assinatura digital PKI reconhecida por leitores de PDF (Adobe, Foxit, etc.).

### **Sintomas:**
- ❌ PDF não mostra assinatura no Adobe Reader
- ❌ Foxit Reader não reconhece assinatura
- ❌ Painel de "Assinaturas" vazio
- ✅ QR Code funciona
- ✅ Assinatura visual aparece
- ✅ Texto "Assinado digitalmente por:" presente

---

## 🛠️ **DIAGNÓSTICO EM 3 PASSOS**

### **Passo 1: Verificar se Migration foi Aplicada**

```bash
# Conectar no Supabase e verificar se tabela existe
psql -h <seu-host> -U postgres -d postgres

# Dentro do psql:
\dt signflow_certificates
```

**Resultado esperado:**
```
              List of relations
 Schema |         Name         | Type  |  Owner   
--------+----------------------+-------+----------
 public | signflow_certificates | table | postgres
```

❌ **Se não aparecer:**
```bash
# Aplicar migration
supabase db push

# OU via Dashboard:
# 1. Acesse https://app.supabase.com
# 2. SQL Editor
# 3. Execute o conteúdo de: supabase/migrations/20260203_signflow_certificates.sql
```

---

### **Passo 2: Testar Verificação de Assinatura**

Depois de fazer deploy, teste a API:

```bash
# Substitua <document-id> pelo ID de um documento assinado
curl https://seu-dominio.vercel.app/api/verify-signature/<document-id>
```

**Resultado esperado (com PKI):**
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

❌ **Se retornar `"signatureType": "visual_only"` ou `"hasPKISignature": false`**:

**Isso significa que o certificado NÃO foi gerado/aplicado!**

---

### **Passo 3: Verificar Logs do Servidor**

No Vercel Dashboard:

1. Acesse **Functions** > **Logs**
2. Filtre por `/api/sign`
3. Procure por:

✅ **Sucesso (deve aparecer):**
```
🔐 Aplicando assinatura digital PKI...
🏭 Usando certificado auto-gerenciado SignFlow...
✅ Certificado obtido: <serial_number>
✅ PDF assinado com certificado SignFlow!
✅ Assinatura digital PKI aplicada com sucesso!
```

❌ **Erro (não deve aparecer):**
```
⚠️ Erro ao aplicar assinatura digital PKI: <erro>
📝 Continuando sem assinatura PKI (apenas visual + QR Code)
```

---

## 💉 **SOLUÇÕES POR CENÁRIO**

### **Cenário A: Tabela não existe**

```bash
# Via Supabase CLI
supabase db push

# Via SQL Editor no Dashboard
# Copie e execute: supabase/migrations/20260203_signflow_certificates.sql
```

### **Cenário B: Erro ao gerar certificado**

**Possíveis causas:**
1. Falta biblioteca `node-forge`
2. Erro de permissão no banco
3. Timeout na geração RSA

**Solução:**
```bash
# Instalar dependência
npm install node-forge
npm install @types/node-forge --save-dev

# Fazer deploy
git add .
git commit -m "fix: adiciona node-forge para certificados"
git push
vercel --prod
```

### **Cenário C: Certificado gerado mas não aplicado**

**Verificar no banco:**
```sql
SELECT 
  serial_number,
  environment,
  is_active,
  valid_until,
  EXTRACT(DAY FROM (valid_until - now())) AS days_remaining
FROM signflow_certificates
WHERE is_active = true;
```

**Se não retornar nada:**
- Certificado não foi gerado
- Revisar logs do servidor

**Se retornar certificado:**
- Certificado existe mas não está sendo usado
- Verificar código de assinatura em `app/api/sign/route.ts`

---

## 🧪 **TESTE MANUAL: FORCAR GERAÇÃO DE CERTIFICADO**

Crie um arquivo de teste:

```typescript
// scripts/test-certificate.ts
import { getOrCreateSignFlowCertificate, getCertificateInfo } from '@/lib/certificateManager';

async function testCertificate() {
  try {
    console.log('🔍 Testando geração de certificado...');
    
    const cert = await getOrCreateSignFlowCertificate();
    console.log('✅ Certificado obtido:', cert.serial_number);
    
    const info = await getCertificateInfo();
    console.log('📊 Informações:', info);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testCertificate();
```

Executar:
```bash
tsx scripts/test-certificate.ts
```

---

## 💁 **CHECKLIST DE VALIDAÇÃO**

### **Antes de assinar documento:**

- [ ] Migration `20260203_signflow_certificates.sql` aplicada
- [ ] Biblioteca `node-forge` instalada
- [ ] Biblioteca `@signpdf/signpdf` instalada
- [ ] Deploy realizado no Vercel
- [ ] Variáveis de ambiente configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### **Após assinar documento:**

- [ ] Logs mostram "🔐 Aplicando assinatura digital PKI..."
- [ ] Logs mostram "✅ Assinatura digital PKI aplicada com sucesso!"
- [ ] API `/api/verify-signature/[id]` retorna `hasPKISignature: true`
- [ ] PDF aberto no Adobe mostra painel de assinaturas
- [ ] Assinatura aparece como "Assinado por: SignFlow Digital Platform"

---

## 🛡️ **VERIFICAR DEPENDÊNCIAS**

Confirmar em `package.json`:

```json
{
  "dependencies": {
    "@signpdf/signpdf": "^3.2.0",
    "@signpdf/signer-p12": "^3.2.0",
    "@signpdf/placeholder-plain": "^3.2.0",
    "node-forge": "^1.3.1"
  },
  "devDependencies": {
    "@types/node-forge": "^1.3.11"
  }
}
```

Se faltar alguma:
```bash
npm install @signpdf/signpdf @signpdf/signer-p12 @signpdf/placeholder-plain node-forge
npm install -D @types/node-forge
```

---

## 👀 **COMO VERIFICAR SE FUNCIONOU (VISUAL)**

### **No Adobe Acrobat Reader:**

1. Abrir PDF assinado
2. Barra azul aparece no topo: **"✏️ Assinado e todas as assinaturas são válidas"**
3. Painel lateral esquerdo: ícone de **🖋️ Assinaturas**
4. Clicar mostra: **"Assinado por: SignFlow Digital Platform"**
5. Status: ⚠️ **"Certificado auto-assinado"** (NORMAL)

### **No Foxit Reader:**

1. Menu **Protect** > **Signature Panel**
2. Lista mostra: **"SignFlow Digital Platform"**
3. Clicar em **"Validate"**
4. Mostra detalhes da assinatura

### **Via Linha de Comando (pdfsig):**

```bash
# Instalar poppler-utils
sudo apt install poppler-utils  # Ubuntu/Debian
brew install poppler            # macOS

# Verificar assinaturas
pdfsig documento-assinado.pdf
```

**Saída esperada:**
```
Digital Signature Info of: documento-assinado.pdf
Signature #1:
  - Signer Certificate Common Name: SignFlow Digital Platform
  - Signing Time: Feb 03 2026 20:28:23
  - Signature Validation: Signature is Valid.
```

---

## 🚨 **SE NADA FUNCIONAR**

### **Último recurso: Gerar certificado manualmente**

```bash
# Gerar certificado teste (10 anos de validade)
openssl req -x509 -newkey rsa:2048 \
  -keyout signflow-key.pem \
  -out signflow-cert.pem \
  -days 3650 -nodes \
  -subj "/CN=SignFlow Digital Platform/O=SignFlow/C=BR"

# Converter para P12
openssl pkcs12 -export \
  -out signflow.p12 \
  -inkey signflow-key.pem \
  -in signflow-cert.pem \
  -password pass:signflow123

# Criar pasta de certificados
mkdir -p certificates
mv signflow.p12 certificates/certificate.p12

# Configurar no .env.local
echo "CERTIFICATE_PATH=./certificates/certificate.p12" >> .env.local
echo "CERTIFICATE_PASSWORD=signflow123" >> .env.local
```

Depois fazer deploy com o arquivo P12.

---

## 📞 **SUPORTE**

**Logs importantes para compartilhar:**

1. Output de `/api/sign` (logs do Vercel)
2. Output de `/api/verify-signature/[id]`
3. Resultado de `SELECT * FROM signflow_certificates;`
4. Screenshot do Adobe Reader abrindo o PDF
5. Output de `pdfsig documento.pdf`

**Contato:**
- Issues: https://github.com/Junio243/signflow/issues
- Email: canutojunio72@gmail.com

---

## ✅ **RESULTADO ESPERADO FINAL**

Quando tudo estiver funcionando:

```json
// GET /api/verify-signature/<id>
{
  "validation": {
    "status": "valid",
    "message": "Documento contém assinatura digital PKI válida reconhecida por leitores de PDF",
    "hasPKISignature": true,
    "signatureType": "both",
    "signatureCount": 1,
    "hashMatch": true
  },
  "signatureDetails": [
    {
      "signerName": "SignFlow Digital Platform",
      "reason": "Documento assinado digitalmente via SignFlow",
      "location": "SignFlow Platform",
      "signDate": "2026-02-03T23:28:23.000Z"
    }
  ]
}
```

E no Adobe Reader: **Painel de assinaturas mostra "SignFlow Digital Platform" ✅**
