# Sistema de Certificados Digitais - SignFlow

## 📜 Visão Geral

O SignFlow permite que usuários **gerem seus próprios certificados digitais** diretamente na plataforma, sem precisar de Autoridades Certificadoras externas (ICP-Brasil).

**Vantagens:**
- ✅ Gratuito e instantâneo
- ✅ Pode baixar e reutilizar em outros logins
- ✅ Dados pré-preenchidos na Assinatura Avançada
- ✅ Proteção com senha do certificado
- ✅ Autonomia total do usuário

---

## 📋 Tipos de Certificados

### 1. e-CPF (Pessoa Física)

**Quem usa:**
- Cidadãos comuns
- Médicos
- Advogados
- Contadores
- Profissionais liberais

**Informações obrigatórias:**
```yaml
Identificação:
  - Nome Completo *
  - CPF *
  - RG
  - Data de Nascimento *
  - E-mail *
  
Enderço:
  - CEP *
  - Logradouro *
  - Número *
  - Complemento
  - Bairro *
  - Cidade *
  - Estado *
  
Contato:
  - Telefone *
  - Celular
  
Profissional (Opcional):
  - Profissão
  - Registro Profissional (OAB, CRM, CRC, etc)
  - Conselho Regional
```

---

### 2. e-CNPJ (Pessoa Jurídica)

**Quem usa:**
- Empresas
- Corporações
- Condomínios
- Associações
- Instituições

**Informações obrigatórias:**
```yaml
Empresa:
  - Razão Social *
  - Nome Fantasia
  - CNPJ *
  - Inscrição Estadual
  - Inscrição Municipal
  
Responsável Legal:
  - Nome Completo *
  - CPF *
  - Cargo *
  - E-mail *
  
Enderço:
  - CEP *
  - Logradouro *
  - Número *
  - Complemento
  - Bairro *
  - Cidade *
  - Estado *
  
Contato:
  - Telefone Comercial *
  - E-mail Comercial *
```

---

## 🔐 Estrutura do Certificado

### Padrão X.509

Os certificados seguem o padrão **X.509 v3**, internacionalmente reconhecido.

```
┌────────────────────────────────────────────────┐
│ CERTIFICADO DIGITAL X.509                         │
├────────────────────────────────────────────────┤
│ Dados do Titular (Subject)                        │
├────────────────────────────────────────────────┤
│ - CN (Common Name): Nome Completo / Razão Social  │
│ - C (Country): BR                                 │
│ - ST (State): São Paulo                          │
│ - L (Locality): São Paulo                        │
│ - O (Organization): SignFlow                      │
│ - OU (Org Unit): Pessoa Física / Pessoa Jurídica │
│ - serialNumber: CPF ou CNPJ                       │
│ - emailAddress: email@exemplo.com                │
├────────────────────────────────────────────────┤
│ Dados Técnicos                                    │
├────────────────────────────────────────────────┤
│ - Versão: 3 (X.509 v3)                            │
│ - Número de Série: UUID único                     │
│ - Algoritmo: RSA-2048 + SHA-256                   │
│ - Chave Pública: 2048 bits                         │
│ - Validade: 1 ano (padrão) ou 3 anos             │
│ - Emissor: SignFlow CA                            │
│ - Assinatura Digital: Assinado pela CA            │
├────────────────────────────────────────────────┤
│ Extensões (v3)                                    │
├────────────────────────────────────────────────┤
│ - Key Usage: Digital Signature, Non-Repudiation   │
│ - Extended Key Usage: Email, Document Signing     │
│ - Subject Alternative Name: Email                 │
│ - Authority Key Identifier                        │
│ - Subject Key Identifier                          │
│ - CRL Distribution Points (Revogação)            │
└────────────────────────────────────────────────┘
```

---

## 📦 Formatos de Exportação

### 1. PKCS#12 (.p12 / .pfx)

**Padrão recomendado** - Contém certificado + chave privada.

```
📄 meu-certificado.p12
├─ Certificado Digital (público)
├─ Chave Privada (criptografada)
└─ Senha de proteção
```

**Uso:**
- Importar em navegadores (Chrome, Firefox, Edge)
- Usar em Adobe Reader/Acrobat
- Importar em sistemas corporativos
- Reutilizar em outras plataformas

---

### 2. PEM (.pem)

**Formato texto** - Certificado e chave em arquivos separados.

```
📄 certificado.pem    (público)
🔐 chave-privada.pem  (privada, criptografada)
```

**Uso:**
- Servidores web (Apache, Nginx)
- Integrações via API
- Desenvolvimento

---

### 3. DER (.cer / .crt)

**Formato binário** - Apenas certificado (sem chave privada).

```
📄 certificado.cer
└─ Certificado Digital (somente leitura)
```

**Uso:**
- Compartilhar certificado público
- Validação de assinaturas
- Importar em sistemas que só precisam do certificado

---

## 🔄 Fluxo de Geração

### Passo 1: Escolher Tipo

```
👤 Pessoa Física (e-CPF)    🏢 Pessoa Jurídica (e-CNPJ)
```

---

### Passo 2: Preencher Dados

**Formulário completo** com validações:

- ✅ CPF/CNPJ validado
- ✅ CEP com busca automática
- ✅ Telefone formatado
- ✅ E-mail validado
- ✅ Campos obrigatórios marcados

---

### Passo 3: Configurar Certificado

```yaml
Opções:
  - Validade: 1 ano | 3 anos | 5 anos
  - Senha do certificado: Mínimo 8 caracteres
  - Confirmar senha
  - Algoritmo: RSA-2048 (padrão) | RSA-4096 (mais seguro)
```

---

### Passo 4: Gerar e Baixar

```
⏳ Gerando par de chaves...
⏳ Criando certificado X.509...
⏳ Assinando com CA do SignFlow...
⏳ Empacotando em PKCS#12...
✅ Certificado gerado com sucesso!

📥 Baixar certificado.p12
📝 Salvar dados no perfil
```

---

## 💾 Armazenamento Seguro

### Banco de Dados (Supabase)

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Identificação
  certificate_type VARCHAR(10) NOT NULL CHECK (certificate_type IN ('e-CPF', 'e-CNPJ')),
  serial_number VARCHAR(64) UNIQUE NOT NULL,
  
  -- Dados do titular
  subject_data JSONB NOT NULL, -- Nome, CPF/CNPJ, endereço, etc
  
  -- Dados técnicos
  public_key TEXT NOT NULL,
  certificate_pem TEXT NOT NULL, -- Certificado completo em PEM
  fingerprint_sha256 VARCHAR(64) NOT NULL,
  
  -- Datas
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Metadados
  algorithm VARCHAR(50) DEFAULT 'RSA-2048',
  issuer VARCHAR(255) DEFAULT 'SignFlow CA',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_serial ON certificates(serial_number);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_valid_until ON certificates(valid_until);
```

**Importante:**
- ⚠️ **NUNCA armazenar chave privada no banco**
- ✅ Chave privada só existe no arquivo .p12 baixado pelo usuário
- ✅ Usuário é responsável por guardar seu certificado

---

## 🔒 Segurança

### Proteção da Chave Privada

```
┌─────────────────────────────────────────┐
│ GERAÇÃO NO NAVEGADOR (Client-Side)       │
├─────────────────────────────────────────┤
│ 1. Usuário clica "Gerar Certificado"        │
│ 2. JavaScript gera par de chaves (RSA)     │
│ 3. Chave privada é criptografada com senha │
│ 4. Certificado é criado e assinado          │
│ 5. PKCS#12 é baixado imediatamente          │
│ 6. Chave privada É APAGADA da memória       │
├─────────────────────────────────────────┤
│ ✅ Chave privada NUNCA sai do navegador    │
│ ✅ Servidor só recebe certificado público  │
│ ✅ Máxima segurança para o usuário         │
└─────────────────────────────────────────┘
```

### Requisitos de Senha

```
✅ Mínimo 8 caracteres
✅ Pelo menos 1 letra maiúscula
✅ Pelo menos 1 letra minúscula
✅ Pelo menos 1 número
✅ Pelo menos 1 caractere especial (@#$%&*)
```

---

## 🔗 Integração com Assinatura Avançada

### Antes (Sem Certificado)

```
❌ Usuário precisa preencher tudo manualmente:
  - Nome completo
  - CPF
  - E-mail
  - Endereço completo
  - Telefone
  - etc...
```

---

### Depois (Com Certificado)

```
✅ Fluxo simplificado:

1. Escolher certificado da lista
   📄 Certificado e-CPF - Alexandre L. (CPF: ***123.456-**)
   📄 Certificado e-CNPJ - Empresa XYZ (CNPJ: **.***.***/**01-**)
   
2. Configurar apenas:
   - Posição da assinatura no PDF
   - Mostrar QR Code? Sim / Não
   - Posição do QR Code
   - Proteger PDF com senha? Sim / Não
   - Senha do PDF (se escolheu proteger)
   
3. Assinar!
   - Todos os dados já vêm do certificado
   - Basta informar senha do certificado
```

---

## 📝 Interface de Uso

### Tela: Meus Certificados

```
┌──────────────────────────────────────────────────────────────────────┐
│ MEUS CERTIFICADOS DIGITAIS                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ [ + Gerar Novo Certificado ]                                         │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 📄 e-CPF - Alexandre Junio                              [ATIVO] │ │
│ │ CPF: ***123.456-**                                               │ │
│ │ Validade: 14/02/2026 a 14/02/2027                               │ │
│ │ Serial: A1B2-C3D4-E5F6                                          │ │
│ │                                                                  │ │
│ │ [ Ver Detalhes ] [ Baixar .p12 ] [ Revogar ]                   │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 e-CNPJ - Empresa ABC Ltda                        [ATIVO] │ │
│ │ CNPJ: **.***.***/**01-**                                        │ │
│ │ Responsável: Alexandre Junio                                    │ │
│ │ Validade: 10/01/2026 a 10/01/2029 (3 anos)                     │ │
│ │ Serial: Z9Y8-X7W6-V5U4                                          │ │
│ │                                                                  │ │
│ │ [ Ver Detalhes ] [ Baixar .p12 ] [ Revogar ]                   │ │
│ └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Reutilização do Certificado

### 1. Importar no Navegador

**Chrome/Edge:**
```
Configurações → Privacidade e Segurança → Segurança 
→ Gerenciar certificados → Importar
→ Selecionar arquivo .p12
→ Informar senha
→ Concluído!
```

**Firefox:**
```
Configurações → Privacidade e Segurança → Certificados
→ Ver certificados → Seus certificados → Importar
→ Selecionar arquivo .p12
→ Informar senha
→ Concluído!
```

---

### 2. Usar em Outras Plataformas

- ✅ Adobe Acrobat/Reader (assinatura de PDFs)
- ✅ Sistemas de e-mail (S/MIME)
- ✅ Outras plataformas de assinatura
- ✅ Sistemas corporativos que suportam X.509

---

## ⚠️ Limitações e Avisos

### Não é ICP-Brasil

```
⚠️ IMPORTANTE:

Certificados gerados pelo SignFlow NÃO são emitidos por 
Autoridades Certificadoras credenciadas pela ICP-Brasil.

PORTANTO:
❌ Não podem ser usados para:
  - e-CAC (Receita Federal)
  - e-CNPJ (Cadastro Nacional)
  - Processos judiciais (e-Proc, PJe)
  - Licit