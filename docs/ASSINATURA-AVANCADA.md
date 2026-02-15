# 🔒 Assinatura Avançada com Certificado Digital

## 🎯 Visão Geral

A **Assinatura Avançada** é uma funcionalidade premium do SignFlow que permite assinar documentos PDF utilizando **EXCLUSIVAMENTE os dados do certificado digital**, sem necessidade de preencher formulários manualmente.

---

## ✨ Diferenças entre Assinatura Simples e Avançada

### 📋 Assinatura Simples (`/sign`)
```
1. Selecionar documento PDF
2. Selecionar certificado
3. Informar senha do certificado
4. Validar certificado
5. Assinar
```

**Características:**
- ✅ Rápida
- ✅ Assinatura digital básica
- ❌ Sem customização visual
- ❌ Sem QR Code
- ❌ Sem proteção de PDF

---

### 🔰 Assinatura Avançada (`/sign/advanced`)
```
1. Selecionar documento PDF
2. Selecionar certificado digital
3. Informar senha do certificado
4. Configurar posição da assinatura visual
5. Configurar QR Code (opcional)
6. Proteger PDF com senha (opcional)
7. Assinar
```

**Características:**
- ✅ Usa TODOS os dados do certificado
- ✅ Assinatura visual personalizável
- ✅ QR Code configurável
- ✅ Proteção do PDF com senha
- ✅ Posição customizável
- ✅ **Nenhum campo manual de dados pessoais**

---

## 📚 Fluxo Detalhado

### Step 1: Selecionar Documento

```
📄 Upload do PDF
- Arraste ou clique para selecionar
- Tamanho máximo: [definido no sistema]
- Formatos aceitos: PDF
```

---

### Step 2: Selecionar Certificado Digital

#### Lista de Certificados

Exibe todos os certificados **válidos** (não expirados) do usuário:

```typescript
📄 e-CPF - A1
   João Silva
   Válido até: 15/02/2027
   
🏢 e-CNPJ - A1
   Empresa XYZ Ltda
   Válido até: 10/05/2026
```

#### Senha do Certificado

```
Senha do Certificado *
[••••••••] [👁️]
```

**Importante:** A senha é usada para:
- ✅ Descriptografar a chave privada
- ✅ Validar acesso ao certificado
- ✅ Assinar o documento

#### Preview dos Dados

Após selecionar certificado e senha:

```
✅ Dados que serão usados na assinatura:
   • Nome: João Silva
   • CPF: 123.456.789-00
   • E-mail: joao@email.com
   
   ℹ️ Nenhum dado manual será solicitado. Tudo vem do certificado!
```

---

### Step 3: Configurações Visuais

#### 3.1 Posição da Assinatura

```typescript
Posição da Assinatura no PDF

Página: [1]
X (horizontal): [50]
Y (vertical): [700]

Largura: 200px
Altura: 80px
```

**Sistema de Coordenadas:**
- Origem (0,0): Canto inferior esquerdo
- X: Horizontal (esquerda → direita)
- Y: Vertical (baixo → cima)

**Valores Sugeridos:**
- Canto inferior esquerdo: `x=50, y=50`
- Canto inferior direito: `x=400, y=50`
- Canto superior esquerdo: `x=50, y=700`
- Canto superior direito: `x=400, y=700`

---

#### 3.2 QR Code

```typescript
[✓] Incluir QR Code

Página: [1]
X: [450]
Y: [700]
Tamanho: 80px
```

**Conteúdo do QR Code:**
```json
{
  "signer": "João Silva",
  "document": "123.456.789-00",
  "certificate_type": "e-CPF",
  "signed_at": "2026-02-15T01:30:00Z",
  "certificate_id": "uuid-do-certificado"
}
```

**Usos do QR Code:**
- ✅ Validação rápida por mobile
- ✅ Verificar autenticidade
- ✅ Ver dados do assinante
- ✅ Rastreabilidade

---

#### 3.3 Proteção do PDF

```typescript
[✓] Proteger PDF com Senha

Senha do PDF: [••••••••]
```

**Segurança:**
- 🔒 PDF protegido contra abertura não autorizada
- 🔒 Senha diferente da senha do certificado
- 🔒 Criptografia AES-256
- 🔒 Impede visualização sem senha

---

## 📝 Assinatura Visual no PDF

O sistema gera automaticamente uma assinatura visual contendo:

```
╭───────────────────────────────────╮
│ Assinado digitalmente por:        │
│ João Silva                       │
│ e-CPF: 123.456.789-00             │
│ Data: 15/02/2026 01:30            │
╰───────────────────────────────────╯
```

**Informações includas:**
- ✅ Nome completo (e-CPF) ou Razão Social (e-CNPJ)
- ✅ Tipo de certificado
- ✅ Número do documento (CPF/CNPJ)
- ✅ Data e hora da assinatura
- ✅ Borda roxa (brand color)
- ✅ Fundo branco com transparência

---

## 🔐 Dados do Certificado Utilizados

### e-CPF (Pessoa Física)

```typescript
{
  "fullName": "João Silva",              // Nome na assinatura
  "cpf": "123.456.789-00",               // Documento
  "email": "joao@email.com",             // Contato
  "phone": "(11) 98765-4321",            // Opcional
  "birthDate": "1990-01-15",             // Dados do titular
  "rg": "12.345.678-9",                  // Opcional
  "address": { ... },                     // Endereço completo
  "profession": "Engenheiro",             // Opcional
  "professionalRegistry": "CREA/SP 123", // Opcional
}
```

### e-CNPJ (Pessoa Jurídica)

```typescript
{
  "companyName": "Empresa XYZ Ltda",      // Razão Social na assinatura
  "cnpj": "12.345.678/0001-00",          // Documento
  "tradeName": "XYZ",                     // Nome Fantasia
  "businessEmail": "contato@xyz.com",    // Contato
  "businessPhone": "(11) 3000-0000",     // Telefone
  "legalRepresentative": {                // Representante
    "fullName": "Maria Santos",
    "cpf": "987.654.321-00",
    "role": "Diretora",
    "email": "maria@xyz.com"
  },
  "address": { ... },                     // Endereço da empresa
}
```

---

## 🛡️ Segurança

### Validações

1. **Autenticação**
   - ✅ Usuário autenticado
   - ✅ Sessão válida
   - ✅ Bearer token no header

2. **Certificado**
   - ✅ Pertence ao usuário logado (RLS)
   - ✅ Não está expirado
   - ✅ Status = 'active'
   - ✅ Senha correta

3. **Senha do Certificado**
   - ✅ Descriptografação AES-256-CBC
   - ✅ Comparação hash
   - ✅ Validação antes da assinatura

4. **PDF**
   - ✅ Formato válido
   - ✅ Tamanho dentro do limite
   - ✅ Não corrompido

---

## 📦 Armazenamento

Documento assinado é salvo:

```typescript
{
  user_id: "uuid",
  certificate_id: "uuid",
  original_name: "contrato.pdf",
  signed_name: "1708042200_contrato.pdf",
  storage_path: "user_id/signed/timestamp_filename.pdf",
  signature_type: "advanced",  // ⭐ Identificador
  signature_data: {
    signer_name: "João Silva",
    signer_document: "123.456.789-00",
    signer_email: "joao@email.com",
    certificate_type: "e-CPF",
    signature_position: { ... },
    qr_code_config: { ... },
    pdf_protection: true,
    signed_at: "2026-02-15T01:30:00Z"
  },
  created_at: "2026-02-15T01:30:00Z"
}
```

**Storage Supabase:**
- Bucket: `documents`
- Path: `{user_id}/signed/{timestamp}_{filename}`
- URL assinada: Válida por 1 hora

---

## ✅ Metadados do PDF

O PDF assinado contém metadados:

```typescript
Title: "Documento Protegido - contrato.pdf"
Subject: "Documento assinado digitalmente e protegido"
Producer: "SignFlow - Assinatura Digital Avançada"
Creator: "SignFlow"
Author: "João Silva"
Keywords: ["assinatura digital", "e-CPF", "123.456.789-00"]
```

---

## 📊 Vantagens

### Para o Usuário

✅ **Zero dados manuais**
- Não precisa digitar nome, CPF, endereço, etc.
- Tudo vem do certificado automaticamente

✅ **Customização visual**
- Escolher onde a assinatura aparece
- QR Code opcional
- Proteção com senha

✅ **Segurança**
- Dados criptografados
- Senha do certificado obrigatória
- Opção de proteger o PDF

### Para o Sistema

✅ **Integridade**
- Dados garantidos pelo certificado
- Não há digitação errônea
- Rastreabilidade total

✅ **Profissionalismo**
- Assinatura visual elegante
- QR Code para validação
- Metadados completos

---

## 🛠️ API Endpoint

### `POST /api/sign/advanced`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "certificate_id": "uuid",
  "certificate_password": "senha123",
  "document_name": "contrato.pdf",
  "document_base64": "base64...",
  "signature_position": {
    "page": 1,
    "x": 50,
    "y": 700,
    "width": 200,
    "height": 80
  },
  "qr_code_config": {
    "enabled": true,
    "page": 1,
    "x": 450,
    "y": 700,
    "size": 80
  },
  "pdf_protection": {
    "enabled": true,
    "password": "senhaDoPDF123"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "signed_document_url": "https://...",
  "signer_info": {
    "name": "João Silva",
    "document": "123.456.789-00",
    "email": "joao@email.com",
    "certificate_type": "e-CPF"
  }
}
```

**Errors:**
- `401`: Não autorizado / Senha incorreta
- `404`: Certificado não encontrado
- `400`: Certificado expirado / Dados incompletos
- `500`: Erro ao processar

---

## 📱 Exemplo de Uso

### Caso: Assinar contrato com e-CPF

```
1. Usuário acessa /sign/advanced
2. Faz upload do contrato.pdf
3. Seleciona certificado "João Silva - e-CPF"
4. Informa senha do certificado
5. Vê preview: "João Silva, CPF 123.456.789-00"
6. Configura:
   - Assinatura: página 1, canto inferior direito
   - QR Code: habilitado, ao lado da assinatura
   - Senha PDF: habilitado, senha "Contrato2026"
7. Clica "Assinar com Certificado Digital"
8. Sistema:
   - Valida certificado
   - Adiciona assinatura visual
   - Gera QR Code
   - Protege PDF com senha
   - Salva no Supabase
9. Usuário baixa contrato_assinado.pdf
```

**Resultado:**
- ✅ PDF assinado digitalmente
- ✅ Assinatura visual com dados do certificado
- ✅ QR Code para validação
- ✅ PDF protegido com senha
- ✅ Metadados completos
- ✅ Nenhum dado digitado manualmente!

---

## 🔗 Links

- **Página:** [`/sign/advanced`](https://signflow-beta.vercel.app/sign/advanced)
- **API:** [`/api/sign/advanced`](/app/api/sign/advanced/route.ts)
- **Documentação Certificados:** [CERTIFICADOS-DIGITAIS.md](./CERTIFICADOS-DIGITAIS.md)
- **Tipos TypeScript:** [`/types/certificate.ts`](/types/certificate.ts)

---

## 🎉 Conclusão

A **Assinatura Avançada** é a forma mais profissional e segura de assinar documentos no SignFlow:

✅ **Dados do certificado = Zero digitação**  
✅ **Customização visual completa**  
✅ **QR Code para validação**  
✅ **Proteção de PDF opcional**  
✅ **Rastreabilidade total**  

**Resultado:** Assinatura digital de nível profissional com mínimo esforço! 🚀

---

**Última atualização:** 14/02/2026 22:46
