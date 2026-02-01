# Sistema de Auditoria - SignFlow

## Visão Geral

O sistema de auditoria registra todos os eventos críticos da aplicação em um banco de dados persistente para rastreabilidade, compliance e análise de segurança.

## Arquitetura

### Tabela de Logs (`audit_logs`)

A tabela `audit_logs` armazena todos os eventos de auditoria com as seguintes informações:

- **created_at**: Timestamp do evento (automático)
- **user_id**: UUID do usuário (opcional, NULL para ações anônimas)
- **action**: Tipo de ação executada
- **resource_type**: Tipo de recurso afetado (document, signature, validation, etc.)
- **resource_id**: UUID do recurso (opcional)
- **ip_hash**: Hash SHA-256 do IP do cliente (privacidade)
- **status**: Status da operação (success, failure, denied, error)
- **details**: Detalhes adicionais em JSON
- **user_agent**: User agent do navegador
- **request_id**: ID da requisição para correlação

### Row Level Security (RLS)

A tabela possui políticas RLS que:
- Permitem apenas service role inserir logs
- Permitem apenas service role ler logs
- **Logs são imutáveis** - não podem ser atualizados ou deletados

## Uso

### Importar a função

```typescript
import { logAudit, extractIpFromRequest } from '@/lib/audit';
```

### Registrar um evento

```typescript
const clientIp = extractIpFromRequest(request);

await logAudit({
  action: 'document.upload',
  resourceType: 'document',
  resourceId: documentId,
  status: 'success',
  userId: user?.id,
  ip: clientIp,
  userAgent: request.headers.get('user-agent') || undefined,
  requestId: reqId,
  details: {
    fileName: 'contract.pdf',
    fileSize: 1024000
  }
});
```

### Tipos de Ação Suportados

#### Operações de Documento
- `document.upload` - Upload de documento
- `document.sign` - Assinatura de documento
- `document.validate` - Validação de documento
- `document.delete` - Exclusão de documento
- `document.download` - Download de documento
- `document.view` - Visualização de documento
- `document.update` - Atualização de documento

#### Autenticação/Autorização
- `auth.login` - Login de usuário
- `auth.logout` - Logout de usuário
- `auth.denied` - Acesso negado
- `auth.failed` - Falha de autenticação

#### Rate Limiting
- `rate_limit.exceeded` - Limite de requisições excedido
- `rate_limit.violation` - Violação de rate limit

#### Segurança
- `security.scan` - Scan de segurança
- `security.violation` - Violação de segurança
- `security.suspicious_activity` - Atividade suspeita

#### Sistema
- `system.error` - Erro de sistema
- `system.cleanup` - Limpeza de dados
- `system.maintenance` - Manutenção do sistema

### Status Suportados

- `success` - Operação concluída com sucesso
- `failure` - Operação falhou
- `denied` - Operação negada (sem permissão)
- `error` - Erro durante a operação

## Consultas Úteis

### Eventos recentes (últimas 24h)

```sql
SELECT * FROM audit_recent
ORDER BY created_at DESC
LIMIT 100;
```

### Eventos de segurança (últimos 7 dias)

```sql
SELECT * FROM audit_security_events
WHERE status IN ('failure', 'denied', 'error')
ORDER BY created_at DESC;
```

### Estatísticas de auditoria

```sql
SELECT * FROM audit_stats
WHERE action LIKE 'document.%'
ORDER BY total_events DESC;
```

### Eventos por IP

```sql
SELECT ip_hash, COUNT(*) as total, 
       COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY ip_hash
ORDER BY total DESC;
```

### Eventos por usuário

```sql
SELECT user_id, action, COUNT(*) as total
FROM audit_logs
WHERE user_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, action
ORDER BY total DESC;
```

## Manutenção

### Limpeza de Logs Antigos

Por padrão, logs são mantidos por 365 dias (1 ano). Para limpar logs mais antigos:

```sql
-- Limpar logs com mais de 1 ano (padrão)
SELECT cleanup_old_audit_logs();

-- Limpar logs com mais de 90 dias
SELECT cleanup_old_audit_logs(90);
```

Recomenda-se configurar um cron job no Supabase para executar essa função periodicamente.

## Performance

### Índices

A tabela possui índices otimizados para as consultas mais comuns:
- `created_at` (DESC) - para consultas temporais
- `user_id` - para consultas por usuário
- `action` - para filtrar por tipo de ação
- `resource_type, resource_id` - para consultas por recurso
- `status` - para filtrar por status
- `ip_hash` - para análise de IPs

### Impacto

O sistema de auditoria é projetado para **não impactar a performance** das requisições:
- Operações de log são assíncronas (não bloqueantes)
- Falhas no log não interrompem o fluxo principal
- Inserções em batch são suportadas para múltiplos eventos

## Segurança

### Privacidade de IPs

IPs dos clientes são hasheados (SHA-256) antes de serem armazenados, garantindo privacidade enquanto mantém a capacidade de rastreamento.

### Imutabilidade

Logs não podem ser atualizados ou deletados através da aplicação, apenas através de funções administrativas SQL, garantindo a integridade dos registros de auditoria.

### Acesso Restrito

Apenas o service role pode inserir e ler logs, garantindo que apenas a aplicação autorizada tenha acesso aos dados de auditoria.

## Integração Atual

O sistema de auditoria está integrado nos seguintes endpoints:

- ✅ `/api/upload` - Upload de documentos
- ✅ `/api/documents/sign` - Assinatura de documentos
- ✅ `/api/documents/validate/[id]` - Validação de documentos
- ✅ `/api/documents/delete` - Exclusão de documentos

## Próximos Passos

- [ ] Implementar rate limiting com audit logging
- [ ] Criar dashboard de auditoria em `/admin/audit`
- [ ] Adicionar alertas para eventos suspeitos
- [ ] Implementar exportação de logs para compliance
- [ ] Adicionar métricas e visualizações
