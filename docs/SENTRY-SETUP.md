# Configuração do Sentry no SignFlow

## ✅ O que já está configurado

- ✅ Arquivos de configuração do Sentry (client + server)
- ✅ Endpoint de health check em `/api/health`
- ✅ Next.js integrado com Sentry
- ✅ Session Replay para gravar erros
- ✅ Performance monitoring

## 🔑 Próximos passos obrigatórios

### 1. Criar conta no Sentry (Grátis)

1. Acesse: [sentry.io/signup](https://sentry.io/signup/)
2. Crie conta gratuita (5.000 erros/mês grátis)
3. Crie novo projeto:
   - Plataforma: **Next.js**
   - Nome: **SignFlow**
4. Copie o **DSN** que aparecer (ex: `https://abc123@o456.ingest.sentry.io/789`)

### 2. Adicionar variáveis na Vercel

Acesse: [vercel.com/seu-usuario/signflow/settings/environment-variables](https://vercel.com)

Adicione as seguintes variáveis:

**Obrigatória:**
```
NEXT_PUBLIC_SENTRY_DSN = https://seu-codigo@sentry.io/seu-projeto
```

**Opcionais (para upload de source maps):**
```
SENTRY_ORG = seu-username-sentry
SENTRY_PROJECT = signflow
SENTRY_AUTH_TOKEN = (gerar em sentry.io/settings/auth-tokens/)
```

### 3. Adicionar no `.env.local` (desenvolvimento local)

Crie/atualize o arquivo `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://seu-codigo@sentry.io/seu-projeto
SENTRY_ORG=seu-username
SENTRY_PROJECT=signflow
```

### 4. Instalar dependência

No seu projeto local:

```bash
npm install @sentry/nextjs
```

### 5. Fazer deploy

Após adicionar as variáveis na Vercel:

```bash
git pull origin main
npm install
git push
```

Ou force um redeploy na Vercel.

## 🧪 Testar se está funcionando

### Health Check

Acesse: `https://seu-site.vercel.app/api/health`

Deve retornar JSON:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T...",
  "uptime": 123.45,
  "services": {
    "supabase": "healthy"
  },
  "responseTime": "42ms"
}
```

### Sentry

1. Acesse seu dashboard do Sentry
2. Você deve ver eventos começando a aparecer
3. Para testar um erro de propósito, adicione em qualquer página:

```typescript
// Testar erro
throw new Error('Teste do Sentry!');
```

O erro aparecerá no dashboard em segundos!

## 📊 Monitoramento com Upptime (Opcional)

Para monitorar o health check automaticamente:

1. Use o template: [github.com/upptime/upptime](https://github.com/upptime/upptime)
2. Configure o endpoint `/api/health` no `.upptimerc.yml`
3. Upptime vai fazer ping a cada 5 minutos
4. Status page público gratuito!

## 🐛 O que o Sentry rastreia

- ❌ **Erros de JavaScript** (client-side)
- ❌ **Erros de API** (server-side)
- ❌ **Erros não tratados** (unhandled exceptions)
- 🎬 **Session Replay** (gravações de sessões com erro)
- ⏱️ **Performance** (tempo de carregamento, APIs lentas)
- 📈 **Breadcrumbs** (ações do usuário antes do erro)

## 🚨 Alertas

Configure alertas no Sentry:
- **Email**: Receba emails quando erros novos aparecerem
- **Slack/Discord**: Integre com seu time
- **GitHub Issues**: Crie issues automaticamente

## ✅ Plano Gratuito (Developer)

- 5.000 erros/mês
- 50 session replays
- 1 usuário
- Retenção de 90 dias
- Alertas por email

Para o SignFlow em MVP, isso é **mais que suficiente**!

## 🔗 Links Úteis

- Dashboard Sentry: [sentry.io/organizations/seu-org/issues/](https://sentry.io)
- Docs: [docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Health Check: `https://seu-site.vercel.app/api/health`

---

**Dúvidas?** Consulte a [documentação oficial](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
