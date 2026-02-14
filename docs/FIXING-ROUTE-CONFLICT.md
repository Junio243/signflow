# Resolução: Conflito page.tsx vs route.ts

## 🐛 Problema Encontrado

### Erro no Build:
```
You cannot have two parallel pages that resolve to the same path.
Please check /auth/callback/page and /auth/callback/route.
```

### Causa:
No Next.js 14+ App Router, **NÃO é permitido** ter tanto `page.tsx` quanto `route.ts` na mesma rota.

---

## 📚 Entendendo page.tsx vs route.ts

### 📄 `page.tsx` - Páginas React

**Uso:** Para renderizar páginas HTML com componentes React

**Exemplo:**
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>
}
```

**Quando usar:**
- Páginas com interface visual
- Formulários
- Dashboards
- Landing pages

---

### 🔧 `route.ts` - API Routes

**Uso:** Para criar endpoints de API (JSON, redirect, etc)

**Exemplo:**
```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ users: [] })
}

export async function POST(request: Request) {
  const data = await request.json()
  return NextResponse.json({ success: true })
}
```

**Quando usar:**
- Endpoints de API
- Webhooks
- Callbacks de OAuth/Auth
- Redirects programáticos
- Processamento de dados sem UI

---

## ✅ Solução

### Caso: Callback de Autenticação

**Problema:**
- Existia `app/auth/callback/page.tsx`
- Criei `app/auth/callback/route.ts`
- Next.js não permite os dois

**Solução:**
- ❌ Deletar `page.tsx`
- ✅ Manter apenas `route.ts`

**Por quê?**
- Callback de auth não precisa de UI
- Só precisa processar o `code` e redirecionar
- `route.ts` é mais apropriado

**Commit:** [`dd89f7b`](https://github.com/Junio243/signflow/commit/dd89f7b)

---

## 📝 Regras do Next.js 14+ App Router

### ⛔ Proibido na Mesma Rota:
```
app/auth/callback/
  ├── page.tsx     ❌
  └── route.ts     ❌
```
⚠️ **ERRO:** Next.js vai falhar o build!

---

### ✅ Opção 1: Apenas Page
```
app/auth/callback/
  └── page.tsx     ✅ Para renderizar UI
```

**Use quando:**
- Quer mostrar uma página de loading
- Quer exibir mensagem de sucesso/erro
- Precisa de interface visual

**Exemplo:**
```typescript
// page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Processar callback
    processAuth().then(() => {
      router.push('/dashboard')
    })
  }, [])
  
  return <div>Processando...</div>
}
```

---

### ✅ Opção 2: Apenas Route
```
app/auth/callback/
  └── route.ts     ✅ Para API/redirect
```

**Use quando:**
- Não precisa mostrar nada ao usuário
- Quer processar e redirecionar imediatamente
- É um webhook ou callback de terceiro

**Exemplo:**
```typescript
// route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  
  // Processar
  await processAuth(code)
  
  // Redirect
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

## 🔍 Como Detectar o Problema

### Durante Desenvolvimento:
```bash
npm run dev
# Verifica automaticamente
```

### Durante Build:
```bash
npm run build
# Erro:
# "You cannot have two parallel pages that resolve to the same path"
```

### Encontrar Arquivos Duplicados:
```bash
# Procurar rotas com ambos page e route
find app -type d -exec sh -c 'ls "$1"/page.* "$1"/route.* 2>/dev/null | head -n 2 | wc -l | grep -q 2 && echo "$1"' _ {} \;
```

---

## 🛠️ Como Resolver

### Passo 1: Decidir Qual Tipo Precisa

**Precisa de UI?**
- ✅ Sim → Use `page.tsx`, delete `route.ts`
- ❌ Não → Use `route.ts`, delete `page.tsx`

### Passo 2: Deletar o Arquivo Extra

```bash
# Se decidir por page.tsx
rm app/sua-rota/route.ts

# Se decidir por route.ts
rm app/sua-rota/page.tsx
```

### Passo 3: Verificar Build

```bash
npm run build
# Deve compilar sem erros
```

---

## 💡 Casos Comuns

### 1. Callback de Auth (OAuth, Magic Link)
**Recomendação:** `route.ts`

**Por quê:**
- Não precisa de UI
- Processa code e redireciona
- Mais rápido e eficiente

---

### 2. Webhook de Pagamento
**Recomendação:** `route.ts`

**Por quê:**
- Recebe POST de serviço externo
- Processa dados
- Retorna JSON

---

### 3. Formulário de Contato
**Recomendação:** `page.tsx` + API separada

**Estrutura:**
```
app/
  contato/
    page.tsx           # Formulário visual
  api/
    contato/
      route.ts         # Processa envio
```

---

### 4. Página de Sucesso/Erro
**Recomendação:** `page.tsx`

**Por quê:**
- Exibe mensagem ao usuário
- Tem botões e links
- Precisa de UI

---

## 📊 Checklist de Prevenção

- [ ] Planejar se a rota precisa de UI antes de criar arquivos
- [ ] Se for callback/webhook, criar apenas `route.ts`
- [ ] Se for página visual, criar apenas `page.tsx`
- [ ] Rodar `npm run build` localmente antes de commit
- [ ] Adicionar lint rule para detectar duplicatas (futuro)

---

## 🔗 Referências

- [Next.js - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js - Pages](https://nextjs.org/docs/app/building-your-application/routing/pages)
- [Next.js - Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

**Status:** ✅ **RESOLVIDO**

**Data:** 14/02/2026

**Solução:** Deletado `page.tsx` duplicado, mantido apenas `route.ts`
