import type { DictionaryEntry } from '@/context/DictionaryContext'

/**
 * Returns today's word from the dictionary.
 * Seeded by day number so every user sees the same word on the same day.
 * Returns null while the dictionary is still loading.
 */
export function getTodaysWord(allEntries: DictionaryEntry[]): DictionaryEntry | null {
  if (allEntries.length === 0) return null
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return allEntries[dayIndex % allEntries.length]
}
