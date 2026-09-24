# SignFlow

Aplicação para preparar, assinar e compartilhar documentos PDF, com autenticação, editor visual e páginas de validação.

[![CI](https://github.com/Junio243/signflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Junio243/signflow/actions/workflows/ci.yml)
[![Licença GPL-2.0](https://img.shields.io/badge/license-GPL--2.0-blue.svg)](LICENSE)

**[Abrir demonstração](https://signflow-beta.vercel.app/)** · **[Reportar um problema](https://github.com/Junio243/signflow/issues)**

## Fluxo principal

1. Crie uma conta e entre na aplicação.
2. Envie um PDF e configure a assinatura visual e os campos do documento.
3. Gere o documento e consulte sua página de validação por link ou QR Code.

O repositório também contém gerenciamento de certificados, assinatura em lote, organizações, notificações e auditoria. Esses fluxos dependem das tabelas, políticas e credenciais configuradas no ambiente.

## Tecnologias

| Camada | Ferramentas |
| --- | --- |
| Aplicação | Next.js 15, React 18 e TypeScript |
| Interface | Tailwind CSS e Lucide |
| Dados e autenticação | Supabase Auth, PostgreSQL e Storage |
| PDF | pdf-lib, PDF.js e bibliotecas de assinatura PKCS#12 |
| Qualidade | ESLint, TypeScript, Vitest e GitHub Actions |

## Desenvolvimento local

Use Node.js 22 e npm, seguindo a versão utilizada no CI.

~~~sh
git clone https://github.com/Junio243/signflow.git
cd signflow
npm ci
~~~

Copie [.env.example](.env.example) para `.env.local` e configure:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública para autenticação e acesso sujeito às políticas RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa, somente no servidor |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação; localmente, `http://localhost:3000` |
| `SIGNFLOW_ENCRYPTION_KEY` | Segredo persistente para proteger chaves privadas armazenadas |

O nome legado `SUPABASE_SERVICE_ROLE` continua aceito pelo cliente administrativo. Não publique chaves administrativas, certificados privados ou arquivos de ambiente no Git.

Prepare o banco conforme [schema](supabase/schema.sql), [políticas](supabase/policies.sql) e [migrações](supabase/migrations/). Há migrações históricas de correção e reset: revise a sequência para seu ambiente antes de aplicá-las a um banco com dados.

~~~sh
npm run dev
~~~

Abra [localhost:3000](http://localhost:3000).

## Validação antes de publicar

~~~sh
npm run lint
npm run type-check
npm test
npm run build
~~~

O build valida os tipos; o CI bloqueia falhas de lint, tipos, testes e build. Os testes incluem criptografia, validação de arquivos, respostas de erro, configuração do cliente administrativo e autoria do upload.

Para reproduzir a verificação do CI, valores fictícios do Supabase permitem compilar. Eles não permitem testar login, armazenamento ou assinatura contra um backend real.

## Assinaturas e segurança

- A imagem de uma assinatura e o QR Code são elementos visuais. A assinatura criptográfica é uma etapa separada, que exige certificado e configuração apropriados.
- O projeto contém geração de certificados autoassinados. Isso não deve ser apresentado como emissão de certificados ICP-Brasil.
- No upload, o proprietário vem do usuário verificado no servidor; o campo `user_id` enviado pelo navegador não determina a autoria.
- Metadados inválidos são rejeitados antes de gravar arquivos no Storage.
- Proteção de rotas, políticas RLS e autorização nas APIs precisam ser mantidas em conjunto. A presença de headers ou testes unitários não constitui uma auditoria completa de segurança.

## Estrutura

- `app/`: páginas, layouts e rotas da API.
- `components/` e `hooks/`: interface e comportamento reutilizável.
- `lib/`: PDF, certificados, autenticação, validação e serviços.
- `supabase/`: schema, políticas e migrações.
- `tests/`: testes automatizados.
- `docs/`: guias e registros técnicos históricos.

## Contribuições e licença

Abra uma issue com passos para reproduzir o problema ou envie um pull request com a mudança e os testes relevantes. A licença do projeto está em [LICENSE](LICENSE): GPL-2.0.

Desenvolvido por [Alexandre Junio](https://github.com/Junio243).
