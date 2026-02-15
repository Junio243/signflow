# 📜 Sistema de Certificados Digitais - SignFlow

## 🎯 Visão Geral

Sistema completo para **geração, gerenciamento e uso de certificados digitais auto-gerados** (e-CPF e e-CNPJ) na plataforma SignFlow.

### ✨ Principais Funcionalidades

✅ **Geração de Certificados**
- e-CPF (Pessoa Física)
- e-CNPJ (Pessoa Jurídica)
- Padrão X.509 v3
- RSA-2048 ou RSA-4096
- Validade configurável (1, 3 ou 5 anos)

✅ **Download e Reutilização**
- Formato PKCS#12 (.p12/.pfx)
- Protegido por senha forte
- Importável em navegadores
- Reutilizável em outras plataformas

✅ **Integração com Assinatura Avançada**
- Dados pré-preenchidos
- Configuração de posição da assinatura
- QR Code configurável
- Proteção do PDF com senha

✅ **Gerenciamento Completo**
- Listar todos os certificados
- Ver detalhes completos
- Revogar certificados
- Monitorar validade
- Estatísticas

---

## 📚 Documentação Completa

### 1. Especificação Técnica
**Arquivo:** [`docs/CERTIFICADOS-DIGITAIS.md`](./CERTIFICADOS-DIGITAIS.md)

**Conteúdo:**
- Visão geral do sistema
- Tipos de certificados (e-CPF, e-CNPJ)
- Informações armazenadas
- Estrutura X.509 completa
- Formatos de exportação (PKCS#12, PEM, DER)
- Fluxo de geração passo a passo
- Armazenamento seguro
- Segurança e criptografia
- Integração com assinatura avançada
- Interface de usuário
- Reutilização em outras plataformas
- Limitações e avisos

---

### 2. Guia de Implementação
**Arquivo:** [`docs/IMPLEMENTACAO-CERTIFICADOS.md`](./IMPLEMENTACAO-CERTIFICADOS.md)

**Conteúdo:**
- ✅ O que já foi implementado
- 🚧 Próximos passos detalhados
- Exemplos de código completos:
  - `certificateGenerator.ts` (client-side)
  - API Routes (server-side)
  - Páginas React/Next.js
  - Componentes reutilizáveis
- Roadmap de 6 sprints
- Tecnologias e pacotes NPM
- Práticas de segurança
- Testes unitários e E2E

---

### 3. Schema do Banco de Dados
**Arquivo:** [`supabase/migrations/20260215_certificates.sql`](../supabase/migrations/20260215_certificates.sql)

**Conteúdo:**
- Tabela `certificates` completa
- Colunas detalhadas:
  - `certificate_type` (e-CPF | e-CNPJ)
  - `subject_data` (JSONB flexível)
  - `public_key`, `certificate_pem`, `fingerprint_sha256`
  - `valid_from`, `valid_until`
  - `status` (active | revoked | expired)
- Funções SQL:
  - `revoke_certificate()` - Revogar certificado
  - `get_user_certificates()` - Listar certificados
  - `update_expired_certificates()` - Atualizar status
- RLS (Row Level Security) completo
- Índices de performance
- View `certificates_stats` para estatísticas

---

### 4. Tipos TypeScript
**Arquivo:** [`types/certificate.ts`](../types/certificate.ts)

**Conteúdo:**
- `CertificateType = 'e-CPF' | 'e-CNPJ'`
- `CertificateStatus = 'active' | 'revoked' | 'expired'`
- `CertificateAlgorithm = 'RSA-2048' | 'RSA-4096'`
- Interfaces:
  - `PersonalData` (e-CPF)
  - `CompanyData` (e-CNPJ)
  - `Certificate` (completo)
  - `CertificateSummary` (listagem)
  - `ECPFFormData` (formulário e-CPF)
  - `ECNPJFormData` (formulário e-CNPJ)
  - `AdvancedSignatureConfig` (assinatura)
- Type guards e helpers
- Constantes e labels
- Regex patterns para validação

---

## 🛠️ Arquivos Criados

### Documentação
- ✅ `docs/CERTIFICADOS-DIGITAIS.md` - Especificação completa
- ✅ `docs/IMPLEMENTACAO-CERTIFICADOS.md` - Guia de implementação
- ✅ `docs/CERTIFICADOS-README.md` - Este arquivo

### Banco de Dados
- ✅ `supabase/migrations/20260215_certificates.sql` - Schema completo

### TypeScript
- ✅ `types/certificate.ts` - Tipos e interfaces

### A Implementar
- ⏳ `lib/crypto/certificateGenerator.ts` - Geração client-side
- ⏳ `lib/validators/certificate.ts` - Validações
- ⏳ `app/api/certificates/generate/route.ts` - API geração
- ⏳ `app/api/certificates/list/route.ts` - API listagem
- ⏳ `app/api/certificates/[id]/route.ts` - API detalhes
- ⏳ `app/api/certificates/[id]/revoke/route.ts` - API revogação
- ⏳ `app/certificates/page.tsx` - Página listagem
- ⏳ `app/certificates/new/page.tsx` - Página geração
- ⏳ `app/certificates/[id]/page.tsx` - Página detalhes
- ⏳ `components/certificates/*` - Componentes
- ⏳ `components/sign/*` - Integração assinatura

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

### 2. Aplicar Migração do Banco

**No Supabase Dashboard:**
1. Ir em **SQL Editor**
2. Abrir arquivo `supabase/migrations/20260215_certificates.sql`
3. Copiar e executar o SQL
4. Verificar se tabela `certificates` foi criada

### 3. Criar Estrutura de Pastas

```bash
mkdir -p lib/crypto
mkdir -p lib/validators
mkdir -p components/certificates
mkdir -p components/sign
mkdir -p app/certificates
mkdir -p app/api/certificates
mkdir -p tests/certificates
```

### 4. Implementar Gerador de Certificados

Copiar código de exemplo de [`IMPLEMENTACAO-CERTIFICADOS.md`](./IMPLEMENTACAO-CERTIFICADOS.md) para `lib/crypto/certificateGenerator.ts`

### 5. Criar Rotas de API

Implementar:
- `app/api/certificates/generate/route.ts`
- `app/api/certificates/list/route.ts`

### 6. Criar Páginas

Implementar:
- `app/certificates/page.tsx` (listagem)
- `app/certificates/new/page.tsx` (geração)

---

## 📊 Roadmap de Desenvolvimento

### Sprint 1: Fundamentos (✅ CONCLUÍDO)
- [x] Documentação completa
- [x] Schema do banco de dados
- [x] TypeScript types

### Sprint 2: Biblioteca de Criptografia (Em Andamento)
- [ ] Instalar `node-forge`
- [ ] Implementar `certificateGenerator.ts`
- [ ] Testes unitários

### Sprint 3: Backend API
- [ ] Rotas de geração
- [ ] Rotas de listagem
- [ ] Rotas de revogação
- [ ] Testes de integração

### Sprint 4: Frontend - Listagem
- [ ] Página de listagem
- [ ] Componentes de cards
- [ ] Modal de detalhes
- [ ] Dialog de revogação

### Sprint 5: Frontend - Geração
- [ ] Página de geração
- [ ] Formulário e-CPF
- [ ] Formulário e-CNPJ
- [ ] Validações em tempo real

### Sprint 6: Integração Assinatura Avançada
- [ ] Seletor de certificado
- [ ] Editor de posição
- [ ] Configuração de QR Code
- [ ] Lógica de assinatura

---

## 🔒 Segurança

### Garantias de Segurança

✅ **Chave privada NUNCA sai do navegador**
- Geração 100% client-side
- Servidor recebe apenas certificado público
- Chave privada só existe no .p12 baixado

✅ **PKCS#12 protegido por senha**
- Senha forte obrigatória (8+ chars)
- Criptografia 3DES
- Algoritmo: AES-256-CBC

✅ **RLS (Row Level Security)**
- Usuários só veem seus certificados
- Proteção a nível de banco

✅ **Dados sensíveis em JSONB**
- CPF/CNPJ armazenados criptografados
- Não indexados diretamente

---

## ⚠️ Limitações Importantes

### NÃO é ICP-Brasil

Os certificados gerados pelo SignFlow **NÃO são emitidos por Autoridades Certificadoras credenciadas pela ICP-Brasil**.

**NÃO podem ser usados para:**
- ❌ Receita Federal (e-CAC)
- ❌ Processos judiciais (e-Proc, PJe)
- ❌ Licitações públicas
- ❌ Emissão de Notas Fiscais eletrônicas (NF-e)
- ❌ Cartórios e registros públicos

**PODEM ser usados para:**
- ✅ Contratos privados entre partes
- ✅ Documentos internos de empresas
- ✅ E-mails seguros (S/MIME)
- ✅ Autenticação em sistemas próprios
- ✅ Assinaturas em plataformas privadas

---

## 📞 Suporte e Contato

### Problemas ou Dúvidas?

1. Consulte a [documentação completa](./CERTIFICADOS-DIGITAIS.md)
2. Veja o [guia de implementação](./IMPLEMENTACAO-CERTIFICADOS.md)
3. Abra uma issue no GitHub

### Contribuindo

Contribuições são bem-vindas! Por favor:
1. Leia a documentação completa
2. Siga os padrões de código
3. Adicione testes
4. Atualize a documentação

---

## 📝 Changelog

### v1.0.0 (2026-02-15)

**Fundamentos Implementados:**
- ✅ Documentação completa (3 arquivos)
- ✅ Schema do banco de dados
- ✅ TypeScript types
- ✅ Funções SQL (revoke, list, update)
- ✅ RLS configurado
- ✅ View de estatísticas

**Commits:**
- [`2d7194e`](https://github.com/Junio243/signflow/commit/2d7194ee079d5a8566f464948c1c755c648f1696) - Documentação completa
- [`ce62d96`](https://github.com/Junio243/signflow/commit/ce62d96be6dbd7e27646e6cea6f97aa1b68436d3) - Schema do banco
- [`4f4285b`](https://github.com/Junio243/signflow/commit/4f4285bb5c026c72c446060976f67e703595301a) - Tipos TypeScript
- [`f957555`](https://github.com/Junio243/signflow/commit/f957555e4a59d83028c20cee83d0d742931b1223) - Guia de implementação

---

## 🎉 Próxima Etapa

**Implementar gerador de certificados:**
1. Instalar `node-forge`: `npm install node-forge @types/node-forge`
2. Criar `lib/crypto/certificateGenerator.ts`
3. Copiar código de exemplo de [`IMPLEMENTACAO-CERTIFICADOS.md`](./IMPLEMENTACAO-CERTIFICADOS.md)
4. Adicionar testes unitários
5. Testar geração de certificado

**Tempo estimado:** 1-2 dias

---

**Status:** ✅ **FUNDAMENTOS COMPLETOS - PRONTO PARA IMPLEMENTAÇÃO**

**Última atualização:** 14/02/2026 22:07
