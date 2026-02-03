# 🚀 Deploy e Configuração no Vercel

## 📋 Visão Geral

Este guia explica como configurar o SignFlow na Vercel, incluindo variáveis de ambiente, certificados digitais e integrações.

---

## ⚙️ Variáveis de Ambiente Necessárias

### 🔵 Obrigatórias (Supabase)

```bash
# Autenticação e Banco de Dados
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 🟢 Opcionais (Certificados Auto-Gerenciados)

```bash
# Senha para criptografar certificados no banco (recomendado)
SIGNFLOW_CERTIFICATE_PASSWORD=uma-senha-forte-aqui
```

**⚠️ Se não configurar:** Sistema usa senha padrão (menos seguro)

### 🟡 Opcionais (Certificados ICP-Brasil)

```bash
# Para usar certificado ICP-Brasil externo
CERTIFICATE_PATH=/caminho/certificado.p12
CERTIFICATE_PASSWORD=senha-do-certificado
```

**⚠️ Nota:** Certificados ICP-Brasil requerem upload de arquivo (explicado abaixo)

---

## 🔧 Como Configurar na Vercel

### Método 1: Painel Web (Recomendado)

#### 1️⃣ Acessar Projeto

1. Acesse [vercel.com](https://vercel.com)
2. Faça login
3. Selecione o projeto **SignFlow**

#### 2️⃣ Abrir Configurações

```
Project → Settings → Environment Variables
```

Ou acesse direto:
```
https://vercel.com/seu-usuario/signflow/settings/environment-variables
```

#### 3️⃣ Adicionar Variáveis

Para cada variável:

1. **Name:** Nome da variável (ex: `SIGNFLOW_CERTIFICATE_PASSWORD`)
2. **Value:** Valor da variável
3. **Environment:** Selecione onde usar
   - ✅ **Production** (obrigatório)
   - ✅ **Preview** (recomendado)
   - ⬜ Development (opcional)
4. Clique em **"Add"**

#### 4️⃣ Salvar e Redeployar

⚠️ **Importante:** Variáveis só entram em vigor após novo deploy!

**Opção A - Deploy Automático:**
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

**Opção B - Deploy Manual:**
```
Vercel Dashboard → Deployments → [...] → Redeploy
```

---

### Método 2: Vercel CLI

#### Instalar CLI

```bash
npm i -g vercel
vercel login
```

#### Adicionar Variável

```bash
# Produção
vercel env add SIGNFLOW_CERTIFICATE_PASSWORD production
# Digite o valor quando solicitado

# Preview
vercel env add SIGNFLOW_CERTIFICATE_PASSWORD preview

# Development
vercel env add SIGNFLOW_CERTIFICATE_PASSWORD development
```

#### Listar Variáveis

```bash
vercel env ls
```

#### Remover Variável

```bash
vercel env rm SIGNFLOW_CERTIFICATE_PASSWORD production
```

---

## 🔐 Configuração de Certificados

### Opção 1: Certificados Auto-Gerenciados (Padrão)

✅ **Vantagens:**
- Zero configuração necessária
- Funciona automaticamente
- Armazenado no Supabase

📝 **Configuração:**

1. **Opcional:** Adicionar senha customizada
   ```
   SIGNFLOW_CERTIFICATE_PASSWORD=minha-senha-super-segura
   ```

2. **Inicializar certificado:**
   - Acesse `/settings/certificates` no seu app
   - Clique em "Inicializar Certificado"
   - Pronto! ✅

⚠️ **Lembrete:** Usuários precisam [adicionar certificado como confiável](./COMO_VALIDAR_ASSINATURA_ADOBE.md) no Adobe Reader

---

### Opção 2: Certificados ICP-Brasil

✅ **Vantagens:**
- Reconhecimento automático no Adobe Reader
- Selo verde sem configuração
- Validade jurídica plena

💰 **Custo:** R$ 200-500/ano

#### Como Usar na Vercel

**Problema:** Vercel não tem sistema de arquivos persistente

**Solução 1: Base64 na Variável de Ambiente**

1. **Converter certificado para Base64:**
   ```bash
   # Linux/Mac
   base64 -i certificado.p12 | tr -d '\n'
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.p12"))
   ```

2. **Adicionar variáveis na Vercel:**
   ```
   CERTIFICATE_BASE64=MIIKpAIBAzCCCl4GCSqGSIb3DQE... (resultado do base64)
   CERTIFICATE_PASSWORD=senha-do-certificado
   ```

3. **Atualizar código para decodificar:**
   ```typescript
   // lib/digitalSignature.ts
   const certBase64 = process.env.CERTIFICATE_BASE64;
   if (certBase64) {
     const certBuffer = Buffer.from(certBase64, 'base64');
     // Usar certBuffer ao invés de ler arquivo
   }
   ```

**Solução 2: Usar Vercel Blob Storage**

1. **Instalar dependência:**
   ```bash
   npm install @vercel/blob
   ```

2. **Upload do certificado:**
   ```bash
   # Via CLI
   vercel blob put certificado.p12
   ```

3. **Usar URL do blob:**
   ```typescript
   import { download } from '@vercel/blob';
   
   const certBlob = await download(process.env.CERTIFICATE_BLOB_URL);
   const certBuffer = await certBlob.arrayBuffer();
   ```

**Solução 3: Usar Variável de Ambiente Secreta (Mais Simples)**

Vou criar um helper que faz isso automaticamente:

---

## 📦 Implementação Automática para ICP-Brasil

Vou criar um código que funciona automaticamente na Vercel:

### 1. Criar Helper de Certificado

```typescript
// lib/certificateLoader.ts
import fs from 'fs';
import path from 'path';

export async function loadCertificate(): Promise<Buffer | null> {
  // Opção 1: Base64 na variável de ambiente (Vercel)
  const certBase64 = process.env.CERTIFICATE_BASE64;
  if (certBase64) {
    console.log('📄 Carregando certificado do Base64...');
    return Buffer.from(certBase64, 'base64');
  }
  
  // Opção 2: Arquivo local (desenvolvimento)
  const certPath = process.env.CERTIFICATE_PATH;
  if (certPath) {
    try {
      console.log('📄 Carregando certificado do arquivo:', certPath);
      return fs.readFileSync(certPath);
    } catch (error) {
      console.error('❌ Erro ao ler certificado:', error);
      return null;
    }
  }
  
  // Opção 3: Certificado auto-gerenciado (padrão)
  console.log('📄 Usando certificado auto-gerenciado do banco');
  return null; // Usa certificado do banco
}

export function getCertificatePassword(): string {
  return process.env.CERTIFICATE_PASSWORD || process.env.SIGNFLOW_CERTIFICATE_PASSWORD || 'signflow';
}
```

### 2. Atualizar Módulo de Assinatura

```typescript
// lib/digitalSignature.ts
import { loadCertificate, getCertificatePassword } from './certificateLoader';

export async function signPdfComplete(pdfBuffer: Buffer, options: SignOptions) {
  // Tenta carregar certificado externo
  const externalCert = await loadCertificate();
  
  if (externalCert) {
    // Usa certificado ICP-Brasil
    return signWithExternalCert(pdfBuffer, externalCert, getCertificatePassword(), options);
  }
  
  // Usa certificado auto-gerenciado
  return signWithAutoManagedCert(pdfBuffer, options);
}
```

---

## 🌍 Configuração por Ambiente

### Production (Produção)

```bash
# Obrigatórias
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key

# Opcionais
SIGNFLOW_CERTIFICATE_PASSWORD=senha-producao-forte

# Se usar ICP-Brasil
CERTIFICATE_BASE64=base64-do-certificado-producao
CERTIFICATE_PASSWORD=senha-do-certificado-producao
```

### Preview (Staging)

```bash
# Mesmas variáveis, mas pode usar dados de teste
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
SIGNFLOW_CERTIFICATE_PASSWORD=senha-staging
```

### Development (Local)

```bash
# Para desenvolvimento local (não afeta Vercel)
# Crie arquivo .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

---

## ✅ Checklist de Deploy

### Primeiro Deploy

- [ ] Fork do repositório feito
- [ ] Projeto conectado na Vercel
- [ ] Variáveis do Supabase configuradas
- [ ] Deploy inicial realizado
- [ ] Site acessível

### Configuração de Certificados

**Opção A: Auto-Gerenciados (Recomendado para começar)**
- [ ] Variável `SIGNFLOW_CERTIFICATE_PASSWORD` configurada (opcional)
- [ ] Acessar `/settings/certificates`
- [ ] Clicar "Inicializar Certificado"
- [ ] Testar assinatura de PDF
- [ ] Compartilhar [guia de validação](./COMO_VALIDAR_ASSINATURA_ADOBE.md) com usuários

**Opção B: ICP-Brasil (Para reconhecimento automático)**
- [ ] Adquirir certificado ICP-Brasil (e-CPF/e-CNPJ)
- [ ] Converter para Base64
- [ ] Adicionar `CERTIFICATE_BASE64` na Vercel
- [ ] Adicionar `CERTIFICATE_PASSWORD` na Vercel
- [ ] Atualizar código com helper de certificado
- [ ] Redeployar
- [ ] Testar assinatura

### Pós-Deploy

- [ ] Testar login/cadastro
- [ ] Testar upload de PDF
- [ ] Testar assinatura digital
- [ ] Verificar logs no Vercel
- [ ] Configurar domínio customizado (opcional)

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

```
Vercel Dashboard → Deployments → [Latest] → Runtime Logs
```

Ou via CLI:
```bash
vercel logs
```

### Verificar Build

```
Vercel Dashboard → Deployments → [Latest] → Building
```

### Testar Variáveis

Crie uma API route de teste:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    certificatePassword: !!process.env.SIGNFLOW_CERTIFICATE_PASSWORD,
    certificateBase64: !!process.env.CERTIFICATE_BASE64,
  });
}
```

Acesse: `https://seu-app.vercel.app/api/test-env`

---

## 🔄 Atualizar Variáveis

### Mudar Valor

1. Vercel Dashboard → Settings → Environment Variables
2. Encontre a variável
3. Clique no ícone de **editar** (lápis)
4. Digite novo valor
5. Save
6. **Redeploy necessário!**

### Adicionar Nova

```bash
# Via CLI
vercel env add NOVA_VARIAVEL production

# Ou via painel web
```

### Remover

```bash
# Via CLI
vercel env rm VARIAVEL_ANTIGA production

# Ou via painel: [...] → Remove
```

---

## 🐛 Troubleshooting

### Variável Não Está Funcionando

**Causa:** Deploy não foi feito após adicionar variável

**Solução:**
```bash
git commit --allow-empty -m "redeploy"
git push
```

### Certificado Não Está Sendo Usado

**Causa:** Base64 inválido ou senha errada

**Solução:**
1. Verificar logs: `vercel logs`
2. Recriar Base64:
   ```bash
   base64 -i certificado.p12 | tr -d '\n'
   ```
3. Atualizar variável
4. Redeploy

### Build Falhando

**Causa:** Erro de sintaxe ou dependência faltando

**Solução:**
1. Ver logs de build na Vercel
2. Testar localmente:
   ```bash
   npm run build
   ```
3. Corrigir erro
4. Commit e push

### 500 Internal Server Error

**Causa:** Variável de ambiente faltando ou erro em runtime

**Solução:**
1. Verificar logs de runtime
2. Adicionar variáveis faltantes
3. Verificar conexão com Supabase

---

## 🔗 Links Úteis

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 📝 Exemplo Completo de Configuração

### Variáveis na Vercel (Production):

```
NEXT_PUBLIC_SUPABASE_URL = https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiI...
SIGNFLOW_CERTIFICATE_PASSWORD = minha-senha-segura-123
```

### Deploy:

```bash
# Fazer alteração
git add .
git commit -m "Update certificate config"
git push origin main

# Vercel deploya automaticamente
# Aguardar 2-3 minutos
```

### Verificar:

```
✅ Build successful
✅ Preview: https://signflow-abc123.vercel.app
✅ Production: https://signflow.vercel.app
```

---

**Desenvolvido com ❤️ pela equipe SignFlow**
