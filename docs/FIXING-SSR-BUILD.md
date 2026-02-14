# Resolução do Erro de Build SSR

## 🐛 Problema Encontrado

### Erro no Build:
```
Error occurred prerendering page "/pricing". Read more: https://nextjs.org/docs/messages/prerender-error
Error: useLanguage must be used within a LanguageProvider
```

### Causa:
A página `/pricing` estava usando `useLanguage()` mas o `LanguageProvider` não estava configurado no layout raiz. Além disso, o Context estava tentando acessar `localStorage` e `navigator` durante o **server-side rendering (SSR)**, o que não é possível.

---

## ✅ Solução Implementada

### 1️⃣ Criado Componente de Providers

**Arquivo:** `app/providers.tsx`

```typescript
'use client'

import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}
```

### 2️⃣ Adicionado ao Layout Raiz

**Arquivo:** `app/layout.tsx`

```typescript
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {/* Todo o conteúdo da aplicação */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 3️⃣ Tornado LanguageContext Compatível com SSR

**Arquivo:** `lib/i18n/LanguageContext.tsx`

**Mudanças aplicadas:**

```typescript
// ✅ Verificar se está no navegador antes de acessar localStorage
if (typeof window !== 'undefined') {
  try {
    const savedLocale = localStorage.getItem('signflow-locale')
    // ...
  } catch (error) {
    console.warn('Failed to access localStorage:', error)
  }
}

// ✅ Try-catch para APIs do navegador
try {
  const browserLang = navigator.language.split('-')[0]
  // ...
} catch (error) {
  console.warn('Failed to detect browser language:', error)
}
```

---

## 📝 Commits da Correção

1. **`39d5cf8`** - Cria Providers component
2. **`9a291fc`** - Adiciona Providers ao layout raiz
3. **`2eaa4ba`** - Torna LanguageContext compatível com SSR

---

## 🛡️ Como Evitar Erros Similares

### Regras para Contexts no Next.js 14+

#### 1. Sempre use `'use client'` em Contexts
```typescript
'use client'

import { createContext } from 'react'
```

#### 2. Verifique `typeof window` antes de APIs do navegador
```typescript
// ❌ ERRADO - Pode quebrar no SSR
const saved = localStorage.getItem('key')

// ✅ CORRETO - Funciona no SSR e no cliente
const saved = typeof window !== 'undefined' 
  ? localStorage.getItem('key') 
  : null
```

#### 3. Use useEffect para código client-only
```typescript
useEffect(() => {
  // Este código só roda no cliente
  const saved = localStorage.getItem('key')
  // ...
}, [])
```

#### 4. Sempre envolva a aplicação com Providers no layout raiz
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers> {/* 👈 Importante! */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

#### 5. Crie um arquivo separado para Providers
```typescript
// app/providers.tsx
'use client'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
```

---

## 🔍 APIs do Navegador que NÃO funcionam no SSR

Estas APIs causam erro se usadas fora de `useEffect` ou sem verificação:

- ❌ `localStorage`
- ❌ `sessionStorage`
- ❌ `navigator`
- ❌ `window`
- ❌ `document`
- ❌ `location`

**Solução:** Sempre use `typeof window !== 'undefined'` ou coloque dentro de `useEffect`

---

## 🎯 Checklist de Pre-render

Antes de fazer deploy, verifique:

- [ ] Todos os Contexts estão marcados com `'use client'`
- [ ] Layout raiz envolve children com `<Providers>`
- [ ] Nenhum código acessa `localStorage` sem verificar `typeof window`
- [ ] Nenhum código acessa `navigator` sem verificar `typeof window`
- [ ] `useEffect` é usado para lógica client-only
- [ ] Build local funciona: `npm run build`
- [ ] Nenhum erro de pre-render no console

---

## 💡 Dicas Extras

### Testar localmente:
```bash
npm run build
# Deve concluir sem erros

npm run start
# Testar a versão de produção
```

### Debug de SSR:
Adicione logs com verificação:
```typescript
if (typeof window !== 'undefined') {
  console.log('Running on client')
} else {
  console.log('Running on server')
}
```

### Inicialização segura:
```typescript
const [value, setValue] = useState(() => {
  // Esta função só roda uma vez
  if (typeof window !== 'undefined') {
    return localStorage.getItem('key') || 'default'
  }
  return 'default'
})
```

---

## 🔗 Referências

- [Next.js - Rendering: Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js - Pre-rendering Error](https://nextjs.org/docs/messages/prerender-error)
- [React - useEffect Hook](https://react.dev/reference/react/useEffect)

---

**Status:** ✅ **RESOLVIDO**

**Data:** 14/02/2026
