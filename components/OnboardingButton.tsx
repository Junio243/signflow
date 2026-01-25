'use client';

import { HelpCircle } from 'lucide-react';

interface OnboardingButtonProps {
  onClick: () => void;
  label?: string;
}

export default function OnboardingButton({ 
  onClick, 
  label = 'Tutorial' 
}: OnboardingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-200"
      aria-label="Iniciar tutorial"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
