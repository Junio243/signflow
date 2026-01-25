'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface OnboardingNotificationProps {
  onStartTour: () => void;
  tourId: string;
}

/**
 * Notificação toast no canto da tela
 * Para avisar sobre tutorial sem ser intrusivo
 */
export default function OnboardingNotification({ 
  onStartTour, 
  tourId 
}: OnboardingNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Verifica se já viu o tour
    const hasSeenTour = localStorage.getItem(`onboarding-${tourId}`) !== null;
    
    // Verifica se já dispensou a notificação
    const hasSeenNotification = localStorage.getItem(`notification-${tourId}`) === 'true';
    
    // Mostra notificação se nunca viu o tour E nunca dispensou a notificação
    if (!hasSeenTour && !hasSeenNotification) {
      setDismissed(false);
      // Aguarda 2 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [tourId]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(`notification-${tourId}`, 'true');
    setTimeout(() => setDismissed(true), 300);
  };

  const handleStartTour = () => {
    onStartTour();
    handleDismiss();
  };

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  🎉 Tutorial Disponível
                </h4>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Conteúdo */}
          <p className="text-sm text-gray-600 mb-3">
            Quer um tour rápido pelas funcionalidades?
          </p>

          {/* Botões */}
          <div className="flex gap-2">
            <button
              onClick={handleStartTour}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Começar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
