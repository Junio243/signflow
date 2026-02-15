# ⚡ Configurar Variáveis de Ambiente no Vercel

## ⚠️ **ERRO ATUAL**

```
Error: Missing Supabase environment variables
    at app/api/sign/advanced/route.js

> Build error occurred
[Error: Failed to collect page data for /api/sign/advanced]
```

**Causa:** Variáveis de ambiente do Supabase não configuradas no Vercel.

---

## ✅ **SOLUÇÃO: Configurar no Vercel Dashboard**

### **Passo 1: Acessar Vercel Dashboard**

1. Ir para: https://vercel.com/junio243/signflow
2. Clicar na aba **"Settings"**
3. No menu lateral, clicar em **"Environment Variables"**

---

### **Passo 2: Adicionar Variáveis Obrigatórias**

Adicione **TODAS** as variáveis abaixo:

#### 🔑 **Supabase (OBRIGATÓRIAS)**

```bash
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de serviço (service role key) - APENAS Production/Preview
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde encontrar estas chaves:**
1. Ir para: https://supabase.com/dashboard/project/SEU_PROJETO
2. Clicar em **"Settings"** (engrenagem no canto inferior esquerdo)
3. Clicar em **"API"**
4. Copiar:
   - **URL:** `https://xxxxx.supabase.co`
   - **anon public:** Em "Project API keys" > "anon public"
   - **service_role:** Em "Project API keys" > "service_role" (SECRET!)

---

#### 🔐 **Certificados (OPCIONAIS - Por Enquanto)**

```bash
# Senha para criptografar certificados
SIGNFLOW_CERTIFICATE_PASSWORD=sua-senha-super-secreta-aqui

# Caminho para certificado P12 (se usar certificado externo)
CERTIFICATE_PATH=/path/to/certificate.p12

# Senha do certificado P12 (se usar certificado externo)
CERTIFICATE_PASSWORD=senha-do-certificado
```

⚠️ **IMPORTANTE:** 
- `SIGNFLOW_CERTIFICATE_PASSWORD` é usado para criptografar senhas no banco
- Se não configurar, usará valor padrão (não recomendado para produção)

---

### **Passo 3: Configurar Ambientes**

Para cada variável, selecione os ambientes:

```
☑️ Production    - Deploy da branch main
☑️ Preview       - PRs e branches de teste
☐ Development   - Localhost (não necessário, use .env.local)
```

**Recomendação:**
- Marque **Production** e **Preview** para todas as variáveis
- Development usará `.env.local` no seu computador

---

### **Passo 4: Salvar e Redeploy**

1. Clicar em **"Save"** após adicionar cada variável
2. Ir para a aba **"Deployments"**
3. No último deployment com erro, clicar nos 3 pontinhos (...)
4. Clicar em **"Redeploy"**
5. Aguardar build finalizar (≈ 2-3 minutos)

---

## 📝 **LISTA COMPLETA DE VARIÁVEIS**

### **Obrigatórias (Para o build passar):**

| Variável | Descrição | Onde encontrar |
|----------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (SECRET!) | Supabase Dashboard > Settings > API |

### **Recomendadas (Para segurança):**

| Variável | Descrição | Valor Sugerido |
|----------|-------------|----------------|
| `SIGNFLOW_CERTIFICATE_PASSWORD` | Senha para criptografar certificados | Senha forte (32+ chars) |

### **Opcionais (Para certificados externos):**

| Variável | Descrição | Quando usar |
|----------|-------------|-------------|
| `CERTIFICATE_PATH` | Caminho do certificado P12 | Se usar certificado ICP-Brasil |
| `CERTIFICATE_PASSWORD` | Senha do certificado | Se usar certificado ICP-Brasil |

---

## 🔒 **SEGURANÇA**

### ⚠️ **NUNCA COMPARTILHE:**

```
❌ SUPABASE_SERVICE_ROLE_KEY
❌ SIGNFLOW_CERTIFICATE_PASSWORD
❌ CERTIFICATE_PASSWORD
```

Estas chaves dão **acesso total** ao banco de dados!

### ✅ **Boas Práticas:**

1. **Não commitar** variáveis no Git
2. **Usar senhas fortes** (32+ caracteres)
3. **Rotacionar** chaves periodicamente
4. **Diferentes valores** para Preview e Production (opcional)
5. **Limitar** acessos ao Vercel Dashboard

---

## 🧑‍💻 **PARA DESENVOLVIMENTO LOCAL**

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local (NÃO COMMITAR!)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Certificados
SIGNFLOW_CERTIFICATE_PASSWORD=sua-senha-local
CERTIFICATE_PATH=./certificates/dev-certificate.p12
CERTIFICATE_PASSWORD=senha-do-cert-dev
```

**Verificar que `.env.local` está no `.gitignore`:**
```bash
# .gitignore já deve conter:
.env.local
.env*.local
```

---

## 🔍 **COMO VERIFICAR SE ESTÁ FUNCIONANDO**

### **No Vercel Dashboard:**

1. Ir em **"Deployments"**
2. Clicar no deployment mais recente
3. Ver logs de build
4. Procurar por:
   ```
   ✅ Compiled successfully
   ✅ Collecting page data
   ✅ Generating static pages
   ✅ Build completed
   ```

### **No Browser:**

1. Abrir: https://signflow-beta.vercel.app
2. Verificar se carrega sem erros
3. Tentar fazer login
4. Verificar console do navegador (F12) para erros

---

## ❓ **TROUBLESHOOTING**

### **Erro: "Missing Supabase environment variables"**

**Solução:**
- Verificar se **TODAS** as 3 variáveis do Supabase estão configuradas
- Verificar se estão marcadas para **Production** e **Preview**
- Fazer **Redeploy** após adicionar

### **Erro: "Invalid Supabase URL"**

**Solução:**
- Verificar se URL começa com `https://`
- Verificar se termina com `.supabase.co`
- Copiar novamente do Supabase Dashboard

### **Erro: "Invalid JWT"**

**Solução:**
- Verificar se chaves não foram truncadas ao copiar
- Verificar se não há espaços extras
- Copiar novamente do Supabase Dashboard

### **Build passa mas site não funciona**

**Solução:**
- Abrir console do navegador (F12)
- Ver erros de API
- Verificar se variáveis `NEXT_PUBLIC_*` estão disponíveis no client
- Fazer hard refresh (Ctrl+Shift+R)

---

## 📸 **PRINTS DE REFERÊNCIA**

### **1. Vercel - Environment Variables**

```
Vercel Dashboard > Settings > Environment Variables

+-------------------------+
| Key                     | Value                | Environments           |
+-------------------------+----------------------+------------------------+
| NEXT_PUBLIC_SUPABASE... | https://xxx.supa...  | ☑️ Prod ☑️ Preview     |
| NEXT_PUBLIC_SUPABASE... | eyJhbGciOiJIUzI1...  | ☑️ Prod ☑️ Preview     |
| SUPABASE_SERVICE_ROL... | eyJhbGciOiJIUzI1...  | ☑️ Prod ☑️ Preview     |
| SIGNFLOW_CERTIFICATE... | *******************  | ☑️ Prod ☑️ Preview     |
+-------------------------+----------------------+------------------------+

[Add New] [Import .env]  [Bulk Edit]
```

### **2. Supabase - API Keys**

```
Supabase Dashboard > Settings > API

Project URL
https://xxxxxxxxxxx.supabase.co

Project API keys

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...

service_role (SECRET!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJl...
⚠️ This key has the ability to bypass Row Level Security. Never share it publicly.
```

---

## ✅ **CHECKLIST FINAL**

Antes de fazer redeploy, verificar:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` adicionada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` adicionada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` adicionada
- [ ] `SIGNFLOW_CERTIFICATE_PASSWORD` adicionada (recomendado)
- [ ] Todas marcadas para **Production** e **Preview**
- [ ] Todas salvas (botão "Save" clicado)
- [ ] Redeploy iniciado
- [ ] Build logs verificados
- [ ] Site testado no navegador

---

## 📞 **SUPORTE**

Se o erro persistir:

1. Copiar logs completos do build
2. Verificar erros específicos
3. Consultar documentação:
   - Vercel: https://vercel.com/docs/environment-variables
   - Supabase: https://supabase.com/docs/guides/api

---

**Status:** 🔴 **AÇÃO NECESSÁRIA - Configurar variáveis no Vercel**

**Tempo estimado:** 5-10 minutos

**Última atualização:** 15/02/2026 23:00
