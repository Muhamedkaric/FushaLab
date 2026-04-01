import { useState, useCallback } from 'react'

const STORAGE_KEY = 'fushalab_exercises'

interface PackProgress {
  stars: number
  xp: number
}

interface ProgressState {
  totalXp: number
  packs: Record<string, PackProgress>
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProgressState
  } catch {
    // ignore
  }
  return { totalXp: 0, packs: {} }
}

function save(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function useExerciseProgress() {
  const [state, setState] = useState<ProgressState>(load)

  const saveResult = useCallback((packId: string, stars: number, xpEarned: number) => {
    setState(prev => {
      const existing = prev.packs[packId]
      const bestStars = Math.max(existing?.stars ?? 0, stars)
      const bestXp = Math.max(existing?.xp ?? 0, xpEarned)
      const xpDelta = bestXp - (existing?.xp ?? 0)
      const next: ProgressState = {
        totalXp: prev.totalXp + Math.max(0, xpDelta),
        packs: {
          ...prev.packs,
          [packId]: { stars: bestStars, xp: bestXp },
        },
      }
      save(next)
      return next
    })
  }, [])

  const getPackProgress = useCallback(
    (packId: string): PackProgress => {
      return state.packs[packId] ?? { stars: 0, xp: 0 }
    },
    [state]
  )

  const resetAll = useCallback(() => {
    const empty: ProgressState = { totalXp: 0, packs: {} }
    save(empty)
    setState(empty)
  }, [])

  return {
    totalXp: state.totalXp,
    packs: state.packs,
    getPackProgress,
    saveResult,
    resetAll,
  }
}
