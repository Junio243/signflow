'use client';

interface NewFeatureBadgeProps {
  show?: boolean;
}

/**
 * Badge "Novo" para indicar features atualizadas
 * Aparece ao lado de botões/elementos
 */
export default function NewFeatureBadge({ show = true }: NewFeatureBadgeProps) {
  if (!show) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
      ✨ NOVO
    </span>
  );
}
