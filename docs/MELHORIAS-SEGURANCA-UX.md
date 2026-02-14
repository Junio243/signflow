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

## 🌍 Mensagens de Erro Amigáveis e Multilíngues

### 2. Helper de Tradução de Erros (i18n)

**Arquivo:** `lib/errorMessages.ts`

Traduz erros técnicos do Supabase/banco de dados em mensagens claras em **3 idiomas: Português, Inglês e Espanhol**.

#### 🇺🇸 Detecção Automática de Idioma:

1. **LocalStorage**: Verifica `localStorage.getItem('locale')`
2. **Navegador**: Detecta `navigator.language`
3. **Fallback**: Português (PT) como padrão

#### Uso Básico:

```typescript
import { formatErrorForDisplay, getFriendlyErrorMessage } from '@/lib/errorMessages'

// Formatar erro completo no idioma do usuário (detecta automaticamente)
const message = formatErrorForDisplay(error)
// PT: "E-mail ou senha incorretos. Verifique seus dados ou use o link mágico."
// EN: "Incorrect email or password. Check your credentials or use the magic link."
// ES: "Correo o contraseña incorrectos. Verifica tus datos o usa el enlace mágico."

// Especificar idioma manualmente
const messageEN = formatErrorForDisplay(error, 'en')
const messageES = formatErrorForDisplay(error, 'es')

// Ou separadamente:
const friendly = getFriendlyErrorMessage(error, 'pt')
console.log(friendly.message)    // "E-mail ou senha incorretos."
console.log(friendly.suggestion) // "Verifique seus dados..."
console.log(friendly.code)       // "AUTH_INVALID_CREDENTIALS"
```

#### Erros Cobertos (Multilíngues):

| Código | Português (PT) | Inglês (EN) | Espanhol (ES) |
|--------|-----------------|--------------|---------------|
| `AUTH_INVALID_CREDENTIALS` | E-mail ou senha incorretos | Incorrect email or password | Correo o contraseña incorrectos |
| `AUTH_EMAIL_NOT_CONFIRMED` | Conta não confirmada | Account not confirmed | Cuenta no confirmada |
| `AUTH_USER_EXISTS` | E-mail já cadastrado | Email already registered | Correo ya registrado |
| `RATE_LIMIT_EXCEEDED` | Muitas tentativas | Too many attempts | Demasiados intentos |
| `SESSION_EXPIRED` | Sessão expirou | Session expired | Sesión expirada |
| `FILE_TOO_LARGE` | Arquivo muito grande | File too large | Archivo demasiado grande |
| `NETWORK_ERROR` | Erro de conexão | Connection error | Error de conexión |
| `PERMISSION_DENIED` | Sem permissão | No permission | Sin permiso |
| `SERVER_ERROR` | Erro do servidor | Server error | Error del servidor |
| `UNAUTHORIZED` | Faça login | Please log in | Inicia sesión |

#### Categorias de Erros:

1. **🔐 Autenticação** - Login, cadastro, sessão
2. **✅ Validação** - E-mail inválido, senha curta, campos obrigatórios
3. **📄 Arquivos** - Tamanho, tipo, upload
4. **💾 Banco de Dados** - Constraints, chaves estrangeiras
5. **🌐 Rede** - Conexão, timeout
6. **🚫 Permissões** - Acesso negado
7. **⁉️ Genéricos** - Erros inesperados

#### Exemplo Prático com Context de Idioma:

```typescript
import { useLanguage } from '@/contexts/LanguageContext'
import { formatErrorForDisplay } from '@/lib/errorMessages'

function MyComponent() {
  const { locale } = useLanguage() // 'pt', 'en', ou 'es'
  
  try {
    await doSomething()
  } catch (error) {
    // Mensagem será exibida no idioma do usuário
    setError(formatErrorForDisplay(error, locale))
  }
}
```

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

1. **Mensagens de erro multilíngues**
   - Usa `formatErrorForDisplay()` para traduzir erros
   - Exibe mensagens claras e orientativas
   - Suporta PT, EN, ES

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

- ✅ Mensagens de erro amigáveis em **3 idiomas** (PT/EN/ES)
- ✅ Detecção automática de idioma
- ✅ Cadastro simplificado (3 etapas vs 4)
- ✅ CPF opcional no cadastro inicial
- ✅ Explicação clara do uso de cada dado
- ✅ Links diretos para políticas de privacidade
- ✅ Sugestões de ação em erros
- ✅ Feedback visual melhorado

### Internacionalização:

- ✅ Sistema i18n completo (PT, EN, ES)
- ✅ Mensagens de erro traduzidas
- ✅ Interface multilíngue
- ✅ Detecção automática de idioma
- ✅ Persistência de preferência de idioma

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

### Adicionar Nova Mensagem de Erro (Multilíngue):

```typescript
// Em lib/errorMessages.ts
const ERROR_CATALOG: ErrorMessages = {
  // ...
  
  MEU_NOVO_ERRO: {
    pt: {
      message: 'Mensagem em português',
      suggestion: 'Sugestão em português'
    },
    en: {
      message: 'Message in English',
      suggestion: 'Suggestion in English'
    },
    es: {
      message: 'Mensaje en español',
      suggestion: 'Sugerencia en español'
    }
  },
  
  // ...
}

// Adicionar detecção em identifyErrorCode()
function identifyErrorCode(error: any): string {
  // ...
  
  if (errorMessage.includes('meu_erro')) {
    return 'MEU_NOVO_ERRO'
  }
  
  // ...
}
```

### Usar Helper de Erro em Novo Componente:

```typescript
import { formatErrorForDisplay } from '@/lib/errorMessages'
import { useLanguage } from '@/contexts/LanguageContext'

function MyComponent() {
  const { locale } = useLanguage()
  
  try {
    // ... operação que pode falhar
  } catch (error) {
    // Mensagem no idioma do usuário
    setError(formatErrorForDisplay(error, locale))
  }
}
```

---

## 🔍 Detalhes Técnicos

### Estrutura de Idiomas:

```typescript
type Locale = 'pt' | 'en' | 'es'

interface FriendlyError {
  message: string      // Mensagem principal
  suggestion?: string  // Sugestão de ação (opcional)
  code?: string        // Código do erro
}
```

### Prioridade de Detecção de Idioma:

1. **Parâmetro `locale` passado na função** (máxima prioridade)
2. **LocalStorage** (`localStorage.getItem('locale')`)
3. **Navegador** (`navigator.language`)
4. **Padrão** (Português - 'pt')

### Compatibilidade:

- ✅ Retrocompatível com código existente
- ✅ Funciona sem especificar idioma (detecta automaticamente)
- ✅ Fallback para português se idioma não suportado
- ✅ Funciona no servidor (SSR) com fallback

---

## 📝 Notas Importantes

1. **CPF Opcional**: Agora é solicitado apenas quando:
   - Usuário upgrade para plano pago
   - Emissão de certificado ICP-Brasil
   - Recursos que exijam validação legal

2. **Redirect Automático**: Todas as rotas protegidas redirecionam para login com parâmetro `?redirect`, garantindo retorno automático.

3. **Mensagens Consistentes**: Use sempre `formatErrorForDisplay()` com o idioma do usuário para garantir mensagens amigáveis e traduzidas.

4. **Privacidade**: Links para termos e políticas estão presentes em:
   - Login
   - Cadastro
   - Rodapé (quando implementado)

5. **Idiomas Suportados**: 
   - 🇧🇷 Português (PT) - Padrão
   - 🇺🇸 Inglês (EN)
   - 🇪🇸 Espanhol (ES)

---

## 🔗 Links Úteis

- [Documentação Middleware Next.js](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Security Headers](https://securityheaders.com/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [i18n Best Practices](https://www.w3.org/International/questions/qa-i18n)

---

**Última atualização:** 14/02/2026 - Versão 2.0 com suporte multilíngue
