import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

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

async function syncUp(userId: string, data: VocabProgressData) {
  await supabase
    .from('vocab_progress')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
}

export function useVocabProgress() {
  const { user } = useAuth()
  const [data, setData] = useState<VocabProgressData>(load)

  // On login: pull from Supabase and hydrate local state
  useEffect(() => {
    if (!user) return
    supabase
      .from('vocab_progress')
      .select('data')
      .eq('user_id', user.id)
      .single()
      .then(({ data: row }) => {
        if (row?.data) {
          const remote = row.data as VocabProgressData
          persist(remote)
          setData(remote)
        } else {
          const local = load()
          if (Object.keys(local.known).length > 0) void syncUp(user.id, local)
        }
      })
  }, [user?.id])

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
        if (user) void syncUp(user.id, next)
        return next
      })
    },
    [user]
  )

  return { isKnown, knownCountForSet, totalKnown, saveSession }
}
