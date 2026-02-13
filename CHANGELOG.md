# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.5.0] - 2026-02-13

### ✨ Novas Funcionalidades

#### Sistema de Logging Centralizado
- **Novo**: Sistema de logging estruturado (`lib/logger.ts`)
  - Logs em JSON para melhor rastreamento
  - Níveis: debug, info, warn, error, critical
  - Logs detalhados em desenvolvimento, otimizados em produção
  - Integração futura com Sentry/LogRocket
- **Helpers especializados**: 
  - `logger.request()` - Logs de requisições HTTP
  - `logger.database()` - Logs de operações no banco

#### Security Headers
- **Novo**: Middleware de segurança (`middleware/securityHeaders.ts`)
  - Content Security Policy (CSP)
  - X-Frame-Options (proteção contra clickjacking)
  - X-Content-Type-Options (proteção contra MIME sniffing)
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
  - Permissions-Policy
- **Melhoria**: Remove headers que expõem informações sensíveis

#### Sistema de Auditoria
- **Novo**: Sistema completo de auditoria (`lib/audit.ts`)
  - Registro de todas as ações críticas
  - Rastreamento de IP, User-Agent, timestamps
  - Integrado com banco de dados (tabela `audit_logs`)
- **Helpers pré-configurados**:
  - `AuditHelpers.documentUpload()`
  - `AuditHelpers.documentSign()`
  - `AuditHelpers.documentValidation()`
  - `AuditHelpers.userLogin()`
  - `AuditHelpers.securityEvent()`

#### Sistema de Webhooks
- **Novo**: Serviço de webhooks (`lib/webhooks/webhook-service.ts`)
  - Notificações em tempo real de eventos
  - Assinatura HMAC-SHA256 para segurança
  - Suporte a múltiplos eventos simultâneos
  - Retry automático (planejado)
- **Eventos suportados**:
  - `document.uploaded`
  - `document.signed`
  - `document.validated`
  - `document.deleted`
  - `signature.created`
  - `user.created`
- **API**: `/api/webhooks` (GET, POST, DELETE)
  - Criar, listar e remover webhooks
  - Autenticação via Bearer token

#### Páginas Institucionais
- **Novo**: Página Sobre (`/about`)
  - Missão, valores e diferenciais
  - Tecnologias utilizadas
  - Depoimentos e casos de uso
- **Novo**: Termos de Uso (`/terms`)
  - Aceitação, responsabilidades, limitações
  - Validade jurídica e propriedade intelectual
  - Lei aplicável e foro
- **Novo**: Política de Privacidade (`/privacy`)
  - Conformidade com LGPD
  - Dados coletados, finalidade, base legal
  - Direitos dos usuários (acesso, retificação, exclusão)
  - Retenção, segurança e compartilhamento
- **Novo**: FAQ (`/faq`)
  - Perguntas frequentes organizadas por categoria
  - Accordion interativo
  - 7 categorias: Geral, Segurança, Funcionalidades, Assinatura, Conformidade, Integrações, Suporte

#### Banco de Dados
- **Novo**: Tabela `audit_logs`
  - Registro de auditoria completo
  - Índices otimizados para consultas
  - RLS (Row Level Security) habilitado
- **Novo**: Tabela `webhooks`
  - Configurações de webhooks dos usuários
  - Suporte a múltiplos eventos
  - Secret para assinatura HMAC
  - RLS habilitado
- **Migrations**: SQL completo em `database/migrations/`
  - Script de criação de tabelas
  - Políticas de segurança (RLS)
  - Índices para performance
  - Documentação em README.md

### 🔒 Segurança

- **Melhorado**: Rate limiting aplicado em `/api/upload`
- **Novo**: Middleware de security headers em todas as rotas
- **Novo**: Log de auditoria em operações críticas
- **Melhorado**: Sanitização de erros em produção
- **Novo**: Assinatura HMAC em webhooks

### 📚 Documentação

- **Novo**: CHANGELOG.md (este arquivo)
- **Novo**: Documentação de migrations (`database/migrations/README.md`)
- **Novo**: Guia de integração de webhooks
- **Atualizado**: README principal com novas funcionalidades

### 🐛 Correções de Bugs

- **Corrigido**: Console.logs desnecessários em produção
- **Corrigido**: Tratamento de erros mais robusto
- **Melhorado**: Validação de inputs em todas as rotas
- **Melhorado**: Mensagens de erro mais claras para o usuário

### ♻️ Refatoração

- **Refatorado**: Sistema de logging centralizado
- **Padronizado**: Estrutura de resposta de APIs
- **Melhorado**: Organização de arquivos e pastas

### 📦 Dependências

_Nenhuma nova dependência externa adicionada_

---

## [1.4.0] - 2026-02-01

### ✨ Novas Funcionalidades

- Sistema de assinatura digital PKI com certificados
- Batch signing (assinatura múltipla)
- Sistema de perfis de usuário
- Validação com código de acesso

### 🐛 Correções

- Performance de geração de PDFs
- Validação de documentos

---

## Como Usar Este Changelog

### Formato

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças que quebram compatibilidade
- **MINOR**: Novas funcionalidades mantendo compatibilidade
- **PATCH**: Correções de bugs

### Categorias

- **✨ Novas Funcionalidades**: Features novas
- **🐛 Correções**: Bug fixes
- **🔒 Segurança**: Melhorias de segurança
- **♻️ Refatoração**: Melhorias de código
- **📚 Documentação**: Atualizações de docs
- **📦 Dependências**: Mudanças em deps
- **⚠️ Breaking Changes**: Mudanças que quebram compatibilidade
