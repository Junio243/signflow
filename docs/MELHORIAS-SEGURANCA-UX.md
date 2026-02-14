# Melhorias de Segurança e UX - SignFlow

## 🛡️ Segurança e Proteção de Rotas

### 1. Middleware de Autenticação

**Arquivo:** `middleware.ts`

Implementamos proteção automática para áreas internas do sistema:

#### Rotas Protegidas (requerem login):
- `/dashboard` - Painel principal
- `/editor` - Editor de documentos
- `/create-document` - Criação de documentos
- `/profile` - Perfil do usuário
- `/settings` - Configurações
- `/security` - Segurança
- `/appearance` - Aparência
- `/history` - Histórico
- `/orgs` - Organizações
- `/certificates` - Certificados
- `/sign` - Assinatura

#### APIs Protegidas (requerem autenticação):
- `/api/documents/sign` - Assinar documentos
- `/api/upload` - Upload de arquivos
- `/api/sign` - Assinatura
- `/api/batch-sign` - Assinatura em lote
- `/api/cleanup` - Limpeza

#### Comportamento:

**Usuário NÃO autenticado tentando acessar:**

- **Páginas:** Redireciona para `/login?redirect=/rota-original`
  - Após login, retorna automaticamente para a página solicitada
  
- **APIs:** Retorna HTTP 401 com mensagem amigável:
  ```json
  {
    "error": "Por favor, faça login para acessar este recurso.",
    "code": "UNAUTHORIZED",
    "redirectTo": "/login"
  }
  ```

#### Security Headers:

O middleware também adiciona headers de segurança:

- **Content-Security-Policy** - Previne XSS
- **X-Frame-Options: DENY** - Previne clickjacking
- **X-Content-Type-Options: nosniff** - Previne MIME sniffing
- **X-XSS-Protection** - Proteção adicional contra XSS
- **Strict-Transport-Security** - Força HTTPS
- **Referrer-Policy** - Protege privacidade
- **Permissions-Policy** - Controla permissões do navegador

---

## 💬 Mensagens de Erro Amigáveis

### 2. Helper de Tradução de Erros

**Arquivo:** `lib/errorMessages.ts`

Traduz erros técnicos do Supabase/banco de dados em mensagens claras e em português.

#### Uso:

```typescript
import { formatErrorForDisplay, getFriendlyErrorMessage } from '@/lib/errorMessages'

// Formatar erro completo (mensagem + sugestão)
const message = formatErrorForDisplay(error)
// "E-mail ou senha incorretos. Verifique seus dados ou use o link mágico para acessar."

// Ou separadamente:
const friendly = getFriendlyErrorMessage(error)
console.log(friendly.message)    // "E-mail ou senha incorretos."
console.log(friendly.suggestion) // "Verifique seus dados ou use o link mágico para acessar."
console.log(friendly.code)       // "AUTH_INVALID_CREDENTIALS"
```

#### Erros Cobertos:

| Erro Técnico | Mensagem Amigável | Sugestão |
|--------------|-------------------|------------|
| `Invalid login credentials` | E-mail ou senha incorretos | Verifique seus dados ou use o link mágico |
| `Email not confirmed` | Esta conta ainda não foi confirmada | Verifique seu e-mail e clique no link de confirmação |
| `User already registered` | Este e-mail já está cadastrado | Tente fazer login ou use "Esqueci minha senha" |
| `Email rate limit exceeded` | Muitas tentativas em pouco tempo | Aguarde alguns minutos e tente novamente |
| `session_not_found` | Sua sessão expirou | Por favor, faça login novamente |
| `payload too large` | Arquivo muito grande | O arquivo deve ter no máximo 10MB |
| `network error` | Erro de conexão | Verifique sua internet e tente novamente |
| `403 / forbidden` | Você não tem permissão | Entre em contato com o administrador |
| `500` | Erro interno do servidor | Tente novamente em alguns minutos |

#### Categorias de Erros:

1. **Autenticação** - Login, cadastro, sessão
2. **Validação** - E-mail inválido, senha curta, campos obrigatórios
3. **Arquivos** - Tamanho, tipo, upload
4. **Banco de Dados** - Constraints, chaves estrangeiras
5. **Rede** - Conexão, timeout
6. **Permissões** - Acesso negado
7. **Genéricos** - Erros inesperados

---

## 🚀 Simplificação do Cadastro

### 3. Fluxo de Cadastro Otimizado

**Arquivo:** `app/(auth)/signup/page.tsx`

#### Mudanças Principais:

**ANTES:**
- ❌ 4 etapas longas
- ❌ CPF obrigatório
- ❌ Endereço completo obrigatório
- ❌ Data de nascimento obrigatória
- ❌ Muitos campos sem explicação

**DEPOIS:**
- ✅ 3 etapas rápidas
- ✅ CPF opcional (apenas para planos pagos)
- ✅ Endereço removido do cadastro inicial
- ✅ Data de nascimento opcional
- ✅ Explicação clara de cada campo

#### Estrutura das Etapas:

**Etapa 1: Dados Básicos** (✔️ Obrigatórios)
- Nome completo - *"Usado para identificar suas assinaturas digitais"*
- E-mail - *"Para login e notificações de documentos"*
- Telefone - *"Para contato e verificação de segurança"*

**Etapa 2: Dados Complementares** (✨ Opcionais)
- CPF - *"🔒 Necessário apenas para emitir certificados ICP-Brasil e planos pagos"*
- Data de nascimento
- Empresa
- Cargo

**Etapa 3: Segurança** (✔️ Obrigatórios)
- Senha (mínimo 6 caracteres)
- Confirmar senha
- Aceitar Termos e Política de Privacidade (com links diretos)

#### Benefícios:

1. **Menos atrito**: Cadastro 50% mais rápido
2. **Transparência**: Explica por que cada dado é necessário
3. **Conformidade LGPD**: CPF opcional até ser realmente necessário
4. **Melhor conversão**: Menos campos = mais cadastros completos
5. **Flexibilidade**: Dados complementares podem ser preenchidos depois

#### Links para Privacidade:

- Link direto para **Termos de Uso** (`/terms`)
- Link direto para **Política de Privacidade** (`/privacy`)
- Explicação sobre segurança dos dados
- Criptografia destacada

---

## 🔐 Página de Login Melhorada

### 4. Login com Mensagens Amigáveis

**Arquivo:** `app/(auth)/login/page.tsx`

#### Melhorias:

1. **Mensagens de erro em português**
   - Usa `formatErrorForDisplay()` para traduzir erros
   - Exibe mensagens claras e orientativas

2. **Redirect automático**
   - Suporta parâmetro `?redirect=/rota`
   - Retorna para página original após login

3. **Links para privacidade**
   - Link para Termos de Uso
   - Link para Política de Privacidade

4. **Feedback visual melhorado**
   - Erros com ícone de alerta e cor vermelha
   - Sucessos com ícone de check e cor verde
   - Estados de loading claros

5. **Opções de login**
   - Login com senha
   - Link mágico por e-mail (passwordless)

---

## 📊 Resumo das Melhorias

### Segurança:

- ✅ Proteção de rotas autenticadas
- ✅ Proteção de APIs de gravação
- ✅ Redirect automático para login
- ✅ Security headers (CSP, HSTS, etc)
- ✅ Verificação de sessão via cookies

### Experiência do Usuário:

- ✅ Mensagens de erro amigáveis e em português
- ✅ Cadastro simplificado (3 etapas vs 4)
- ✅ CPF opcional no cadastro inicial
- ✅ Explicação clara do uso de cada dado
- ✅ Links diretos para políticas de privacidade
- ✅ Sugestões de ação em erros
- ✅ Feedback visual melhorado

### Conformidade:

- ✅ LGPD: Dados pessoais (CPF) opcionais até necessários
- ✅ Transparência: Explica por que cada dado é coletado
- ✅ Acesso fácil: Links para políticas em todos os formulários
- ✅ Segurança: Criptografia destacada e explicada

---

## 🛠️ Manutenção

### Adicionar Nova Rota Protegida:

```typescript
// Em middleware.ts
const PROTECTED_ROUTES = [
  // ... rotas existentes
  '/nova-rota', // Adicionar aqui
]
```

### Adicionar Nova Mensagem de Erro:

```typescript
// Em lib/errorMessages.ts
export function getFriendlyErrorMessage(error: any): FriendlyError {
  // ...
  
  if (errorMessage.includes('novo_erro')) {
    return {
      message: 'Mensagem amigável',
      suggestion: 'Sugestão de ação',
      code: 'CODIGO_ERRO'
    }
  }
  
  // ...
}
```

### Usar Helper de Erro em Novo Componente:

```typescript
import { formatErrorForDisplay } from '@/lib/errorMessages'

try {
  // ... operação que pode falhar
} catch (error) {
  setError(formatErrorForDisplay(error))
}
```

---

## 📝 Notas Importantes

1. **CPF Opcional**: Agora é solicitado apenas quando:
   - Usuário upgrade para plano pago
   - Emissão de certificado ICP-Brasil
   - Recursos que exijam validação legal

2. **Redirect Automático**: Todas as rotas protegidas redirecionam para login com parâmetro `?redirect`, garantindo retorno automático.

3. **Mensagens Consistentes**: Use sempre `formatErrorForDisplay()` para garantir mensagens amigáveis em toda a aplicação.

4. **Privacidade**: Links para termos e políticas estão presentes em:
   - Login
   - Cadastro
   - Rodapé (quando implementado)

---

## 🔗 Links Úteis

- [Documentação Middleware Next.js](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Security Headers](https://securityheaders.com/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**Última atualização:** 14/02/2026
