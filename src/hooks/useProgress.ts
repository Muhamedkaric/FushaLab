import { useState, useCallback, useEffect } from 'react'
import type { DifficultyRating, UserProgress } from '@/types/content'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

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

async function syncUp(userId: string, data: UserProgress) {
  await supabase
    .from('reading_progress')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
}

export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress>(loadProgress)

  // On login: pull from Supabase and hydrate local state
  useEffect(() => {
    if (!user) return
    supabase
      .from('reading_progress')
      .select('data')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.data) {
          const remote = data.data as UserProgress
          saveProgress(remote)
          setProgress(remote)
        } else {
          // First login — push local data up
          const local = loadProgress()
          if (Object.keys(local.ratings).length > 0) void syncUp(user.id, local)
        }
      })
  }, [user?.id])

  const rate = useCallback(
    (id: string, rating: DifficultyRating) => {
      setProgress(prev => {
        const next: UserProgress = {
          ratings: { ...prev.ratings, [id]: rating },
          completedAt: {
            ...prev.completedAt,
            ...(rating ? { [id]: Date.now() } : {}),
          },
        }
        saveProgress(next)
        if (user) void syncUp(user.id, next)
        return next
      })
    },
    [user]
  )

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
    if (user) void syncUp(user.id, empty)
  }, [user])

  const stats = {
    easy: Object.values(progress.ratings).filter(r => r === 'easy').length,
    medium: Object.values(progress.ratings).filter(r => r === 'medium').length,
    hard: Object.values(progress.ratings).filter(r => r === 'hard').length,
    total: Object.keys(progress.ratings).length,
  }

  return { progress, rate, getRating, isCompleted, reset, stats }
}
