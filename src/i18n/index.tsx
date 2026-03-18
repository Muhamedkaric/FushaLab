import React, { createContext, useContext, useState, useEffect } from 'react'
import { en, type Translations } from './en'
import { bs } from './bs'

export type Language = 'en' | 'bs'

const TRANSLATIONS: Record<Language, Translations> = { en, bs }
const STORAGE_KEY = 'fushalab_lang'

interface I18nContextValue {
  lang: Language
  t: Translations
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'bs',
  t: bs,
  setLang: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    return stored && stored in TRANSLATIONS ? stored : 'bs'
  })

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  useEffect(() => {
    document.documentElement.lang = lang === 'bs' ? 'bs' : 'en'
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
