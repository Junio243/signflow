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
  const [isClient, setIsClient] = useState(false)

  // Detectar se está no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Carregar idioma salvo ou detectar do navegador (apenas no cliente)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedLocale = localStorage.getItem('signflow-locale') as Locale
      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocaleState(savedLocale)
        return
      }
    } catch (error) {
      console.warn('Failed to access localStorage:', error)
    }

    // Detectar idioma do navegador
    try {
      const browserLang = navigator.language.split('-')[0] as Locale
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        setLocaleState(browserLang)
      }
    } catch (error) {
      console.warn('Failed to detect browser language:', error)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    
    // Salvar no localStorage apenas no cliente
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('signflow-locale', newLocale)
        // Atualizar atributo lang do HTML
        document.documentElement.lang = newLocale
      } catch (error) {
        console.warn('Failed to save locale:', error)
      }
    }
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
