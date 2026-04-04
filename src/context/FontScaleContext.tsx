import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type FontScale = 0.9 | 1 | 1.15 | 1.3

const STORAGE_KEY = 'fushalab_font_scale'
const DEFAULT_SCALE: FontScale = 1

function applyScale(scale: FontScale) {
  document.documentElement.style.fontSize = `${scale * 16}px`
}

interface FontScaleContextValue {
  scale: FontScale
  setScale: (scale: FontScale) => void
}

const FontScaleContext = createContext<FontScaleContextValue>({
  scale: DEFAULT_SCALE,
  setScale: () => {},
})

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState<FontScale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? parseFloat(stored) : DEFAULT_SCALE
    return ([0.9, 1, 1.15, 1.3] as FontScale[]).includes(parsed as FontScale)
      ? (parsed as FontScale)
      : DEFAULT_SCALE
  })

  useEffect(() => {
    applyScale(scale)
  }, [scale])

  const setScale = useCallback((next: FontScale) => {
    setScaleState(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }, [])

  return (
    <FontScaleContext.Provider value={{ scale, setScale }}>
      {children}
    </FontScaleContext.Provider>
  )
}

export function useFontScale() {
  return useContext(FontScaleContext)
}
