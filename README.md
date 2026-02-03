# SignFlow (MVP) — Assinatura eletrônica de PDFs

A SignFlow é uma aplicação web que permite autenticar usuários via link mágico, coletar assinaturas eletrônicas simples e aplicá-las em documentos PDF com posicionamento visual. O projeto é construído em Next.js, usa Supabase para autenticação/armazenamento e foi preparado para deploy rápido na Vercel.

## ✨ Funcionalidades Principais

✅ **Assinatura Visual** - Arraste e posicione assinaturas em qualquer lugar do PDF
✅ **QR Code de Validação** - Cada documento tem um link único para validação
✅ **🔐 Assinatura Digital PKI** - Certificado digital para validação no Adobe Reader
✅ **Autenticação Sem Senha** - Login via link mágico por email
✅ **Dashboard Completo** - Gerencie todos os seus documentos
✅ **Assinatura em Lote** - Assine múltiplos documentos de uma vez
✅ **Rate Limiting** - Proteção contra abuso e ataques

## 🔐 Assinatura Digital com Certificado PKI

**NOVO!** Todos os PDFs agora podem ser assinados com **certificado digital PKI**, tornando-os verificáveis nativamente no Adobe Reader e outros leitores de PDF.

### Benefícios da Assinatura Digital:

- ✅ **Selo azul de validação** no Adobe Reader
- ✅ **Criptografia PKCS#7** padrão ICP-Brasil
- ✅ **Validade jurídica plena** (com certificado ICP-Brasil)
- ✅ **Prova de integridade** criptográfica
- ✅ **Não-repúdio** - assinante não pode negar autoria

### Configuração Rápida:

```bash
# 1. Gerar certificado de teste (desenvolvimento)
npm run generate-certificate

# 2. Configurar senha no .env.local
echo "CERTIFICATE_PASSWORD=signflow2026" >> .env.local

# 3. Testar
npm run dev
```

📚 **Documentação completa**: [DIGITAL_SIGNATURE.md](./DIGITAL_SIGNATURE.md)

## 1) Pré‑requisitos
- Conta **Supabase** (Free). Crie um projeto e ative **Auth (Email magic link)** e **Storage**.
- Configure **SMTP** em Auth (ex.: Resend Free) e defina o remetente.
- Crie o bucket público **`signflow`** no Storage.
- Preencha `.env` seguindo o modelo de `.env.example` com as chaves do Supabase/Resend.

## 2) Como usar localmente
```bash
npm install
npm run dev
# abra http://localhost:3000
```
Faça login com seu e‑mail para receber o link mágico, envie um PDF e uma imagem de assinatura (PNG/JPG), posicione a assinatura nas páginas e baixe a versão assinada.

## 3) Deploy grátis (Vercel)
- Importe o repositório na Vercel e adicione as variáveis de ambiente (`NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE`, `RESEND_API_KEY`).
- O arquivo **vercel.json** já define um cron diário para limpeza em `/api/cleanup`.
- Após o deploy, o fluxo de login/assinatura/validação funciona igual à versão local.

## 4) Fluxo da aplicação
1. Login via **link mágico** (sem senha).
2. Upload do PDF e da assinatura (PNG/JPG).
3. Posicionamento visual da assinatura (arrastar, redimensionar, rotacionar).
4. Geração de QR dinâmico para `/validate/{id}` e inserção no rodapé da última página.
5. **🆕 Aplicação de assinatura digital PKI** (se certificado configurado).
6. Download do PDF assinado, histórico no Dashboard e validação pública.
7. Expiração automática de documentos em 7 dias.

## 5) Observação legal (Brasil/DF)

### Assinatura Eletrônica Simples
A assinatura gerada por padrão (visual + QR Code) é uma **assinatura eletrônica simples**.

### Assinatura Digital Qualificada (ICP-Brasil)
Com certificado digital ICP-Brasil (e-CPF/e-CNPJ), os documentos têm **validade jurídica plena** reconhecida pela MP 2.200-2/2001.

⚠️ **Importante**: Para atos formais com órgãos como **GDF/SEI‑DF**, geralmente é exigida assinatura **ICP‑Brasil (qualificada)**.

## 6) Rate Limiting (Proteção contra Abuso)

A aplicação implementa **rate limiting** nas APIs críticas para proteger contra abuso, força bruta e ataques DDoS:

### Limites por Endpoint

| Endpoint | Limite | Janela | Descrição |
|----------|--------|--------|-----------|
| `/api/upload` | 10 requests | 1 hora | Upload de documentos |
| `/api/sign` | 20 requests | 1 hora | Assinatura de documentos |
| `/api/batch-sign` | 5 requests | 1 hora | Assinatura em lote |
| `/api/validate/[id]` | 30 requests | 5 minutos | Validação de documentos |

### Headers de Rate Limit

Todas as respostas incluem os seguintes headers informativos:

- `X-RateLimit-Limit`: Número máximo de requests permitidos
- `X-RateLimit-Remaining`: Número de requests restantes na janela atual
- `X-RateLimit-Reset`: Timestamp (em ms) de quando o limite será resetado
- `Retry-After`: Segundos até poder tentar novamente (apenas em respostas 429)

### Resposta ao Exceder o Limite

Quando o limite é excedido, a API retorna:
- **Status**: `429 Too Many Requests`
- **Corpo**: `{ "error": "mensagem descritiva", "retryAfter": segundos }`
- Violações são registradas nos logs para análise de segurança

### Implementação

O rate limiting usa cache em memória com limpeza automática de entradas expiradas. Para produção em escala, considere integrar com **Vercel KV** ou **Redis** para state compartilhado entre instâncias serverless.

## 7) Documentação Adicional

- 🔐 [Assinatura Digital PKI](./DIGITAL_SIGNATURE.md) - Guia completo sobre certificados digitais
- 📚 [Issues](https://github.com/Junio243/signflow/issues) - Reporte bugs e sugira melhorias

## 8) Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **Supabase** - Backend (Auth + Storage + Database)
- **pdf-lib** - Manipulação de PDFs
- **@signpdf/signpdf** - Assinatura digital PKI
- **Tailwind CSS** - Estilização
- **Vercel** - Deploy e hosting
