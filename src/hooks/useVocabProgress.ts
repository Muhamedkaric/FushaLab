import { useState, useCallback } from 'react'

const STORAGE_KEY = 'fushalab_vocab'

interface VocabProgressData {
  known: Record<string, true>
}

function load(): VocabProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VocabProgressData) : { known: {} }
  } catch {
    return { known: {} }
  }
}

function persist(data: VocabProgressData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function wordKey(setId: string, wordIndex: number) {
  return `${setId}:${wordIndex}`
}

export function useVocabProgress() {
  const [data, setData] = useState<VocabProgressData>(load)

  const isKnown = useCallback(
    (setId: string, wordIndex: number) => Boolean(data.known[wordKey(setId, wordIndex)]),
    [data]
  )

  const knownCountForSet = useCallback(
    (setId: string, total: number) => {
      let count = 0
      for (let i = 0; i < total; i++) {
        if (data.known[wordKey(setId, i)]) count++
      }
      return count
    },
    [data]
  )

  const totalKnown = Object.keys(data.known).length

  // Save results after a study session: knownIndices marked known, others untouched
  const saveSession = useCallback(
    (setId: string, knownIndices: number[], forgotIndices: number[]) => {
      setData(prev => {
        const next: VocabProgressData = { known: { ...prev.known } }
        for (const i of knownIndices) {
          next.known[wordKey(setId, i)] = true
        }
        for (const i of forgotIndices) {
          delete next.known[wordKey(setId, i)]
        }
        persist(next)
        return next
      })
    },
    []
  )

  return { isKnown, knownCountForSet, totalKnown, saveSession }
}
