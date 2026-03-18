import { useState, useCallback } from 'react'
import type { DifficultyRating, UserProgress } from '@/types/content'

const STORAGE_KEY = 'fushalab_progress'

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ratings: {}, completedAt: {} }
    return JSON.parse(raw) as UserProgress
  } catch {
    return { ratings: {}, completedAt: {} }
  }
}

function saveProgress(p: UserProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress)

  const rate = useCallback((id: string, rating: DifficultyRating) => {
    setProgress(prev => {
      const next: UserProgress = {
        ratings: { ...prev.ratings, [id]: rating },
        completedAt: {
          ...prev.completedAt,
          ...(rating ? { [id]: Date.now() } : {}),
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  const getRating = useCallback(
    (id: string): DifficultyRating => progress.ratings[id] ?? null,
    [progress]
  )

  const isCompleted = useCallback(
    (id: string): boolean => progress.ratings[id] === 'easy',
    [progress]
  )

  const reset = useCallback(() => {
    const empty: UserProgress = { ratings: {}, completedAt: {} }
    saveProgress(empty)
    setProgress(empty)
  }, [])

  const stats = {
    easy: Object.values(progress.ratings).filter(r => r === 'easy').length,
    medium: Object.values(progress.ratings).filter(r => r === 'medium').length,
    hard: Object.values(progress.ratings).filter(r => r === 'hard').length,
    total: Object.keys(progress.ratings).length,
  }

  return { progress, rate, getRating, isCompleted, reset, stats }
}
