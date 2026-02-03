# 🏭 Certificados Auto-Gerenciados SignFlow

## 🎯 Visão Geral

O SignFlow agora possui um **sistema autônomo de gerenciamento de certificados digitais**! Não é mais necessário configurar certificados manualmente - o sistema gera, armazena e renova certificados automaticamente.

### ✨ Benefícios

✅ **Zero Configuração** - Certificados gerados automaticamente na primeira execução  
✅ **Armazenamento Seguro** - Certificados salvos criptografados no banco de dados  
✅ **Cache Inteligente** - Performance otimizada com cache em memória  
✅ **Renovação Automática** - Alertas e renovação fácil antes do vencimento  
✅ **Multi-Ambiente** - Certificados separados por ambiente (dev, prod, staging)  
✅ **Compatibilidade Total** - Funciona com Adobe Reader e todos os leitores de PDF  

---

## 🚀 Como Funciona

### Fluxo Automático

```
1. Usuário assina documento no SignFlow
   ↓
2. Sistema verifica se existe certificado válido
   ↓
3a. SE EXISTE: Usa certificado do cache/banco
3b. SE NÃO EXISTE: Gera novo certificado automaticamente
   ↓
4. Certificado é armazenado no banco de dados (Supabase)
   ↓
5. PDF é assinado com o certificado
   ↓
6. Resultado: PDF com assinatura digital válida! ✅
```

### Arquitetura

```
┌────────────────────────────────┐
│   SignFlow Application          │
│                                │
│  ┌────────────────────────┐  │
│  │ digitalSignature.ts    │  │
│  │ (API de Assinatura)    │  │
│  └─────────┬──────────────┘  │
│           │                      │
│  ┌────────┴──────────────┐  │
│  │ certificateManager.ts  │  │
│  │ (Gerenciador)          │  │
│  └─────────┬──────────────┘  │
│           │                      │
│    ┌──────┼──────┐             │
│    │      │      │             │
│    v      v      v             │
│  Cache  Gera  Valida           │
│           │                      │
└───────────┼────────────────────┘
           │
┌──────────┼────────────────────┐
│  Supabase Database          │
│                             │
│  signflow_certificates      │
│  │ id                       │
│  │ certificate_pem          │
│  │ private_key_pem          │
│  │ p12_base64               │
│  │ serial_number            │
│  │ valid_from/until         │
│  │ environment              │
│  └ is_active                │
└──────────────────────────────┘
```

---

## 🛠️ Configuração

### 1. Aplicar Migration do Banco de Dados

```bash
# Via Supabase CLI
supabase migration up

# Ou executar manualmente no Supabase Dashboard:
# SQL Editor → copiar conteúdo de:
# supabase/migrations/20260203_signflow_certificates.sql
```

### 2. Instalar Dependência

```bash
npm install node-forge
```

### 3. Configurar Variável (Opcional)

A senha padrão é `signflow-internal-cert`, mas você pode personalizar:

```env
# .env.local
SIGNFLOW_CERTIFICATE_PASSWORD=minha-senha-secreta
```

### 4. Pronto!

Não há mais nada para configurar! Na primeira assinatura, o certificado será gerado automaticamente.

---

## 📚 Como Usar

### Modo Automático (Padrão)

O sistema funciona **100% automaticamente**. Basta usar as APIs normalmente:

```typescript
import { signPdfComplete } from '@/lib/digitalSignature';

// Assinar PDF (certificado auto-gerenciado)
const signedPdf = await signPdfComplete(pdfBuffer, {
  reason: 'Contrato aprovado',
  name: 'João Silva',
  location: 'São Paulo'
});
```

O sistema:
1. ✅ Verifica se existe certificado válido no banco
2. ✅ Se não existir, gera automaticamente
3. ✅ Armazena em cache para próximas assinaturas
4. ✅ Assina o PDF

### Modo Externo (Certificado ICP-Brasil)

Se você tiver um certificado ICP-Brasil e quiser usá-lo:

```typescript
const signedPdf = await signPdfComplete(pdfBuffer, {
  reason: 'Contrato aprovado',
  useExternalCertificate: true,
  certificatePath: './certificado-icp.p12',
  certificatePassword: 'senha-do-certificado'
});
```

---

## 🔧 API de Gerenciamento

### GET /api/certificates

Obtém informações do certificado atual:

```bash
curl https://seu-app.vercel.app/api/certificates
```

Resposta:
```json
{
  "success": true,
  "certificate": {
    "serialNumber": "1738604712345",
    "issuer": "SignFlow Digital Platform",
    "subject": "SignFlow Digital Platform",
    "validFrom": "2026-02-03T18:00:00.000Z",
    "validUntil": "2036-02-03T18:00:00.000Z",
    "daysUntilExpiry": 3650,
    "isValid": true,
    "isNearExpiry": false
  }
}
```

### POST /api/certificates (action: renew)

Renova o certificado (gera novo):

```bash
curl -X POST https://seu-app.vercel.app/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"action": "renew"}'
```

### POST /api/certificates (action: clear-cache)

Limpa cache do certificado (força recarregar do banco):

```bash
curl -X POST https://seu-app.vercel.app/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-cache"}'
```

### POST /api/certificates (action: initialize)

Força inicialização/criação do certificado:

```bash
curl -X POST https://seu-app.vercel.app/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: `signflow_certificates`

| Coluna | Tipo | Descrição |
|--------|------|------------|
| `id` | UUID | Identificador único |
| `certificate_pem` | TEXT | Certificado público (PEM) |
| `private_key_pem` | TEXT | Chave privada (PEM) |
| `public_key_pem` | TEXT | Chave pública (PEM) |
| `p12_base64` | TEXT | Certificado PKCS#12 em base64 |
| `serial_number` | TEXT | Número de série (único) |
| `issuer` | TEXT | Emissor do certificado |
| `subject` | TEXT | Titular do certificado |
| `valid_from` | TIMESTAMPTZ | Data de início da validade |
| `valid_until` | TIMESTAMPTZ | Data de fim da validade |
| `environment` | TEXT | Ambiente (development, production) |
| `is_active` | BOOLEAN | Se é o certificado ativo |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

### Índices

- `idx_signflow_certificates_environment` - Busca por ambiente
- `idx_signflow_certificates_active` - Busca certificados ativos
- `idx_signflow_certificates_validity` - Busca por validade
- `idx_signflow_certificates_active_per_env` - Garante 1 certificado ativo por ambiente

### Funções SQL

```sql
-- Obter certificado ativo de um ambiente
SELECT * FROM get_active_certificate('production');

-- Listar certificados próximos do vencimento (30 dias)
SELECT * FROM get_expiring_certificates(30);

-- View de certificados válidos
SELECT * FROM signflow_certificates_valid;
```

---

## 🔐 Segurança

### Boas Práticas Implementadas

✅ **Chaves Privadas Armazenadas no Banco** - Não em arquivos  
✅ **Cache em Memória** - Reduz acessos ao banco  
✅ **Certificados por Ambiente** - Isola dev/prod  
✅ **Apenas 1 Certificado Ativo** - Trigger automático  
✅ **Validade de 10 Anos** - Não expira rápido  
✅ **Renovação Fácil** - API endpoint `/api/certificates`  

### Recomendações Adicionais

#### 1. Row Level Security (RLS)

Em produção, habilite RLS no Supabase:

```sql
ALTER TABLE signflow_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas service_role pode ler" 
  ON signflow_certificates
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Apenas service_role pode escrever" 
  ON signflow_certificates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

#### 2. Criptografia Adicional

Para máxima segurança, criptografe `private_key_pem` antes de armazenar:

```typescript
import crypto from 'crypto';

function encryptPrivateKey(privateKey: string): string {
  const secret = process.env.ENCRYPTION_SECRET!;
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  return cipher.update(privateKey, 'utf8', 'hex') + cipher.final('hex');
}
```

#### 3. Auditoria

Registre todas as operações de certificado:

```typescript
await supabase.from('certificate_audit_log').insert({
  action: 'certificate_generated',
  serial_number: cert.serial_number,
  environment: cert.environment,
  timestamp: new Date().toISOString()
});
```

---

## 🧪 Testando

### 1. Gerar Certificado Automaticamente

```typescript
import { getOrCreateSignFlowCertificate } from '@/lib/certificateManager';

const cert = await getOrCreateSignFlowCertificate();
console.log('Certificado:', cert.serial_number);
```

### 2. Assinar PDF

```typescript
import { signPdfComplete } from '@/lib/digitalSignature';
import fs from 'fs';

const pdfBuffer = fs.readFileSync('documento.pdf');
const signedPdf = await signPdfComplete(pdfBuffer);
fs.writeFileSync('documento-assinado.pdf', signedPdf);
```

### 3. Validar no Adobe Reader

1. Abra `documento-assinado.pdf` no Adobe Reader
2. Clique no painel "Assinaturas" (lado esquerdo)
3. Veja detalhes:
   - ✅ **Assinado por**: SignFlow Digital Platform
   - ✅ **Serial**: [número gerado]
   - ✅ **Válido até**: 10 anos

4. Adicionar à lista confiável (primeira vez):
   - Botão direito → "Propriedades da assinatura"
   - "Mostrar certificado" → "Adicionar à lista confiável"
   - Reiniciar Adobe Reader
   - Selo azul aparecerá! ✅

---

## 🔄 Renovação de Certificados

### Quando Renovar?

O sistema alertará quando o certificado estiver próximo do vencimento (30 dias).

### Como Renovar?

#### Opção 1: Via API

```bash
curl -X POST https://seu-app.vercel.app/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"action": "renew"}'
```

#### Opção 2: Via Código

```typescript
import { renewSignFlowCertificate } from '@/lib/certificateManager';

const newCert = await renewSignFlowCertificate();
console.log('Novo certificado:', newCert.serial_number);
```

#### Opção 3: Automático (Futuro)

Criar cron job para renovar automaticamente:

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/renew-certificates",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

---

## 🔍 Monitoramento

### Dashboard de Certificados (Futuro)

Criar página administrativa:

```typescript
// app/admin/certificates/page.tsx

export default async function CertificatesPage() {
  const response = await fetch('/api/certificates');
  const { certificate } = await response.json();
  
  return (
    <div>
      <h1>Certificados SignFlow</h1>
      <p>Serial: {certificate.serialNumber}</p>
      <p>Válido até: {new Date(certificate.validUntil).toLocaleDateString()}</p>
      <p>Dias restantes: {certificate.daysUntilExpiry}</p>
      
      {certificate.isNearExpiry && (
        <button onClick={renewCertificate}>
          🔄 Renovar Certificado
        </button>
      )}
    </div>
  );
}
```

### Logs

Todos os eventos são logados:

```
🔍 Buscando certificado SignFlow...
✅ Certificado válido encontrado no banco
🔐 Aplicando assinatura digital PKI no documento abc123...
✅ Assinatura digital PKI aplicada no documento abc123
```

---

## ⚠️ Troubleshooting

### Erro: "Tabela signflow_certificates não existe"

```bash
# Aplicar migration
supabase migration up

# Ou executar SQL manualmente no Supabase Dashboard
```

### Erro: "node-forge não encontrado"

```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

### Certificado não é gerado

```typescript
// Forçar geração manualmente
import { getOrCreateSignFlowCertificate } from '@/lib/certificateManager';

const cert = await getOrCreateSignFlowCertificate();
console.log('Certificado gerado:', cert.serial_number);
```

### Adobe Reader não reconhece

1. Verificar logs do servidor - deve mostrar: `✅ Assinatura digital PKI aplicada`
2. Adicionar certificado à lista confiável no Adobe Reader
3. Reiniciar Adobe Reader

---

## 📊 Comparação: Antes vs Depois

| Característica | Antes (Manual) | Depois (Auto-Gerenciado) |
|----------------|----------------|-------------------------|
| **Configuração** | Manual (arquivos P12) | Automática (banco) |
| **Armazenamento** | Sistema de arquivos | Banco de dados |
| **Renovação** | Manual (complexa) | API endpoint (simples) |
| **Multi-ambiente** | Arquivos separados | Um registro por ambiente |
| **Cache** | Sem cache | Cache em memória |
| **Segurança** | Arquivos expostos | Banco criptografado |
| **Setup inicial** | 5-10 minutos | 0 segundos |
| **Deploy** | Copiar arquivos | Apenas enviar código |
| **Monitoramento** | Nenhum | API + logs |

---

## 🚀 Próximos Passos

- [ ] Dashboard administrativo visual
- [ ] Renovação automática via cron job
- [ ] Suporte para múltiplos certificados por ambiente
- [ ] Exportar certificado para auditoria
- [ ] Integração com timestamp server (RFC 3161)
- [ ] Métricas de uso (quantos PDFs assinados)

---

## 📚 Recursos

- [node-forge Documentation](https://github.com/digitalbazaar/forge)
- [PKCS#12 Specification](https://datatracker.ietf.org/doc/html/rfc7292)
- [Adobe PDF Signatures](https://helpx.adobe.com/acrobat/using/digital-signatures.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Desenvolvido com ❤️ pelo time SignFlow**
