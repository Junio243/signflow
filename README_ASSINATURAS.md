# 📝 SignFlow - Sistema de Assinaturas Digitais

## 🎯 Visão Geral

Sistema completo de assinaturas digitais com certificados digitais, permitindo:
- Geração de certificados digitais auto-assinados
- Assinatura visual + digital de documentos PDF
- Histórico de assinaturas
- Verificação de autenticidade de documentos

---

## ✨ Funcionalidades

### 1️⃣ **Gerenciamento de Certificados**
- ✅ Criar perfis personalizados (Médico, Advogado, Empresa, etc.)
- ✅ Gerar certificados digitais auto-assinados (RSA 2048/4096 bits)
- ✅ Upload de certificados externos (.p12)
- ✅ Gestão de múltiplos certificados
- ✅ Validade configurável (1 a 10 anos)

### 2️⃣ **Assinatura de Documentos**
- ✅ Upload de PDF (drag-and-drop, até 10MB)
- ✅ Seleção de certificado
- ✅ Validação de senha do certificado
- ✅ Assinatura visual (texto no rodapé do PDF)
- ✅ Assinatura digital (RSA-SHA256)
- ✅ Download de documento assinado

### 3️⃣ **Histórico**
- ✅ Lista de todos os documentos assinados
- ✅ Filtros por status (Concluídos, Falhos)
- ✅ Informações detalhadas (assinante, data, certificado)
- ✅ Download de documentos assinados

### 4️⃣ **Verificação**
- ✅ Upload de PDF para verificar
- ✅ Validação de autenticidade
- ✅ Exibição de dados da assinatura
- ✅ Confirmação de integridade do documento

---

## 🛠️ Tecnologias Utilizadas

### **Frontend:**
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- React Dropzone

### **Backend:**
- Next.js API Routes
- Node.js

### **Banco de Dados:**
- Supabase (PostgreSQL)
- Supabase Storage

### **Bibliotecas de Assinatura:**
- `node-forge` - Criptografia e certificados
- `pdf-lib` - Manipulação de PDF
- `crypto` - Geração de hashes

---

## 📦 Estrutura do Projeto

```
signflow/
├── app/
│   ├── api/
│   │   ├── certificates/          # APIs de certificados
│   │   │   ├── generate/route.ts
│   │   │   └── upload/route.ts
│   │   ├── sign/                  # APIs de assinatura
│   │   │   ├── validate-certificate/route.ts
│   │   │   └── process/route.ts
│   │   └── verify/                # API de verificação
│   │       └── signature/route.ts
│   ├── certificates/          # Páginas de certificados
│   │   ├── page.tsx
│   │   └── generate/page.tsx
│   ├── sign/page.tsx          # Página de assinatura
│   ├── history/page.tsx       # Histórico de assinaturas
│   └── verify/page.tsx        # Verificação de documentos
├── components/
│   ├── certificates/          # Componentes de certificados
│   │   ├── CertificateCard.tsx
│   │   ├── CertificateForm.tsx
│   │   └── ProfileSelector.tsx
│   └── sign/                  # Componentes de assinatura
│       ├── DocumentUpload.tsx
│       └── CertificateSelector.tsx
├── types/
│   ├── certificates.ts
│   └── signatures.ts
└── supabase/
    └── migrations/
        ├── 20260203_create_certificates_table.sql
        └── 20260203_reset_signatures.sql
```

---

## 🚀 Instalação

### **1. Clonar o Repositório**
```bash
git clone https://github.com/Junio243/signflow.git
cd signflow
```

### **2. Instalar Dependências**
```bash
npm install
# ou
yarn install
```

### **3. Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como obter as chaves do Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### **4. Executar Migrations no Supabase**

Acesse: `https://supabase.com/dashboard/project/SEU_PROJECT/sql/new`

Execute os seguintes arquivos SQL na ordem:

**a) Certificados:**
```sql
-- Cole o conteúdo de:
-- supabase/migrations/20260203_create_certificates_table.sql
```

**b) Assinaturas:**
```sql
-- Cole o conteúdo de:
-- supabase/migrations/20260203_reset_signatures.sql
```

### **5. Configurar Storage no Supabase**

Os buckets `certificates` e `documents` serão criados automaticamente pelas migrations.

Verifique se foram criados em:
`https://supabase.com/dashboard/project/SEU_PROJECT/storage/buckets`

### **6. Iniciar o Servidor**
```bash
npm run dev
# ou
yarn dev
```

Acesse: http://localhost:3000

---

## 📚 Como Usar

### **1️⃣ Criar Certificado Digital**

1. Acesse `/certificates/generate`
2. Clique em **"+ Criar Novo Perfil"**
3. Preencha:
   - Nome do Perfil
   - Tipo (Personal, Medical, Legal, etc.)
   - CPF/CNPJ (opcional)
   - Organização (opcional)
4. Clique em **"Criar Perfil"**
5. Preencha os dados do certificado:
   - Nome do Certificado
   - Senha (mínimo 6 caracteres)
   - Força da Chave (2048 ou 4096 bits)
   - Validade (1 a 10 anos)
6. Clique em **"Gerar Certificado"**
7. Aguarde (pode levar alguns segundos)
8. ✅ **Pronto!** Seu certificado foi gerado

### **2️⃣ Assinar Documento**

1. Acesse `/sign`
2. **Upload do PDF:**
   - Arraste um PDF ou clique para selecionar
   - Máximo: 10MB
3. **Selecionar Certificado:**
   - Escolha um certificado da lista
   - Digite a senha do certificado
   - Clique em **"Validar Certificado"**
4. **Assinar:**
   - Clique em **"Assinar Documento"**
   - Aguarde o processamento
5. **Baixar:**
   - Clique em **"Baixar Documento Assinado"**
6. ✅ **Pronto!** Seu documento foi assinado

### **3️⃣ Ver Histórico**

1. Acesse `/history`
2. Veja a lista de documentos assinados
3. Use os filtros:
   - **Todos**
   - **Concluídos**
   - **Falhos**
4. Clique em **"Baixar"** para baixar novamente

### **4️⃣ Verificar Documento**

1. Acesse `/verify`
2. Faça upload do PDF assinado
3. Clique em **"Verificar Assinatura"**
4. Veja o resultado:
   - ✅ **Assinatura Válida** - Documento autêntico e íntegro
   - ⚠️ **Documento Assinado** - Tem marca de assinatura mas não foi possível validar completamente
   - ❌ **Documento Não Assinado** - Sem assinatura digital

---

## 📊 Estrutura do Banco de Dados

### **Tabela: `certificate_profiles`**
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- profile_name (TEXT)
- profile_type (TEXT)
- cpf_cnpj (TEXT)
- organization (TEXT)
- created_at (TIMESTAMP)
```

### **Tabela: `certificates`**
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- profile_id (UUID, FK → certificate_profiles)
- certificate_name (TEXT)
- certificate_path (TEXT) -- Caminho no Storage
- password_hash (TEXT)
- subject (TEXT)
- issuer (TEXT)
- serial_number (TEXT)
- not_before (TIMESTAMP)
- expires_at (TIMESTAMP)
- key_size (INTEGER) -- 2048 ou 4096
- algorithm (TEXT) -- RSA-SHA256
- is_active (BOOLEAN)
- certificate_data (JSONB)
- created_at (TIMESTAMP)
```

### **Tabela: `signatures`**
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- certificate_id (UUID, FK → certificates)
- original_document_name (TEXT)
- original_document_path (TEXT) -- Storage
- original_document_size (INTEGER)
- signed_document_path (TEXT) -- Storage
- signed_document_size (INTEGER)
- document_hash (TEXT) -- SHA-256
- signature_hash (TEXT) -- RSA signature
- signature_type (TEXT) -- visual/digital/both
- signature_data (JSONB)
- status (TEXT) -- completed/failed/processing
- signed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### **Storage Buckets:**
- `certificates` - Arquivos .p12 dos certificados
- `documents` - PDFs originais e assinados

---

## 🔒 Segurança

### **Certificados:**
- ✅ Senhas criptografadas com `bcrypt`
- ✅ Certificados armazenados de forma segura no Supabase Storage
- ✅ RLS (Row Level Security) ativo em todas as tabelas
- ✅ Apenas o usuário pode acessar seus próprios certificados

### **Assinaturas:**
- ✅ Assinatura digital com RSA-SHA256
- ✅ Hash SHA-256 do documento original
- ✅ Validação de integridade do documento
- ✅ Documentos armazenados com RLS

### **Verificação:**
- ✅ Comparação de hashes
- ✅ Busca no banco de dados
- ✅ Validação de assinatura visual

---

## 🐛 Troubleshooting

### **Problema: Certificado não aparece na lista**
- Verifique se o certificado foi criado com sucesso
- Acesse `/certificates` e veja se ele está lá
- Abra o Console (F12) e veja se há erros
- Verifique se o certificado não está expirado

### **Problema: Erro ao assinar documento**
- Verifique se a senha do certificado está correta
- Confirme se o certificado foi validado antes de assinar
- Veja os logs no Console (F12)
- Verifique se o PDF tem menos de 10MB

### **Problema: Verificação retorna "não assinado"**
- Certifique-se de que está usando o PDF **assinado** (baixado após a assinatura)
- Verifique se o documento não foi modificado após a assinatura
- Confirme se o documento foi assinado neste sistema

### **Problema: Erro "SUPABASE_SERVICE_ROLE_KEY not found"**
- Adicione a variável no Vercel:
  1. Dashboard → Settings → Environment Variables
  2. Adicione: `SUPABASE_SERVICE_ROLE_KEY`
  3. Valor: sua chave service_role do Supabase
  4. Redeploy o projeto

---

## 📝 Roadmap

### **Próximas Funcionalidades:**
- [ ] Assinatura em lote (múltiplos PDFs)
- [ ] Preview do PDF antes de assinar
- [ ] Envio de PDF por email
- [ ] Assinatura com posição customizável
- [ ] Assinatura com imagem/logo
- [ ] Relatório de assinaturas (PDF/CSV)
- [ ] Notificações de assinatura
- [ ] QR Code no documento assinado
- [ ] Integração com ICP-Brasil
- [ ] Carimbo de tempo

---

## 💬 Suporte

Para reportar bugs ou solicitar features:
- Abra uma **Issue** no GitHub
- Email: canutojunio72@gmail.com

---

## 📜 Licença

MIT License - Veja [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ por SignFlow Team**
