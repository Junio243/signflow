# Resolução: Loop de Autenticação (Login Funciona mas Redireciona)

## 🐛 Problema Encontrado

### Sintoma:
- Login funciona (email aparece no header)
- Sessão é criada no Supabase
- MAS ao tentar acessar rotas protegidas (`/dashboard`), é redirecionado para `/login`
- Loop infinito: login → dashboard → login → dashboard...

### Causa Raiz:

**Problema de armazenamento:**
- 💻 **Client-side** (HeaderClient): Lê sessão do `localStorage` ✅ Funciona
- 🔒 **Middleware** (servidor/edge): Tenta ler sessão dos `cookies HTTP` ❌ Não encontra

**Por quê?**
```
┌────────────────────────────────────┐
│ Supabase Client (padrão)             │
│ createClient(url, key)               │
└────────────────────────────────────┘
           │
           │ Salva em...
           │
     ┌─────┼─────┐
     │          │
┌────┴────┐  ┌──┴──────────────┐
│ localStorage │  │ Cookies HTTP   │
│  (padrão)   │  │ (precisa config)│
└─────┬────┘  └──────┬───────┘
     │             │
     │             │
     ↓             ↓
  ✅ Client     ❌ Middleware
  HeaderClient   NÃO consegue
  Lê OK         ler (servidor)
```

---

## ✅ Soluções Implementadas

### Solução 1: Middleware com Detecção Melhorada

**Commit:** [`c83611c`](https://github.com/Junio243/signflow/commit/c83611c)

**O que foi feito:**
- Middleware busca por cookies com padrão `sb-*-auth-token`
- Exclui `code-verifier` (não é token de sessão)
- Adiciona logs de debug

**Código:**
```typescript
function hasSupabaseSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  
  return cookies.some(cookie => {
    const name = cookie.name
    return (
      name.includes('sb-') && 
      name.includes('-auth-token') &&
      !name.includes('code-verifier') &&
      cookie.value &&
      cookie.value.length > 0
    )
  })
}
```

---

### Solução 2: Supabase Client com Cookies

**Commit:** [`ca9afcc`](https://github.com/Junio243/signflow/commit/ca9afcc)

**O que foi feito:**
- Configurado custom storage para usar cookies JavaScript
- Adiciona atributos `secure`, `samesite=lax`, `max-age`

**Código:**
```typescript
createClient(url, anon, {
  auth: {
    storage: {
      getItem: (key) => {
        const cookies = document.cookie.split('; ')
        const cookie = cookies.find(c => c.startsWith(`${key}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
      },
      setItem: (key, value) => {
        const maxAge = 60 * 60 * 24 * 7 // 7 dias
        document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax; secure`
      },
      removeItem: (key) => {
        document.cookie = `${key}=; max-age=0; path=/`
      },
    },
    autoRefreshToken: true,
    persistSession: true,
  },
})
```

---

## 🔧 Solução Definitiva (Futuro)

### Atualizar para `@supabase/ssr`

O Supabase lançou um pacote específico para SSR que gerencia cookies HTTP automaticamente.

**Instalar:**
```bash
npm install @supabase/ssr
```

**Client-side:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server-side:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Middleware:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

---

## 📊 Comparando Abordagens

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|-------------|
| **localStorage** (padrão) | • Simples<br>• Funciona imediatamente | • Não funciona com middleware<br>• Não funciona com SSR |
| **Cookies JavaScript** (atual) | • Compatível com middleware<br>• Lê/escreve cookies | • Cookies acessíveis por JS (menos seguro)<br>• Implementação manual |
| **Cookies HTTP** (@supabase/ssr) | • Mais seguro (httpOnly)<br>• Oficial do Supabase<br>• SSR completo | • Requer instalação do pacote<br>• Migração necessária |

---

## 🔍 Debug: Como Verificar

### 1. Verificar Cookies no Navegador

**Chrome DevTools:**
1. F12 → Application → Cookies
2. Procurar por cookies começando com `sb-`
3. Deve ter pelo menos: `sb-<ref>-auth-token`

### 2. Logs do Middleware

**Console (NODE_ENV=development):**
```
[Middleware] Pathname: /dashboard
[Middleware] All cookies: ['sb-xxx-auth-token', ...]
[Middleware] Has Supabase auth token: true
[Middleware] Auth OK, allowing access
```

### 3. Testar Manualmente

**Console do Navegador:**
```javascript
// Ver cookies
document.cookie

// Ver localStorage (antigo)
localStorage.getItem('sb-xxx-auth-token')

// Ver sessão do Supabase
await supabase.auth.getSession()
```

---

## ✅ Checklist de Verificação

Após fazer login:

- [ ] Email aparece no header? (HeaderClient funciona)
- [ ] Cookies `sb-*-auth-token` estão salvos? (F12 → Application)
- [ ] Middleware permite acesso ao `/dashboard`? (Não redireciona)
- [ ] Logs do middleware mostram "Auth OK"? (Console do servidor)
- [ ] Ao recarregar `/dashboard`, continua logado? (Persistência)

---

## 📝 Próximos Passos

### Curto Prazo:
- [x] Middleware detecta cookies do Supabase
- [x] Supabase client salva em cookies JavaScript
- [ ] Testar em produção
- [ ] Confirmar que loop foi resolvido

### Médio Prazo:
- [ ] Migrar para `@supabase/ssr`
- [ ] Usar cookies httpOnly (mais seguros)
- [ ] Remover custom storage implementation
- [ ] Atualizar documentação

---

## 🔗 Referências

- [Supabase Auth com Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=environment&environment=server)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [MDN: Document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)

---

**Status:** 🚧 **EM PROGRESSÃO** - Solução temporária implementada

**Data:** 14/02/2026

**Impacto:** CRITICAL - Bloqueia acesso ao dashboard
