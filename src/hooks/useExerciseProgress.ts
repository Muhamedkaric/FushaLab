import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

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

async function syncUp(userId: string, data: ProgressState) {
  await supabase
    .from('exercise_progress')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
}

export function useExerciseProgress() {
  const { user } = useAuth()
  const [state, setState] = useState<ProgressState>(load)

  // On login: pull from Supabase and hydrate local state
  useEffect(() => {
    if (!user) return
    supabase
      .from('exercise_progress')
      .select('data')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.data) {
          const remote = data.data as ProgressState
          save(remote)
          setState(remote)
        } else {
          const local = load()
          if (local.totalXp > 0) void syncUp(user.id, local)
        }
      })
  }, [user?.id])

  const saveResult = useCallback(
    (packId: string, stars: number, xpEarned: number) => {
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
        if (user) void syncUp(user.id, next)
        return next
      })
    },
    [user]
  )

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
    if (user) void syncUp(user.id, empty)
  }, [user])

  return {
    totalXp: state.totalXp,
    packs: state.packs,
    getPackProgress,
    saveResult,
    resetAll,
  }
}
