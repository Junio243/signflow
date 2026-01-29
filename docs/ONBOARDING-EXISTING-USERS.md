# Onboarding para Usuários Existentes

## 🎯 Problema

Quando você adiciona um sistema de onboarding, usuários que **já têm conta** não veem o tutorial automaticamente, pois o sistema detecta apenas "primeira visita" via localStorage.

## ✅ Solução Implementada

Criamos **3 componentes** para avisar usuários existentes:

### 1. WelcomeBackBanner (Recomendado)

**Banner destacado no topo da página**

```tsx
import WelcomeBackBanner from '@/components/WelcomeBackBanner';
import { useOnboarding } from '@/lib/onboarding/useOnboarding';

export default function DashboardPage() {
  const { startTour, hasSeenTour } = useOnboarding({
    tourId: 'dashboard',
    steps: dashboardTourSteps,
  });

  return (
    <div>
      {/* Mostra banner para quem ainda não viu */}
      {!hasSeenTour && (
        <WelcomeBackBanner 
          onStartTour={startTour}
          userName="Alexandre" // Opcional
        />
      )}
      
      {/* Resto do conteúdo */}
    </div>
  );
}
```

**Características:**
- 🎨 Design atraente com gradiente
- ✨ Destaque para nova funcionalidade
- ❌ Pode ser dispensado (salva no localStorage)
- 📱 Responsivo

---

### 2. OnboardingNotification

**Toast não-intrusivo no canto da tela**

```tsx
import OnboardingNotification from '@/components/OnboardingNotification';

export default function DashboardPage() {
  const { startTour } = useOnboarding({
    tourId: 'dashboard',
    steps: dashboardTourSteps,
  });

  return (
    <div>
      {/* Toast aparece após 2 segundos */}
      <OnboardingNotification 
        onStartTour={startTour}
        tourId="dashboard"
      />
      
      {/* Resto do conteúdo */}
    </div>
  );
}
```

**Características:**
- 🕐 Aparece após 2 segundos (não intrusivo)
- 📍 Canto inferior direito
- ❌ Pode ser dispensado
- 🎯 Mais discreto que banner

---

### 3. NewFeatureBadge

**Badge "Novo" ao lado do botão de ajuda**

```tsx
import OnboardingButton from '@/components/OnboardingButton';
import NewFeatureBadge from '@/components/NewFeatureBadge';
import { useOnboarding } from '@/lib/onboarding/useOnboarding';

export default function DashboardPage() {
  const { startTour, hasSeenTour } = useOnboarding({
    tourId: 'dashboard',
    steps: dashboardTourSteps,
  });

  return (
    <div className="flex items-center gap-2">
      <OnboardingButton onClick={startTour} />
      <NewFeatureBadge show={!hasSeenTour} />
    </div>
  );
}
```

**Características:**
- ✨ Badge animado "NOVO"
- 🎨 Gradiente verde
- 📍 Ao lado de elementos
- 💫 Animate pulse

---

## 🔄 Sistema de Versões

### Forçar Tour Novamente Após Atualização

Se você **atualizar o tour** (adicionar passos, melhorar textos), pode forçar que TODOS os usuários vejam novamente:

```tsx
const { startTour, isNewFeature } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  version: 2, // ⬅️ Incrementar versão
});

// Mostra badge se for nova versão
<NewFeatureBadge show={isNewFeature} />
```

**Como funciona:**
- Versão 1: Usuário vê e completa → salva "1" no localStorage
- Você atualiza para versão 2
- Sistema detecta que usuário viu "1" mas não "2"
- `isNewFeature` = true
- Badge "NOVO" aparece
- Usuário clica e vê tour atualizado

---

## 🎯 Estratégias por Tipo de Usuário

### Cenário 1: Novos Usuários
```tsx
const { startTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  autoStart: true, // ⬅️ Inicia automaticamente
});
```
- ✅ Tour inicia sozinho após 500ms
- ✅ Experiência guiada desde o início

### Cenário 2: Usuários Existentes (Primeira Vez Vendo Tutorial)
```tsx
const { startTour, hasSeenTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  autoStart: false, // ⬅️ Não força
});

return (
  <div>
    {/* Banner chamativo */}
    {!hasSeenTour && <WelcomeBackBanner onStartTour={startTour} />}
    
    {/* OU Toast discreto */}
    <OnboardingNotification tourId="dashboard" onStartTour={startTour} />
    
    {/* E sempre botão de ajuda */}
    <OnboardingButton onClick={startTour} />
  </div>
);
```
- 📢 Banner avisa sobre novo recurso
- 🔔 Toast aparece discretamente
- 🆘 Botão de ajuda sempre disponível

### Cenário 3: Usuários que Já Viram
```tsx
const { startTour, hasSeenTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
});

return (
  <div>
    {/* Apenas botão de ajuda para replay */}
    <OnboardingButton onClick={startTour} />
  </div>
);
```
- ✅ Nenhum banner/toast
- 🆘 Botão disponível para revisar quando quiser

---

## 🚀 Implementação Recomendada

### Para Dashboard

```tsx
'use client';

import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import { dashboardTourSteps } from '@/lib/onboarding/dashboardTour';
import WelcomeBackBanner from '@/components/WelcomeBackBanner';
import OnboardingButton from '@/components/OnboardingButton';
import NewFeatureBadge from '@/components/NewFeatureBadge';

export default function DashboardPage() {
  const { startTour, hasSeenTour, isNewFeature } = useOnboarding({
    tourId: 'dashboard',
    steps: dashboardTourSteps,
    autoStart: true, // Novos usuários
    version: 1,
  });

  return (
    <div className="p-6">
      {/* Banner para usuários existentes */}
      {!hasSeenTour && <WelcomeBackBanner onStartTour={startTour} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1>Dashboard</h1>
        
        {/* Botão ajuda + badge */}
        <div className="flex items-center gap-2">
          <OnboardingButton onClick={startTour} />
          <NewFeatureBadge show={!hasSeenTour || isNewFeature} />
        </div>
      </div>

      {/* Resto do conteúdo... */}
    </div>
  );
}
```

---

## 📊 Tracking e Analytics

### Saber quantos usuários completaram

```tsx
const { startTour } = useOnboarding({
  tourId: 'dashboard',
  steps: dashboardTourSteps,
  onComplete: () => {
    // Google Analytics
    gtag('event', 'onboarding_complete', {
      tour_id: 'dashboard',
      user_type: 'existing', // ou 'new'
    });
    
    // Sentry
    Sentry.captureMessage('User completed dashboard tour');
  },
});
```

---

## 🔄 Migração para Usuários Existentes

### Se você já tem usuários em produção:

**Opção 1: Banner Universal (Recomendado)**
```tsx
// Sempre mostra banner na primeira vez, independente de quando criou conta
{!hasSeenTour && <WelcomeBackBanner onStartTour={startTour} />}
```

**Opção 2: Notificação por Email**
```tsx
// Backend: Enviar email para usuários existentes
// "🎉 Novo: Tutorial interativo do SignFlow!"
// Com link: https://signflow.com/dashboard?tutorial=start

// Frontend: Detectar query param
const router = useRouter();
const searchParams = useSearchParams();

useEffect(() => {
  if (searchParams.get('tutorial') === 'start') {
    startTour();
  }
}, [searchParams]);
```

**Opção 3: Modal de Boas-vindas**
```tsx
// Criar modal específico para usuários antigos
// Aparece uma única vez anunciando o tutorial
```

---

## ✅ Checklist Final

- [ ] `npm install` executado
- [ ] Banner adicionado ao dashboard
- [ ] Toast ou badge implementado
- [ ] Botão de ajuda sempre visível
- [ ] Sistema de versões configurado
- [ ] Testado em conta existente
- [ ] Testado em conta nova
- [ ] Analytics configurado (opcional)

---

**🎉 Pronto!** Agora tanto usuários novos quanto existentes saberão do tutorial!
