import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface DictionaryEntry {
  lemma: string
  root?: string
  bs: string
  en: string
}

interface DictionaryContextValue {
  entries: Record<string, DictionaryEntry>
  lookup: (lemma: string) => DictionaryEntry | null
  allEntries: DictionaryEntry[]
  isLoaded: boolean
}

const DictionaryContext = createContext<DictionaryContextValue>({
  entries: {},
  lookup: () => null,
  allEntries: [],
  isLoaded: false,
})

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DictionaryEntry>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetch('/data/dictionary.json')
      .then(r => r.json())
      .then((data: Record<string, DictionaryEntry>) => {
        setEntries(data)
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true)) // fail silently — inline data still works
  }, [])

  const lookup = (lemma: string): DictionaryEntry | null => entries[lemma] ?? null

  const allEntries = isLoaded ? Object.values(entries) : []

  return (
    <DictionaryContext.Provider value={{ entries, lookup, allEntries, isLoaded }}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary() {
  return useContext(DictionaryContext)
}
