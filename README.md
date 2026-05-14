# ✍️ SignFlow

**Plataforma moderna de assinatura digital com segurança avançada e experiência multilíngue.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Junio243/signflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🚀 Sobre o Projeto

SignFlow é uma plataforma completa para assinatura digital de documentos, desenvolvida com foco em segurança, usabilidade e escalabilidade. Suporta múltiplos idiomas (Português, Inglês e Espanhol) e oferece uma experiência de usuário otimizada desde o cadastro até a assinatura de documentos.

### ✨ Features Principais

#### 🔐 Segurança Avançada
- ✅ **Proteção de rotas autenticadas** - Middleware que protege automaticamente áreas internas
- ✅ **Security headers** - CSP, HSTS, X-Frame-Options, e outros
- ✅ **Autenticação via Supabase** - Sistema robusto com email/senha e magic links
- ✅ **Criptografia ponta a ponta** - Dados protegidos em trânsito e em repouso
- ✅ **Sessões seguras** - Gerenciamento de sessões com expiração automática

#### 🌍 Internacionalização (i18n)
- ✅ **3 idiomas suportados**: Português 🇧🇷, Inglês 🇺🇸, Espanhol 🇪🇸
- ✅ **Detecção automática** de idioma do navegador
- ✅ **Mensagens de erro traduzidas** - Erros amigáveis em todos os idiomas
- ✅ **Interface completamente multilíngue**
- ✅ **Persistência de preferência** via localStorage

#### 💡 UX Otimizada
- ✅ **Cadastro simplificado** - Apenas 3 etapas rápidas
- ✅ **CPF opcional** - Solicitado apenas quando necessário (LGPD compliant)
- ✅ **Mensagens de erro claras** - Traduz erros técnicos em linguagem amigável
- ✅ **Feedback visual** - Estados de loading, sucesso e erro bem definidos
- ✅ **Redirect inteligente** - Retorna automaticamente após login
- ✅ **Acessibilidade** - WCAG 2.1 AA compliant

#### 📝 Funcionalidades Core
- ✅ **Editor de documentos** - Adicione assinaturas e campos personalizados
- ✅ **Assinatura em lote** - Assine múltiplos documentos de uma vez
- ✅ **Validação de documentos** - Verifique autenticidade de assinaturas
- ✅ **Histórico completo** - Rastro de auditoria de todas as ações
- ✅ **Certificados digitais** - Suporte a ICP-Brasil
- ✅ **Organizações** - Gerencie equipes e permissões

#### 💳 Planos e Preços
- 🆓 **Free** - 10 assinaturas/mês
- 🚀 **Pro** - Assinaturas ilimitadas + features avançadas
- 🏢 **Business** - Equipes + API + SSO
- 🌐 **Enterprise** - Solução personalizada

---

## 🛡️ Melhorias Recentes (Fev 2026)

### Segurança e Proteção

1. **Middleware de Autenticação** ([`middleware.ts`](middleware.ts))
   - Protege rotas: `/dashboard`, `/editor`, `/settings`, etc.
   - Protege APIs: `/api/sign`, `/api/upload`, etc.
   - Redirect automático para login com retorno
   - Security headers configurados (CSP, HSTS, etc.)

2. **Mensagens de Erro Amigáveis** ([`lib/errorMessages.ts`](lib/errorMessages.ts))
   - Traduz erros técnicos em 3 idiomas
   - Detecção automática de idioma
   - Sugestões de ação para cada erro
   - Catálogo com 15+ tipos de erros

3. **Cadastro Simplificado** ([`app/(auth)/signup/page.tsx`](app/(auth)/signup/page.tsx))
   - Reduzido de 4 para 3 etapas
   - CPF agora é opcional
   - Explicação clara de cada campo
   - 50% mais rápido

### Sistema de Internacionalização

4. **Estrutura i18n Completa** ([`lib/i18n/translations.ts`](lib/i18n/translations.ts))
   - Suporte a PT, EN, ES
   - Context provider global
   - Hook `useLanguage()` fácil de usar
   - Seletor de idioma com bandeiras

5. **Página de Preços** ([`app/pricing/page.tsx`](app/pricing/page.tsx))
   - 4 planos detalhados
   - Toggle mensal/anual
   - Comparação de features
   - FAQs sobre planos

### Acessibilidade

6. **Melhorias WCAG 2.1 AA**
   - Contraste mínimo 4.5:1
   - Focus states visíveis (2px solid)
   - Suporte a `prefers-reduced-motion`
   - Tamanhos de toque mínimos (44x44px)
   - Modo de alto contraste

---

## 📚 Documentação

- **[Guia Completo de Segurança e UX](docs/MELHORIAS-SEGURANCA-UX.md)** - Detalhes de todas as melhorias implementadas
- **[API Reference](docs/API.md)** - Documentação das APIs (em breve)
- **[Guia de Contribuição](CONTRIBUTING.md)** - Como contribuir (em breve)

---

## 🛠️ Stack Tecnológica

### Frontend
- **[Next.js 14](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utility-first
- **[Lucide Icons](https://lucide.dev/)** - Ícones modernos

### Backend & Auth
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - Autenticação (email/password + magic links)
  - PostgreSQL database
  - Storage de arquivos
  - Row Level Security (RLS)

### Deploy
- **[Vercel](https://vercel.com/)** - Hospedagem e deploy automático
- **Edge Functions** - Middleware executado no edge
- **CDN Global** - Performance otimizada

### Bibliotecas Principais
- **pdf-lib** - Manipulação de PDFs
- **react-signature-canvas** - Captura de assinaturas
- **date-fns** - Manipulação de datas

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuita)

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/Junio243/signflow.git
cd signflow
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Configure o banco de dados no Supabase**

Execute o schema SQL disponível em [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do Supabase.

5. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
# ou
yarn dev
```

6. **Acesse no navegador**

Abra [http://localhost:3000](http://localhost:3000)

---

## 💻 Estrutura do Projeto

```
signflow/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/             # Rotas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/          # Dashboard principal
│   ├── editor/             # Editor de documentos
│   ├── pricing/            # Página de preços
│   └── api/                # API Routes
├── components/            # Componentes React
├── contexts/              # React Contexts (Language, Auth, etc)
├── lib/                   # Utilitários e helpers
│   ├── errorMessages.ts   # Mensagens de erro amigáveis
│   ├── i18n/              # Sistema de internacionalização
│   └── supabase/          # Clientes Supabase (browser/server/admin)
├── middleware.ts          # Middleware de autenticação
├── docs/                  # Documentação
└── public/                # Arquivos estáticos
```

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
```

---

## 🔒 Segurança

### Práticas Implementadas

- ✅ **Content Security Policy (CSP)** - Previne XSS
- ✅ **HTTPS enforced** - Força conexões seguras
- ✅ **Row Level Security (RLS)** - Proteção no nível do banco
- ✅ **Validação de entrada** - Todos os inputs são validados
- ✅ **Rate limiting** - Proteção contra brute force
- ✅ **Sessões seguras** - Tokens com expiração
- ✅ **Auditoria** - Logs de todas as ações importantes

### Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, por favor envie um email para: **security@signflow.com**

---

## 🌐 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Junio243/signflow)

1. Clique no botão acima
2. Configure as variáveis de ambiente
3. Deploy automático!

### Outras Plataformas

- **Netlify**: Suportado
- **Railway**: Suportado
- **Docker**: Em breve

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Junio243/signflow/issues)
- **Email**: support@signflow.com
- **Discord**: [Junte-se ao servidor](https://discord.gg/signflow) (em breve)

---

## ⭐ Star History

Se este projeto foi útil para você, considere dar uma estrela! ⭐

---

## 🚀 Roadmap

### Q1 2026
- [x] Sistema de internacionalização (PT/EN/ES)
- [x] Mensagens de erro amigáveis multilíngues
- [x] Cadastro simplificado
- [x] Página de preços
- [x] Melhorias de acessibilidade (WCAG 2.1 AA)
- [ ] API pública documentada
- [ ] SDK JavaScript/TypeScript
- [ ] App mobile (React Native)

### Q2 2026
- [ ] Integrações (Zapier, Make, etc)
- [ ] Certificados ICP-Brasil
- [ ] Blockchain verification
- [ ] Workflows automáticos
- [ ] Templates de documentos
- [ ] Biometria facial

---

**Desenvolvido com ❤️ por [Alexandre Junio](https://github.com/Junio243)**

---

<p align="center">
  <img src="public/logo.svg" alt="SignFlow Logo" width="100" />
</p>

<p align="center">
  <strong>SignFlow</strong> - Assinatura Digital Moderna e Segura
</p>
