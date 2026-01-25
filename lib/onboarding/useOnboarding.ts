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
}

export function useOnboarding({
  tourId,
  steps,
  autoStart = false,
  onComplete,
}: UseOnboardingOptions) {
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    // Verifica se o usuário já viu o tour
    const seen = localStorage.getItem(`onboarding-${tourId}`);
    setHasSeenTour(seen === 'true');
  }, [tourId]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: steps.map((step) => ({
        ...step,
        popover: {
          ...step.popover,
          showButtons: ['next', 'previous', 'close'],
          nextBtnText: '➜ Próximo',
          prevBtnText: '← Anterior',
          doneBtnText: '✓ Concluir',
        },
      })),
      onDestroyed: () => {
        // Marca como visto quando completa ou fecha
        localStorage.setItem(`onboarding-${tourId}`, 'true');
        setHasSeenTour(true);
        if (onComplete) onComplete();
      },
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding-${tourId}`);
    setHasSeenTour(false);
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
  };
}
