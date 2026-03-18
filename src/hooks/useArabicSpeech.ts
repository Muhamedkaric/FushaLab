import { useState, useEffect, useRef, useCallback } from 'react'

interface ArabicSpeechState {
  speaking: boolean
  supported: boolean
  hasArabicVoice: boolean
}

export function useArabicSpeech() {
  const [state, setState] = useState<ArabicSpeechState>({
    speaking: false,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    hasArabicVoice: false,
  })

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Voices load asynchronously in many browsers
  useEffect(() => {
    if (!state.supported) return

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const arabic = voices.some(v => v.lang.startsWith('ar'))
      setState(prev => ({ ...prev, hasArabicVoice: arabic }))
    }

    checkVoices()
    window.speechSynthesis.addEventListener('voiceschanged', checkVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', checkVoices)
    }
  }, [state.supported])

  const speak = useCallback(
    (text: string) => {
      if (!state.supported) return
      window.speechSynthesis.cancel()

      const voices = window.speechSynthesis.getVoices()
      // Prefer a native Arabic voice; fall back to any ar-* voice
      const voice =
        voices.find(v => v.lang === 'ar-SA') ?? voices.find(v => v.lang.startsWith('ar')) ?? null

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.85
      utterance.pitch = 1
      if (voice) utterance.voice = voice

      utterance.onstart = () => setState(prev => ({ ...prev, speaking: true }))
      utterance.onend = () => setState(prev => ({ ...prev, speaking: false }))
      utterance.onerror = () => setState(prev => ({ ...prev, speaking: false }))

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [state.supported]
  )

  const stop = useCallback(() => {
    if (!state.supported) return
    window.speechSynthesis.cancel()
    setState(prev => ({ ...prev, speaking: false }))
  }, [state.supported])

  return { ...state, speak, stop }
}
