# Security Headers - SignFlow

Este documento descreve os headers de segurança implementados no middleware da aplicação SignFlow para proteger contra ataques comuns.

## Headers Implementados

### 1. Content-Security-Policy (CSP)

**Objetivo:** Previne ataques XSS (Cross-Site Scripting) e injeção de código malicioso.

**Configuração atual:**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
connect-src 'self';
media-src 'self' blob:;
worker-src 'self' blob:;
```

**Detalhes:**
- `default-src 'self'`: Permite recursos apenas da mesma origem por padrão
- `script-src 'self' 'unsafe-eval' 'unsafe-inline'`: Necessário para Next.js funcionar (desenvolvimento e produção)
- `style-src 'self' 'unsafe-inline'`: Permite estilos inline usados em componentes de erro e loading
- `img-src 'self' data: blob:`: Permite imagens de data URIs e blobs (necessário para preview de PDFs e uploads)
- `font-src 'self' data:`: Permite fontes locais e data URIs
- `object-src 'none'`: Bloqueia plugins como Flash
- `base-uri 'self'`: Restringe a tag `<base>` para prevenir ataques
- `form-action 'self'`: Permite envio de formulários apenas para mesma origem
- `frame-ancestors 'none'`: Previne que o site seja incorporado em iframes
- `upgrade-insecure-requests`: Força upgrade de requisições HTTP para HTTPS
- `connect-src 'self'`: Permite conexões (XHR, WebSocket, etc.) apenas para mesma origem
- `media-src 'self' blob:`: Permite mídia de blobs (necessário para PDFs)
- `worker-src 'self' blob:`: Permite workers de blobs (usado pelo pdf.js)

### 2. X-Frame-Options

**Objetivo:** Previne ataques de clickjacking.

**Configuração:** `DENY`

Impede que o site seja exibido em qualquer iframe, mesmo na mesma origem.

### 3. X-Content-Type-Options

**Objetivo:** Previne MIME type sniffing.

**Configuração:** `nosniff`

Força o navegador a respeitar o tipo MIME declarado, prevenindo que arquivos sejam interpretados incorretamente.

### 4. X-XSS-Protection

**Objetivo:** Ativa a proteção XSS do navegador (legado).

**Configuração:** `1; mode=block`

Embora seja um header legado (substituído pelo CSP), mantemos para compatibilidade com navegadores antigos. Ativa o filtro XSS e bloqueia a página se um ataque for detectado.

### 5. Strict-Transport-Security (HSTS)

**Objetivo:** Força conexões HTTPS.

**Configuração:** `max-age=31536000; includeSubDomains; preload`

- `max-age=31536000`: Força HTTPS por 1 ano (365 dias)
- `includeSubDomains`: Aplica também a todos os subdomínios
- `preload`: Permite inclusão na lista de preload do navegador

### 6. Referrer-Policy

**Objetivo:** Controla informações de referrer enviadas em requisições.

**Configuração:** `strict-origin-when-cross-origin`

Envia o referrer completo para requisições na mesma origem, mas apenas a origem para requisições cross-origin em HTTPS. Não envia nada quando downgrade de HTTPS para HTTP.

## Validação

### Como testar localmente

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Em outro terminal, executar:
curl -I http://localhost:3000 | grep -iE "content-security-policy|x-frame-options|x-content-type-options|x-xss-protection|strict-transport-security|referrer-policy"
```

Você deve ver todos os 6 headers listados.

### Ferramentas de validação recomendadas

1. **Browser DevTools**
   - Chrome/Edge: DevTools → Network → Selecionar qualquer request → Headers
   - Firefox: DevTools → Network → Selecionar qualquer request → Headers

2. **Online Security Header Checkers**
   - [Security Headers](https://securityheaders.com/)
   - [Mozilla Observatory](https://observatory.mozilla.org/)
   - [webhint](https://webhint.io/scanner/)

3. **Command Line**
   ```bash
   curl -I https://seu-dominio.com
   ```

## Funcionalidades Garantidas

✅ **Upload de documentos PDF** - Funciona corretamente com `img-src` e `connect-src` apropriados

✅ **Download de PDFs assinados** - Blob URLs permitidos via `img-src` e `media-src`

✅ **Preview de PDFs** - Workers e blobs permitidos para pdf.js

✅ **Validação de documentos** - API routes funcionam com `connect-src 'self'`

✅ **Estilos da aplicação** - Estilos inline permitidos onde necessário

## Compatibilidade

Os headers implementados são compatíveis com:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers modernos

## Manutenção

### Quando atualizar CSP

Se você adicionar recursos externos (CDNs, APIs, etc.), será necessário atualizar a CSP em `middleware.ts`:

```typescript
// Exemplo: adicionar Google Fonts
"font-src 'self' data: https://fonts.gstatic.com",
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
```

### Monitoramento

Recomenda-se monitorar violações de CSP em produção usando:
- Sentry (já configurado no projeto)
- Report-URI ou similar

Para habilitar relatórios de violação CSP, adicione:
```typescript
"report-uri https://seu-endpoint-de-relatorio"
```

## Referências

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Content Security Policy Reference](https://content-security-policy.com/)
