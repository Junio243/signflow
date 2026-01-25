'use client';

/**
 * EXEMPLO DE USO DO ONBOARDING
 * 
 * Este é um exemplo de como integrar o sistema de onboarding
 * em qualquer página do SignFlow.
 * 
 * Copie este código para suas páginas e adapte conforme necessário.
 */

import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import { dashboardTourSteps } from '@/lib/onboarding/dashboardTour';
import OnboardingButton from '@/components/OnboardingButton';

export default function OnboardingExample() {
  // Inicializa o tour
  const { startTour, hasSeenTour } = useOnboarding({
    tourId: 'dashboard', // ID único para cada tour
    steps: dashboardTourSteps,
    autoStart: true, // true = inicia automaticamente na primeira visita
    onComplete: () => {
      console.log('✅ Usuário completou o tour!');
      // Aqui você pode enviar evento para analytics
    },
  });

  return (
    <div className="p-6">
      {/* Header com botão de ajuda */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 id="welcome-message" className="text-2xl font-bold text-gray-900">
            👋 Bem-vindo ao Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus documentos e assinaturas
          </p>
        </div>
        
        {/* Botão para replay do tour */}
        <OnboardingButton onClick={startTour} label="Tutorial" />
      </div>

      {/* Banner para quem não viu o tour ainda */}
      {!hasSeenTour && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Primeira vez por aqui?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Deixe-nos mostrar como usar o SignFlow em menos de 1 minuto!
              </p>
              <button
                onClick={startTour}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                🎓 Começar Tour Guiado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exemplo de elementos com IDs para o tour */}
      <div className="grid gap-6">
        {/* Botão Nova Assinatura */}
        <div>
          <button
            id="new-signature-btn"
            className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl shadow hover:bg-brand-700 transition"
          >
            ✍️ Nova Assinatura
          </button>
        </div>

        {/* Lista de Documentos */}
        <div id="documents-list" className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📄 Seus Documentos
          </h2>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium">Contrato_2026.pdf</p>
              <p className="text-sm text-gray-500">Assinado em 20/01/2026</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium">Procuracao.pdf</p>
              <p className="text-sm text-gray-500">Assinado em 15/01/2026</p>
            </div>
          </div>
        </div>

        {/* Menu de Perfil */}
        <div id="profile-menu" className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ Configurações
          </h2>
          <ul className="space-y-2">
            <li className="p-2 hover:bg-gray-50 rounded cursor-pointer">
              Meu Perfil
            </li>
            <li className="p-2 hover:bg-gray-50 rounded cursor-pointer">
              Segurança
            </li>
            <li className="p-2 hover:bg-gray-50 rounded cursor-pointer">
              Preferências
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
