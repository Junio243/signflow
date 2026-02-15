# Melhorias de UX: Perfil e Assinaturas

## 🐛 Problemas Identificados

### 1️⃣ Assinaturas sem Nome

**Problema:**
```typescript
<div style={{ fontWeight: 600 }}>{sig.name || 'Sem nome'}</div>
```

**Impacto:**
- Confuso para o usuário identificar suas assinaturas
- Dificulta gestão quando há múltiplas assinaturas
- Falta de contexto sobre tipo/origem

**Exemplo:**
```
Galeria:
- Sem nome        [Padrão] [Remover]  ❌ Qual é essa?
- Sem nome        [Definir] [Remover]  ❌ Qual é essa?
- Minha assinatura [Definir] [Remover] ✅ Clara!
```

---

### 2️⃣ Exposição de Nome Completo

**Problema:**
```typescript
// HeaderClient.tsx
const displayName = useMemo(() => {
  if (!user) return null
  return user.user_metadata?.full_name || user.email || 'Usuário'
}, [user])
```

**Impacto:**
- Nome completo visível no header público
- Risco de privacidade (principalmente em capturas de tela)
- Não é necessário expor nome completo

**Exemplo:**
```
❌ "Alexandre Junio Canuto Lopes"
✅ "Alexandre J." ou "A. Lopes"
```

---

### 3️⃣ Links Mal Rotulados no Menu

**Problema:**
```typescript
<HeaderMenuLink href="/profile" ...>Meu perfil</HeaderMenuLink>
<HeaderMenuLink href="/settings" ...>Configurações</HeaderMenuLink>
```

**Impacto:**
- Confusão: qual a diferença entre "Perfil" e "Configurações"?
- Links redundantes ou mal organizados
- Navegação confusa

**Exemplo:**
```
❌ Menu atual:
  - Dashboard
  - Meu perfil        <- O que tem aqui?
  - Certificados
  - Assinar
  - Histórico
  - Verificar
  - Organizações
  - Configurações     <- O que tem aqui?
  
✅ Menu proposto:
  - Dashboard
  - Perfil e Assinaturas
  - Certificados
  - Assinar Documento
  - Histórico
  - Verificar Assinatura
  - Organizações
  - Configurações Avançadas
```

---

### 4️⃣ Inconsistências nos Campos de Perfil

**Problemas:**

1. **Validação inconsistente:**
   - ✅ Telefone: tem validação e formatação
   - ✅ CEP: tem validação e formatação
   - ✅ Email: tem validação
   - ❌ Nome: SEM validação (pode ficar vazio!)

2. **Campos obrigatórios não indicados:**
   ```html
   <label>Nome</label>
   <input value={displayName} ... />
   ```
   ❌ Falta indicar que é obrigatório

3. **Mensagens de erro inconsistentes:**
   - Telefone: "Use o formato (11) 98888-7777."
   - CEP: "Use o formato 00000-000."
   - Nome: (nenhuma mensagem)

---

## ✅ Soluções Propostas

### Solução 1: Nomes Automáticos para Assinaturas

**Implementação:**
```typescript
function generateSignatureName(type: 'draw' | 'upload' | 'certified', index: number): string {
  const baseNames = {
    draw: 'Desenho',
    upload: 'Importada',
    certified: 'Certificada'
  }
  
  const timestamp = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return `${baseNames[type]} - ${timestamp}`
}

// Uso:
const name = generateSignatureName('draw', signatures.length + 1)
// Output: "Desenho - 14/02/2026 21:45"
```

**Alternativa com ícones:**
```typescript
function getSignatureDisplay(sig: SignatureRow) {
  const icons = {
    draw: '✍️',
    upload: '📄',
    certified: '🔒'
  }
  
  const names = {
    draw: 'Assinatura desenhada',
    upload: 'Assinatura importada',
    certified: 'Assinatura certificada'
  }
  
  const icon = icons[sig.type || 'upload']
  const defaultName = names[sig.type || 'upload']
  const date = new Date(sig.created_at).toLocaleDateString('pt-BR')
  
  return {
    icon,
    name: sig.name || `${defaultName} (${date})`,
    description: `Criada em ${date}`
  }
}
```

---

### Solução 2: Abreviar Nome no Header

**Implementação:**
```typescript
// utils/formatName.ts
export function abbreviateName(fullName: string): string {
  if (!fullName || fullName.trim() === '') return 'Usuário'
  
  const parts = fullName.trim().split(/\s+/)
  
  // Se só tem um nome, retorna ele
  if (parts.length === 1) return parts[0]
  
  // "Alexandre Junio Canuto Lopes" -> "Alexandre L."
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  return `${firstName} ${lastInitial}.`
}

// Uso no HeaderClient:
const displayName = useMemo(() => {
  if (!user) return null
  const fullName = user.user_metadata?.full_name || ''
  return abbreviateName(fullName) || user.email?.split('@')[0] || 'Usuário'
}, [user])
```

**Exemplos:**
```
"Alexandre Junio Canuto Lopes" → "Alexandre L."
"Maria Silva"                   → "Maria S."
"João"                          → "João"
""                              → "Usuário"
```

---

### Solução 3: Reorganizar Menu e Labels

**Nova estrutura do menu:**
```typescript
const MENU_ITEMS = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: LayoutDashboard,
    description: 'Visão geral e estatísticas'
  },
  {
    href: '/settings',
    label: 'Perfil e Assinaturas',
    icon: User,
    description: 'Editar perfil e gerenciar assinaturas'
  },
  {
    href: '/sign',
    label: 'Assinar Documento',
    icon: FileSignature,
    description: 'Assinar um documento PDF'
  },
  {
    href: '/verify',
    label: 'Verificar Assinatura',
    icon: ShieldCheck,
    description: 'Validar autenticidade de assinatura'
  },
  {
    href: '/history',
    label: 'Histórico',
    icon: History,
    description: 'Documentos assinados e recebidos'
  },
  {
    href: '/certificates',
    label: 'Certificados',
    icon: Shield,
    description: 'Gerenciar certificados digitais'
  },
  {
    href: '/orgs',
    label: 'Organizações',
    icon: Building2,
    description: 'Gerenciar empresas e equipes'
  },
]
```

**Com tooltips:**
```typescript
<Link
  href={item.href}
  title={item.description}
  aria-label={`${item.label} - ${item.description}`}
>
  <item.icon className="h-4 w-4" />
  <span>{item.label}</span>
</Link>
```

---

### Solução 4: Validar Todos os Campos

**Validação de nome:**
```typescript
function validateDisplayName(value: string): string {
  const trimmed = value.trim()
  let message = ''
  
  if (!trimmed) {
    message = 'Informe seu nome.'
  } else if (trimmed.length < 2) {
    message = 'Nome muito curto (mínimo 2 caracteres).'
  } else if (trimmed.length > 100) {
    message = 'Nome muito longo (máximo 100 caracteres).'
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
    message = 'Use apenas letras e espaços.'
  }
  
  setFormErrors(prev => ({ ...prev, displayName: message }))
  return message === ''
}
```

**Labels com asterisco:**
```tsx
function RequiredLabel({ children }: { children: string }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {children}
      <span className="text-red-600 ml-1" aria-label="campo obrigatório">
        *
      </span>
    </label>
  )
}

// Uso:
<RequiredLabel>Nome completo</RequiredLabel>
<input ... />
```

**Mensagens de ajuda:**
```tsx
<div className="mt-1">
  <input ... />
  {formErrors.displayName ? (
    <p className="text-red-600 text-xs mt-1">
      {formErrors.displayName}
    </p>
  ) : (
    <p className="text-gray-500 text-xs mt-1">
      Como você gostaria de ser chamado?
    </p>
  )}
</div>
```

---

## 📊 Resumo de Melhorias

| Problema | Status Atual | Após Melhoria |
|----------|--------------|----------------|
| **Assinaturas sem nome** | 🔴 "Sem nome" | 🟢 "Desenho - 14/02/2026" |
| **Nome completo exposto** | 🔴 "Alexandre Junio Canuto Lopes" | 🟢 "Alexandre L." |
| **Menu confuso** | 🔴 "Perfil" vs "Configurações" | 🟢 "Perfil e Assinaturas" |
| **Campo nome sem validação** | 🔴 Pode ficar vazio | 🟢 Validação + feedback |
| **Campos obrigatórios** | 🔴 Não indicados | 🟢 Marcados com * |
| **Tooltips ausentes** | 🔴 Sem explicação | 🟢 Descrições claras |

---

## 🚀 Implementação

### Prioridade Alta:
1. ✅ Gerar nomes automáticos para assinaturas
2. ✅ Abreviar nome no header
3. ✅ Validar campo de nome
4. ✅ Marcar campos obrigatórios

### Prioridade Média:
5. ✅ Reorganizar menu
6. ✅ Adicionar tooltips
7. ✅ Melhorar mensagens de erro

### Prioridade Baixa:
8. 🔴 Adicionar ícones visuais para tipos de assinatura
9. 🔴 Permitir renomear assinaturas
10. 🔴 Preview maior de assinaturas

---

## 📝 Checklist de Testes

Após implementação:

- [ ] Criar assinatura desenhada → nome automaticamente gerado
- [ ] Importar assinatura → nome baseado no arquivo ou timestamp
- [ ] Header mostra nome abreviado (não completo)
- [ ] Menu tem labels claras e sem duplicação
- [ ] Tentar salvar perfil sem nome → erro claro
- [ ] Campos obrigatórios marcados com *
- [ ] Mensagens de erro consistentes
- [ ] Tooltips aparecem ao passar mouse

---

**Data:** 14/02/2026  
**Status:** 🚧 Aguardando implementação
