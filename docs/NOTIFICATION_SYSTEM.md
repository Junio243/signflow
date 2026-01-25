# 🔔 Sistema de Notificações - SignFlow

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso Básico](#uso-básico)
- [Componentes](#componentes)
- [Tipos de Notificação](#tipos-de-notificação)
- [API](#api)
- [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Sistema completo de notificações com:

✅ **Múltiplos canais:** Email, in-app, push (futuro), SMS (futuro)  
✅ **Real-time:** Atualizações instantâneas via Supabase Realtime  
✅ **Preferências:** Usuários controlam o que recebem  
✅ **Priorização:** Low, normal, high, urgent  
✅ **Tracking:** Sabe quando foi lida e clicada  

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install date-fns
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Resend (Email Service)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
FROM_EMAIL="SignFlow <noreply@signflow.app>"
```

> **Como obter RESEND_API_KEY:**
> 1. Acesse [resend.com](https://resend.com)
> 2. Crie uma conta gratuita (100 emails/dia)
> 3. Vá em API Keys → Create API Key

### 3. Executar SQL no Supabase

1. Acesse seu projeto no [Supabase](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/004_notifications_system.sql`
4. Clique em **Run**

---

## ⚙️ Configuração

### Adicionar NotificationBell ao Layout

Em `app/layout.tsx` ou no seu header:

```tsx
import NotificationBell from '@/app/components/notifications/NotificationBell'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <header>
          {/* Outros componentes */}
          <NotificationBell />
        </header>
        {children}
      </body>
    </html>
  )
}
```

---

## 🚀 Uso Básico

### Enviar Notificação Simples

```typescript
import { NotificationService } from '@/lib/notifications/notification-service'

// Exemplo: Documento pronto
await NotificationService.send({
  type: 'document_ready',
  user_id: 'uuid-do-usuario',
  title: 'Documento pronto para assinar! 📝',
  message: 'Seu documento "contrato.pdf" já está disponível para assinatura.',
  priority: 'high',
  action_url: '/editor/abc123',
  action_label: 'Assinar agora',
})
```

### Enviar Lote de Notificações

```typescript
await NotificationService.sendBatch([
  {
    type: 'signature_received',
    user_id: 'user-1',
    title: 'Assinatura recebida',
    message: 'Maria assinou seu documento.',
  },
  {
    type: 'signature_received',
    user_id: 'user-2',
    title: 'Assinatura recebida',
    message: 'João assinou seu documento.',
  },
])
```

---

## 🧩 Componentes

### NotificationBell

**Sino com contador de não lidas**

```tsx
import NotificationBell from '@/app/components/notifications/NotificationBell'

<NotificationBell />
```

### NotificationCenter

**Modal com lista de notificações**

Usado automaticamente pelo `NotificationBell`, mas pode ser usado separadamente:

```tsx
import NotificationCenter from '@/app/components/notifications/NotificationCenter'

const [isOpen, setIsOpen] = useState(false)

<NotificationCenter 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  userId="user-uuid"
/>
```

### NotificationToast

**Toast para notificações em tempo real**

```tsx
import NotificationToast from '@/app/components/notifications/NotificationToast'

const [notification, setNotification] = useState<Notification | null>(null)

{notification && (
  <NotificationToast
    notification={notification}
    onClose={() => setNotification(null)}
    duration={5000}
  />
)}
```

---

## 📮 Tipos de Notificação

```typescript
type NotificationType = 
  | 'document_ready'        // Documento pronto para assinar
  | 'signature_received'    // Assinatura recebida
  | 'document_expiring'     // Documento expirando em breve
  | 'document_expired'      // Documento expirado
  | 'document_cancelled'    // Documento cancelado
  | 'signature_request'     // Solicitação de assinatura
  | 'validation_viewed'     // Alguém visualizou validação
  | 'system_update'         // Atualização do sistema
  | 'welcome'               // Boas-vindas
  | 'reminder'              // Lembrete genérico
```

### Prioridades

```typescript
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
```

- **low**: Informações gerais (azul)
- **normal**: Notificações padrão (verde)
- **high**: Requer atenção (laranja)
- **urgent**: Crítico (vermelho)

---

## 🔌 API

### NotificationService

#### `send(payload: NotificationPayload)`
Envia uma notificação.

```typescript
const result = await NotificationService.send({
  type: 'document_ready',
  user_id: 'uuid',
  title: 'Título',
  message: 'Mensagem',
  priority: 'normal',
  channels: ['email', 'in_app'],
  action_url: '/link',
  action_label: 'Ver',
})
```

#### `sendBatch(payloads: NotificationPayload[])`
Envia múltiplas notificações.

#### `getUserNotifications(userId, options?)`
Busca notificações do usuário.

```typescript
const notifications = await NotificationService.getUserNotifications(
  'user-id',
  { unreadOnly: true, limit: 10 }
)
```

#### `markAsRead(notificationId)`
Marca como lida.

#### `markAllAsRead(userId)`
Marca todas como lidas.

#### `deleteNotification(notificationId)`
Deleta notificação.

#### `getUserPreferences(userId)`
Busca preferências do usuário.

#### `updatePreferences(userId, preferences)`
Atualiza preferências.

```typescript
await NotificationService.updatePreferences('user-id', {
  email_enabled: true,
  document_expiring: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
})
```

---

## 💡 Exemplos de Uso Real

### 1. Documento Assinado com Sucesso

```typescript
// app/api/documents/sign/route.ts
import { NotificationService } from '@/lib/notifications/notification-service'

export async function POST(request: Request) {
  // ... lógica de assinatura ...
  
  // Notificar o dono do documento
  await NotificationService.send({
    type: 'signature_received',
    user_id: document.owner_id,
    title: 'Nova assinatura recebida! ✅',
    message: `${signerName} assinou o documento "${document.name}".`,
    priority: 'normal',
    action_url: `/documents/${document.id}`,
    action_label: 'Ver documento',
  })
  
  return Response.json({ success: true })
}
```

### 2. Documento Expirando (Cron Job)

```typescript
// app/api/cron/check-expiring/route.ts
import { NotificationService } from '@/lib/notifications/notification-service'

export async function GET(request: Request) {
  // Buscar documentos expirando em 24h
  const expiringDocs = await getExpiringDocuments()
  
  // Notificar em lote
  await NotificationService.sendBatch(
    expiringDocs.map(doc => ({
      type: 'document_expiring',
      user_id: doc.owner_id,
      title: '⏰ Documento expirando em breve',
      message: `Seu documento "${doc.name}" expira em 24 horas.`,
      priority: 'urgent',
      action_url: `/documents/${doc.id}`,
      action_label: 'Renovar',
    }))
  )
  
  return Response.json({ notified: expiringDocs.length })
}
```

### 3. Boas-vindas (Novo Usuário)

```typescript
// app/api/auth/signup/route.ts
await NotificationService.send({
  type: 'welcome',
  user_id: newUser.id,
  title: 'Bem-vindo ao SignFlow! 🎉',
  message: 'Estamos felizes em ter você aqui. Comece criando seu primeiro documento.',
  priority: 'normal',
  action_url: '/editor',
  action_label: 'Criar documento',
})
```

---

## ✅ Boas Práticas

### 1. Use Prioridades Corretamente

```typescript
// ✅ BOM
{ type: 'document_expiring', priority: 'urgent' }
{ type: 'validation_viewed', priority: 'low' }

// ❌ RUIM
{ type: 'welcome', priority: 'urgent' }  // Spam!
```

### 2. Sempre Inclua Action URL

```typescript
// ✅ BOM
{
  message: 'Documento pronto',
  action_url: '/documents/abc',
  action_label: 'Ver documento'
}

// ❌ RUIM
{
  message: 'Documento pronto'  // E agora?
}
```

### 3. Mensagens Claras e Acionáveis

```typescript
// ✅ BOM
message: 'Maria Silva assinou o contrato de prestação de serviços.'

// ❌ RUIM
message: 'Nova atividade no sistema.'  // Vago
```

### 4. Respeite Preferências do Usuário

O sistema já faz isso automaticamente! ✨

---

## 🧪 Testar o Sistema

### 1. Criar Notificação de Teste

Cole no SQL Editor do Supabase:

```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  action_url,
  action_label
) VALUES (
  'SEU_USER_ID_AQUI',  -- Substitua!
  'welcome',
  'Teste de Notificação 🚀',
  'Se você está vendo isso, o sistema funciona!',
  'normal',
  '/editor',
  'Criar documento'
);
```

### 2. Ver no Frontend

1. Recarregue a página
2. Clique no sino 🔔
3. Veja sua notificação!

---

## 🎨 Personalizar Emails

Edite `lib/notifications/email-service.ts`:

```typescript
EmailService.createEmailTemplate({
  title: 'Seu Título',
  content: '<p>HTML personalizado aqui</p>',
  actionUrl: '/link',
  actionLabel: 'Botão',
  footerText: 'Sua empresa © 2026',
})
```

---

## 📊 Ver Estatísticas

```sql
SELECT * FROM notification_stats WHERE user_id = 'user-id';
```

Retorna:
- `total_notifications`
- `total_read`
- `total_unread`
- `read_rate` (taxa de abertura)
- `click_rate` (taxa de clique)

---

## 🔧 Manutenção

### Limpar Notificações Antigas (90+ dias)

```sql
SELECT cleanup_old_notifications(90);
```

Crie um cron job para executar mensalmente.

---

## 📞 Suporte

Problemas? Abra uma issue no GitHub! 🐛

---

**Criado com ❤️ para o SignFlow**
