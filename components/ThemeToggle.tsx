'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * Botão de alternância de tema claro/escuro/sistema.
 * Persiste a escolha no localStorage e aplica a classe `dark` no <html>.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Lê preferência salva ao montar
  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') as Theme) ?? 'system';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (t === 'light') {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      // system
      root.removeAttribute('data-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }

  function handleChange(t: Theme) {
    setTheme(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  }

  // Evita hydration mismatch
  if (!mounted) {
    return <div className="h-9 w-24 rounded-xl bg-slate-200 animate-pulse" aria-hidden />;
  }

  const options: { value: Theme; icon: string; label: string }[] = [
    { value: 'light',  icon: '☀️', label: 'Claro'   },
    { value: 'system', icon: '💻', label: 'Sistema'  },
    { value: 'dark',   icon: '🌙', label: 'Escuro'  },
  ];

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          aria-pressed={theme === opt.value}
          title={opt.label}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            theme === opt.value
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span aria-hidden>{opt.icon}</span>
          <span className="sr-only">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
