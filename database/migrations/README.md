# Migrations do SignFlow

## Estrutura do Banco de Dados

### Tabelas Principais

#### `documents`
- Armazena metadados dos documentos
- Referências aos arquivos no Storage
- Status, expiração, metadados de assinatura

#### `audit_logs`
- Log de auditoria de todas as ações críticas
- Rastreamento de IP, user agent, timestamps
- Detalhes em formato JSON flexível

#### `webhooks`
- Configurações de webhooks dos usuários
- Suporte a múltiplos eventos
- Assinatura HMAC para segurança

#### `user_profiles`
- Perfis complementares dos usuários
- Dados adicionais (empresa, CPF/CNPJ, etc)
- Sincronizado com auth.users

## Como Aplicar Migrations

### Opção 1: Supabase Dashboard

1. Acesse seu projeto no Supabase Dashboard
2. Vá para **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo da migration
5. Execute

### Opção 2: Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com projeto
supabase link --project-ref <seu-project-ref>

# Aplicar migration
supabase db push
```

### Opção 3: Script Node.js

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migration = fs.readFileSync('./004_audit_and_webhooks.sql', 'utf8');

const { error } = await supabase.rpc('exec_sql', { sql: migration });

if (error) {
  console.error('Migration failed:', error);
} else {
  console.log('Migration applied successfully!');
}
```

## Ordem das Migrations

1. `001_initial_schema.sql` - Schema inicial (documents, storage)
2. `002_user_profiles.sql` - Tabela de perfis de usuário
3. `003_validation_enhancements.sql` - Melhorias de validação
4. `004_audit_and_webhooks.sql` - Auditoria e webhooks (esta migration)

## Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** habilitado:

- **audit_logs**: Usuários veem apenas seus próprios logs
- **webhooks**: Usuários gerenciam apenas seus webhooks
- **documents**: Usuários acessam apenas seus documentos

## Backup

Antes de aplicar migrations em produção:

```bash
# Fazer backup do banco
supabase db dump > backup_$(date +%Y%m%d).sql
```

## Rollback

Para reverter uma migration:

```sql
-- Remover tabelas
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS update_webhooks_updated_at() CASCADE;
```

## Suporte

Problemas com migrations? Entre em contato:
- Email: suporte@signflow.com
- Issues: [GitHub](https://github.com/Junio243/signflow/issues)
