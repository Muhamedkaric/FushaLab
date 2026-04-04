import { useState, useEffect, useCallback } from 'react'
import type { Category, Level } from '@/types/content'
import type { LevelManifest } from './useContentFetch'
import {
  getLevelMeta,
  putLevelMeta,
  putContent,
  deleteContentByPrefix,
  deleteLevelMeta,
} from '@/lib/offlineDB'

export type DownloadState = 'idle' | 'downloading' | 'done' | 'error'

export function useOfflineStatus(category: Category, level: Level) {
  const [state, setState] = useState<DownloadState>('idle')
  const [progress, setProgress] = useState(0) // 0–100
  const [itemCount, setItemCount] = useState(0)

  // Check on mount if already downloaded
  useEffect(() => {
    getLevelMeta(category, level)
      .then(meta => {
        if (meta) {
          setState('done')
          setItemCount(meta.itemCount)
        }
      })
      .catch(() => {})
  }, [category, level])

  const download = useCallback(
    async (manifest: LevelManifest) => {
      setState('downloading')
      setProgress(0)

      const base = `/data/${category}/${level}`
      const items = manifest.items
      const total = items.length + 1 // +1 for index.json

      try {
        // Cache index.json first
        await putContent(`${base}/index.json`, manifest)
        setProgress(Math.round((1 / total) * 100))

        // Cache each item file
        for (let i = 0; i < items.length; i++) {
          const url = `${base}/${items[i].id}.json`
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
          const data: unknown = await res.json()
          await putContent(url, data)
          setProgress(Math.round(((i + 2) / total) * 100))
        }

        await putLevelMeta(category, level, {
          downloadedAt: Date.now(),
          itemCount: items.length,
        })

        setItemCount(items.length)
        setState('done')
      } catch {
        setState('error')
      }
    },
    [category, level],
  )

  const remove = useCallback(async () => {
    const prefix = `/data/${category}/${level}/`
    await deleteContentByPrefix(prefix)
    await deleteLevelMeta(category, level)
    setState('idle')
    setItemCount(0)
    setProgress(0)
  }, [category, level])

  return { state, progress, itemCount, download, remove }
}
