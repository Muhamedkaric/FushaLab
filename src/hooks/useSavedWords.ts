import { useState, useCallback } from 'react'
import type { WordAnnotation, SavedWord } from '@/types/content'
import type { DictionaryEntry } from '@/context/DictionaryContext'

const STORAGE_KEY = 'fushalab_saved_words'

function wordKey(ann: WordAnnotation): string {
  return ann.lemma ?? ann.w
}

function load(): Record<string, SavedWord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SavedWord>) : {}
  } catch {
    return {}
  }
}

function persist(data: Record<string, SavedWord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useSavedWords(dictLookup?: (lemma: string) => DictionaryEntry | null) {
  const [saved, setSaved] = useState<Record<string, SavedWord>>(load)

  const isSaved = useCallback((ann: WordAnnotation) => Boolean(saved[wordKey(ann)]), [saved])

  const toggleSave = useCallback(
    (ann: WordAnnotation) => {
      const key = wordKey(ann)
      setSaved(prev => {
        const next = { ...prev }
        if (next[key]) {
          delete next[key]
        } else {
          // Enrich with dictionary data at save time — dictionary is source of truth
          const dictEntry = ann.lemma && dictLookup ? dictLookup(ann.lemma) : null
          next[key] = {
            key,
            w: ann.w,
            lemma: ann.lemma,
            root: dictEntry?.root,
            bs: dictEntry?.bs ?? '',
            en: dictEntry?.en ?? '',
            savedAt: Date.now(),
          }
        }
        persist(next)
        return next
      })
    },
    [dictLookup]
  )

  const removeWord = useCallback((key: string) => {
    setSaved(prev => {
      const next = { ...prev }
      delete next[key]
      persist(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setSaved({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const savedWords = Object.values(saved).sort((a, b) => b.savedAt - a.savedAt)

  return { isSaved, toggleSave, removeWord, clearAll, savedWords, count: savedWords.length }
}
