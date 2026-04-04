import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'fushalab_grammar'

interface LessonProgress {
  stars: number      // 0–3
  xp: number
  completed: boolean
}

interface GrammarProgressState {
  totalXp: number
  lessons: Record<string, LessonProgress>
}

const DEFAULT_STATE: GrammarProgressState = { totalXp: 0, lessons: {} }

function load(): GrammarProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GrammarProgressState) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function save(state: GrammarProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function useGrammarProgress() {
  const [state, setState] = useState<GrammarProgressState>(load)

  useEffect(() => {
    save(state)
  }, [state])

  const getLessonProgress = useCallback(
    (lessonId: string): LessonProgress =>
      state.lessons[lessonId] ?? { stars: 0, xp: 0, completed: false },
    [state]
  )

  const saveResult = useCallback((lessonId: string, stars: number, xpEarned: number) => {
    setState(prev => {
      const existing = prev.lessons[lessonId] ?? { stars: 0, xp: 0, completed: false }
      const newStars = Math.max(existing.stars, stars)
      const newXp = existing.xp + xpEarned
      const xpDiff = newXp - existing.xp
      return {
        totalXp: prev.totalXp + (xpDiff > 0 ? xpDiff : 0),
        lessons: {
          ...prev.lessons,
          [lessonId]: { stars: newStars, xp: newXp, completed: true },
        },
      }
    })
  }, [])

  const { totalXp } = state
  const completedCount = Object.values(state.lessons).filter(l => l.completed).length

  return { totalXp, completedCount, getLessonProgress, saveResult }
}
