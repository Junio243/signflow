# Sistema de Onboarding Interativo do SignFlow

## ✅ O que foi implementado

- ✅ **Driver.js** - Biblioteca leve e gratuita para product tours
- ✅ **Hook personalizado** `useOnboarding` com persistência
- ✅ **Tour do Dashboard** - 4 passos explicando funcionalidades
- ✅ **Tour do Editor** - 5 passos do fluxo de assinatura
- ✅ **Botão de Ajuda** - Permite replay manual dos tours
- ✅ **Auto-start** - Inicia automaticamente na primeira visita
- ✅ **LocalStorage** - Não mostra novamente após completar

## 📦 Dependência Adicionada

```json
"driver.js": "^1.3.1"
```

Instale com:
```bash
npm install
```

## 📚 Como Usar

### 1. Tour do Dashboard

No arquivo `app/dashboard/page.tsx`, adicione:

```tsx
import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import { dashboardTourSteps } from '@/lib/onboarding/dashboardTour';
import OnboardingButton from '@/components/OnboardingButton';

export default function DashboardPage() {
  const { startTour } = useOnboarding({
    tourId: 'dashboard',
    steps: dashboardTourSteps,
    autoStart: true, // Inicia automaticamente na primeira visita
  });

  return (
    <div>
      {/* Header com botão de ajuda */}
      <div className="flex items-center justify-between mb-6">
        <h1 id="welcome-message">Meus Documentos</h1>
        <OnboardingButton onClick={startTour} />
      </div>

      {/* Botão nova assinatura */}
      <button id="new-signature-btn">
        Nova Assinatura
      </button>

      {/* Lista de documentos */}
      <div id="documents-list">
        {/* seus documentos aqui */}
      </div>

      {/* Menu de perfil */}
      <div id="profile-menu">
        {/* menu aqui */}
      </div>
    </div>
  );
}
```

### 2. Tour do Editor

No arquivo `app/editor/page.tsx`, adicione:

```tsx
import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import { editorTourSteps } from '@/lib/onboarding/editorTour';
import OnboardingButton from '@/components/OnboardingButton';

export default function EditorPage() {
  const { startTour } = useOnboarding({
    tourId: 'editor',
    steps: editorTourSteps,
    autoStart: true,
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h1>Editor de Assinatura</h1>
        <OnboardingButton onClick={startTour} label="Como usar?" />
      </div>

      {/* Upload de PDF */}
      <div id="pdf-upload">
        {/* input de upload */}
      </div>

      {/* Upload de assinatura */}
      <div id="signature-upload">
        {/* input de assinatura */}
      </div>

      {/* Canvas do PDF */}
      <div id="pdf-canvas">
        {/* visualização do PDF */}
      </div>

      {/* Navegação de páginas */}
      <div id="page-navigation">
        {/* controles de página */}
      </div>

      {/* Botão salvar */}
      <button id="save-document">
        Salvar Documento
      </button>
    </div>
  );
}
```

## 🎨 Personalizar Tours

### Adicionar Novos Passos

Edite `lib/onboarding/dashboardTour.ts` ou `editorTour.ts`:

```typescript
export const customTourSteps = [
  {
    element: '#seu-elemento-id', // ID do elemento HTML
    popover: {
      title: '🎉 Título do Passo',
      description: 'Descrição detalhada do que fazer aqui.',
      side: 'bottom', // 'top' | 'right' | 'bottom' | 'left'
      align: 'start', // 'start' | 'center' | 'end'
    },
  },
  // mais passos...
];
```

### Criar Novo Tour

Crie um novo arquivo em `lib/onboarding/meuTour.ts`:

```typescript
export const meuTourSteps = [
  {
    element: '#primeiro-passo',
    popover: {
      title: 'Bem-vindo!',
      description: 'Esta é a introdução.',
      side: 'bottom',
    },
  },
];
```

Use no componente:

```tsx
import { meuTourSteps } from '@/lib/onboarding/meuTour';

const { startTour } = useOnboarding({
  tourId: 'meu-tour-unico', // ID único para salvar no localStorage
  steps: meuTourSteps,
  autoStart: true,
});
```

## ⚙️ Configurações Avançadas

### Desabilitar Auto-start

```tsx
const { startTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  autoStart: false, // Não inicia automaticamente
});
```

### Callback ao Completar

```tsx
const { startTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  onComplete: () => {
    console.log('Usuário completou o tour!');
    // Enviar evento para analytics, etc.
  },
});
```

### Resetar Tour (forçar exibição novamente)

```tsx
const { resetTour } = useOnboarding({ ... });

// Resetar o tour para aparecer novamente
resetTour();
```

## 🐛 Troubleshooting

### Tour não aparece

1. Verifique se os IDs dos elementos (`#id`) existem no DOM
2. Certifique-se que `npm install` foi executado
3. Limpe o localStorage se necessário:
   ```javascript
   localStorage.removeItem('onboarding-dashboard');
   ```

### Elementos não destacados corretamente

- Adicione `position: relative` ao elemento pai
- Use classes Tailwind: `relative z-10`

### Tour muito rápido/lento

Ajuste o delay no `useOnboarding.ts`:
```typescript
setTimeout(() => {
  startTour();
}, 1000); // Aumente para 1000ms (1 segundo)
```

## 🎨 Estilização

O Driver.js usa classes CSS customizáveis. Adicione em `globals.css`:

```css
/* Customizar cores do tour */
.driver-popover {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.driver-popover-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0066ff;
}

.driver-popover-description {
  color: #475569;
  line-height: 1.6;
}

.driver-popover-next-btn {
  background: #0066ff !important;
  border-radius: 8px !important;
}
```

## 📊 Analytics (Opcional)

Integre com Sentry ou Google Analytics:

```tsx
const { startTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  onComplete: () => {
    // Sentry
    Sentry.captureMessage('User completed dashboard tour');
    
    // Google Analytics
    gtag('event', 'onboarding_complete', {
      tour_id: 'dashboard',
    });
  },
});
```

## 🔗 Links Úteis

- Driver.js Docs: [driverjs.com](https://driverjs.com)
- GitHub: [github.com/kamranahmedse/driver.js](https://github.com/kamranahmedse/driver.js)
- Exemplos: [driverjs.com/docs/examples](https://driverjs.com/docs/examples)

---

**Pronto para usar!** O sistema de onboarding está configurado e pronto para guiar seus usuários. 🎉
