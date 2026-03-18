import { useState, useEffect } from 'react'
import type { ContentItem, Category, Level } from '@/types/content'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useContentItem(category: Category, level: Level, id: string) {
  const [state, setState] = useState<FetchState<ContentItem>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })

    fetch(`/data/${category}/${level}/${id}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ContentItem>
      })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
      })

    return () => {
      cancelled = true
    }
  }, [category, level, id])

  return state
}

export interface LevelManifest {
  items: Array<{ id: string; arabic: string; metadata: { difficulty: number; tags: string[] } }>
}

export function useLevelManifest(category: Category, level: Level) {
  const [state, setState] = useState<FetchState<LevelManifest>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })

    fetch(`/data/${category}/${level}/index.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<LevelManifest>
      })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
      })

    return () => {
      cancelled = true
    }
  }, [category, level])

  return state
}
