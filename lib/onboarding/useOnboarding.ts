import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
}

interface UseOnboardingOptions {
  tourId: string;
  steps: OnboardingStep[];
  autoStart?: boolean;
  onComplete?: () => void;
  version?: number; // Nova versão do tour
}

export function useOnboarding({
  tourId,
  steps,
  autoStart = false,
  onComplete,
  version = 1,
}: UseOnboardingOptions) {
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [isNewFeature, setIsNewFeature] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já viu o tour
    const storageKey = `onboarding-${tourId}`;
    const seenVersion = localStorage.getItem(storageKey);
    
    // Se nunca viu OU a versão mudou, considera como não visto
    const hasSeenCurrentVersion = seenVersion === version.toString();
    setHasSeenTour(hasSeenCurrentVersion);
    
    // Se já viu versão antiga mas não a nova, é nova feature
    const isNew = seenVersion !== null && !hasSeenCurrentVersion;
    setIsNewFeature(isNew);
  }, [tourId, version]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: steps.map((step) => ({
        ...step,
        popover: {
          ...step.popover,
          showButtons: ['next', 'previous', 'close'],
          nextBtnText: '→ Próximo',
          prevBtnText: '← Anterior',
          doneBtnText: '✓ Concluir',
        },
      })),
      onDestroyed: () => {
        // Salva a versão atual como vista
        localStorage.setItem(`onboarding-${tourId}`, version.toString());
        setHasSeenTour(true);
        setIsNewFeature(false);
        if (onComplete) onComplete();
      },
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding-${tourId}`);
    setHasSeenTour(false);
    setIsNewFeature(false);
  };

  // Auto-start no primeiro acesso
  useEffect(() => {
    if (autoStart && !hasSeenTour && steps.length > 0) {
      // Aguarda 500ms para garantir que o DOM está pronto
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, hasSeenTour, steps.length]);

  return {
    startTour,
    resetTour,
    hasSeenTour,
    isNewFeature, // true se é atualização de tour
  };
}
