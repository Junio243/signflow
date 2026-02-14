'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, SUPPORTED_LOCALES, translations, TranslationKeys } from './translations'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  // Carregar idioma salvo ou detectar do navegador
  useEffect(() => {
    const savedLocale = localStorage.getItem('signflow-locale') as Locale
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
      setLocaleState(savedLocale)
    } else {
      // Detectar idioma do navegador
      const browserLang = navigator.language.split('-')[0] as Locale
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        setLocaleState(browserLang)
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('signflow-locale', newLocale)
    // Atualizar atributo lang do HTML
    document.documentElement.lang = newLocale
  }

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
