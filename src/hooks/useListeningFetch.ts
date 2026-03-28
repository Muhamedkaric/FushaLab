import { useState, useEffect } from 'react'
import type {
  ListeningChannelIndex,
  ListeningPlaylistIndex,
  ListeningPlaylistData,
} from '@/types/listening'

interface FetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useFetch<T>(url: string): FetchResult<T> {
  const [fetchedUrl, setFetchedUrl] = useState('')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

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

    return () => {
      cancelled = true
    }
  }, [url])

  const loading = fetchedUrl !== url
  return { data: loading ? null : data, loading, error: loading ? null : error }
}

export function useChannelIndex() {
  return useFetch<ListeningChannelIndex>('/data/listening/index.json')
}

export function usePlaylistIndex(channelId: string) {
  return useFetch<ListeningPlaylistIndex>(`/data/listening/${channelId}/index.json`)
}

export function usePlaylistVideos(channelId: string, playlistId: string) {
  return useFetch<ListeningPlaylistData>(
    `/data/listening/${channelId}/${playlistId}.json`,
  )
}
