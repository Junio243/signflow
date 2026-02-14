'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_FLAGS, Locale } from '@/lib/i18n/translations'

export default function LanguageSelector() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        aria-label="Selecionar idioma"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{LOCALE_FLAGS[locale]} {LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitem"
              onClick={() => handleSelectLocale(loc)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition ${
                locale === loc
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_NAMES[loc]}</span>
              {locale === loc && (
                <span className="ml-auto text-brand-600" aria-label="Idioma atual">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
