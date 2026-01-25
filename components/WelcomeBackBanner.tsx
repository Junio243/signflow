'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface WelcomeBackBannerProps {
  onStartTour: () => void;
  userName?: string;
}

/**
 * Banner para usuários existentes que ainda não viram o tutorial
 * Mostra notificação sobre novo sistema de onboarding
 */
export default function WelcomeBackBanner({ 
  onStartTour, 
  userName 
}: WelcomeBackBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    // Verifica se já foi dispensado
    return localStorage.getItem('welcome-banner-dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('welcome-banner-dismissed', 'true');
    setDismissed(true);
  };

  const handleStartTour = () => {
    onStartTour();
    handleDismiss();
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6 relative">
        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-2">
              {userName ? `Bem-vindo de volta, ${userName}! 👋` : 'Bem-vindo de volta! 👋'}
            </h3>
            <p className="text-sm sm:text-base text-white/90 mb-4">
              <strong>🎉 Novidade!</strong> Criamos um tutorial interativo para te mostrar 
              todas as funcionalidades do SignFlow em menos de 1 minuto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStartTour}
                className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg"
              >
                🎓 Ver Tutorial Agora
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-2.5 text-white font-medium hover:bg-white/10 rounded-lg transition"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
