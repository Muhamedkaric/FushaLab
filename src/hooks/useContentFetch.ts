import { useState, useEffect } from 'react'
import type { ContentItem, Category, Level } from '@/types/content'
import { getContent } from '@/lib/offlineDB'

export interface LevelManifest {
  items: Array<{ id: string; arabic: string; metadata: { difficulty: number; tags: string[] } }>
}

interface FetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useFetch<T>(url: string): FetchResult<T> {
  const [fetchedUrl, setFetchedUrl] = useState<string>('')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Check offline cache first
      try {
        const cached = await getContent<T>(url)
        if (cached !== undefined) {
          if (!cancelled) {
            setData(cached)
            setError(null)
            setFetchedUrl(url)
          }
          return
        }
      } catch {
        // IndexedDB unavailable — fall through to network
      }

      // Network fetch
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json() as Promise<T>
        })
        .then(result => {
          if (!cancelled) {
            setData(result)
            setError(null)
            setFetchedUrl(url)
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setData(null)
            setError(err instanceof Error ? err.message : 'Unknown error')
            setFetchedUrl(url)
          }
        })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [url])

  const loading = fetchedUrl !== url
  return { data: loading ? null : data, loading, error: loading ? null : error }
}

export function useContentItem(category: Category, level: Level, id: string) {
  return useFetch<ContentItem>(`/data/${category}/${level}/${id}.json`)
}

export function useLevelManifest(category: Category, level: Level) {
  return useFetch<LevelManifest>(`/data/${category}/${level}/index.json`)
}
