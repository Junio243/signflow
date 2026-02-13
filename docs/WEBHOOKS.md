# Guia de Integração - Webhooks SignFlow

## Introdução

Webhooks permitem que sua aplicação receba notificações em tempo real quando eventos ocorrem no SignFlow.

## Eventos Disponíveis

| Evento | Descrição |
|--------|------------|
| `document.uploaded` | Documento foi feito upload |
| `document.signed` | Documento foi assinado |
| `document.validated` | Documento foi validado por terceiro |
| `document.deleted` | Documento foi excluído |
| `signature.created` | Nova assinatura foi criada |
| `user.created` | Novo usuário se cadastrou |

## Configurando Webhooks

### Via Dashboard (Planejado)

1. Acesse **Dashboard** > **Configurações** > **Webhooks**
2. Clique em **Novo Webhook**
3. Digite a URL de destino
4. Selecione os eventos desejados
5. Salve e copie o **Secret** (mostrado apenas uma vez)

### Via API

#### Criar Webhook

```bash
POST /api/webhooks
Authorization: Bearer {seu-token}
Content-Type: application/json

{
  "url": "https://sua-api.com/webhooks/signflow",
  "events": [
    "document.uploaded",
    "document.signed"
  ]
}
```

**Resposta:**

```json
{
  "webhook": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://sua-api.com/webhooks/signflow",
    "events": ["document.uploaded", "document.signed"],
    "active": true,
    "created_at": "2026-02-13T18:00:00Z"
  },
  "secret": "a1b2c3d4e5f6..." // Secret para assinatura HMAC
}
```

**⚠️ IMPORTANTE**: Salve o `secret` imediatamente. Ele é mostrado apenas na criação.

#### Listar Webhooks

```bash
GET /api/webhooks
Authorization: Bearer {seu-token}
```

**Resposta:**

```json
{
  "webhooks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://sua-api.com/webhooks/signflow",
      "events": ["document.uploaded", "document.signed"],
      "active": true,
      "created_at": "2026-02-13T18:00:00Z"
    }
  ]
}
```

#### Deletar Webhook

```bash
DELETE /api/webhooks?id={webhook-id}
Authorization: Bearer {seu-token}
```

## Recebendo Webhooks

### Estrutura da Payload

```json
{
  "event": "document.signed",
  "timestamp": "2026-02-13T18:30:00Z",
  "userId": "user-uuid",
  "data": {
    "documentId": "doc-uuid",
    "fileName": "contrato.pdf",
    "signaturesCount": 2
  }
}
```

### Headers da Requisição

```http
Content-Type: application/json
X-SignFlow-Signature: sha256=abc123...
X-SignFlow-Event: document.signed
User-Agent: SignFlow-Webhooks/1.0
```

## Validando Assinatura HMAC

Para garantir que o webhook veio do SignFlow, valide a assinatura HMAC.

### Node.js

```javascript
import crypto from 'crypto';

function validateWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

// Express.js exemplo
app.post('/webhooks/signflow', (req, res) => {
  const signature = req.headers['x-signflow-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.SIGNFLOW_WEBHOOK_SECRET;
  
  if (!validateWebhook(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar webhook
  const { event, data } = req.body;
  console.log(`Received event: ${event}`, data);
  
  res.status(200).json({ received: true });
});
```

### Python

```python
import hmac
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)
SECRET = 'seu-webhook-secret'

def validate_webhook(payload, signature):
    expected = 'sha256=' + hmac.new(
        SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature == expected

@app.route('/webhooks/signflow', methods=['POST'])
def webhook():
    signature = request.headers.get('X-SignFlow-Signature')
    payload = request.get_data(as_text=True)
    
    if not validate_webhook(payload, signature):
        return {'error': 'Invalid signature'}, 401
    
    data = request.json
    print(f"Received event: {data['event']}", data['data'])
    
    return {'received': True}, 200
```

### PHP

```php
<?php
$secret = getenv('SIGNFLOW_WEBHOOK_SECRET');
$signature = $_SERVER['HTTP_X_SIGNFLOW_SIGNATURE'];
$payload = file_get_contents('php://input');

$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (!hash_equals($signature, $expectedSignature)) {
    http_response_code(401);
    die(json_encode(['error' => 'Invalid signature']));
}

$data = json_decode($payload, true);
echo json_encode(['received' => true]);
```

## Exemplos de Payloads

### document.uploaded

```json
{
  "event": "document.uploaded",
  "timestamp": "2026-02-13T18:00:00Z",
  "userId": "user-uuid",
  "data": {
    "documentId": "doc-uuid",
    "fileName": "contrato.pdf"
  }
}
```

### document.signed

```json
{
  "event": "document.signed",
  "timestamp": "2026-02-13T18:30:00Z",
  "userId": "user-uuid",
  "data": {
    "documentId": "doc-uuid",
    "fileName": "contrato.pdf",
    "signaturesCount": 2
  }
}
```

### document.validated

```json
{
  "event": "document.validated",
  "timestamp": "2026-02-13T19:00:00Z",
  "userId": "user-uuid",
  "data": {
    "documentId": "doc-uuid",
    "validatedBy": "192.168.1.100"
  }
}
```

## Integração com Zapier

1. No Zapier, crie um novo Zap
2. Escolha **Webhooks by Zapier** como trigger
3. Selecione **Catch Hook**
4. Copie a URL gerada pelo Zapier
5. Configure o webhook no SignFlow com essa URL
6. Teste enviando um documento
7. Configure a ação desejada (enviar email, criar tarefa, etc)

## Integração com Make.com (Integromat)

1. Crie um novo Scenario
2. Adicione módulo **Webhooks** > **Custom Webhook**
3. Crie um novo webhook e copie a URL
4. Configure no SignFlow
5. Adicione módulos para processar o evento

## Boas Práticas

### Idempotência

Webhooks podem ser enviados mais de uma vez. Implemente idempotência:

```javascript
const processedEvents = new Set();

app.post('/webhooks/signflow', (req, res) => {
  const eventId = `${req.body.event}-${req.body.data.documentId}-${req.body.timestamp}`;
  
  if (processedEvents.has(eventId)) {
    return res.status(200).json({ received: true, duplicate: true });
  }
  
  // Processar evento
  processedEvents.add(eventId);
  
  res.status(200).json({ received: true });
});
```

### Resposta Rápida

Responda rapidamente (< 5 segundos) e processe de forma assíncrona:

```javascript
app.post('/webhooks/signflow', async (req, res) => {
  // Responder imediatamente
  res.status(200).json({ received: true });
  
  // Processar assíncronamente
  processWebhookAsync(req.body).catch(console.error);
});
```

### Retry Logic

Se seu endpoint falhar, o SignFlow tentará reenviar:

- 1ª tentativa: imediata
- 2ª tentativa: após 5 minutos
- 3ª tentativa: após 1 hora
- 4ª tentativa: após 24 horas

### Logging

Registre todos os webhooks recebidos:

```javascript
app.post('/webhooks/signflow', (req, res) => {
  console.log('Webhook received:', {
    event: req.body.event,
    timestamp: req.body.timestamp,
    data: req.body.data
  });
  
  res.status(200).json({ received: true });
});
```

## Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL está acessível publicamente
2. Verifique se está usando HTTPS (recomendado)
3. Verifique logs do seu servidor
4. Teste com ferramentas como [webhook.site](https://webhook.site)

### Assinatura inválida

1. Verifique se está usando o secret correto
2. Valide que está usando o body raw (não parsed)
3. Verifique se está comparando `sha256=` no início

### Timeout

1. Responda rapidamente (< 5s)
2. Processe de forma assíncrona
3. Use fila (Redis, RabbitMQ) se necessário

## Suporte

Problemas com webhooks?

- **Email**: suporte@signflow.com
- **GitHub Issues**: [github.com/Junio243/signflow/issues](https://github.com/Junio243/signflow/issues)
