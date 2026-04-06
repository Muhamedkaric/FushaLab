import {
  Box,
  Typography,
  Stack,
  Container,
  Chip,
  Button,
  LinearProgress,
  Skeleton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useVocabProgress } from '@/hooks/useVocabProgress'
import { useI18n } from '@/i18n'
import type { VocabSet, VocabWord } from '@/types/vocabulary'

interface VocabularyStudyPageProps {
  setId: string
}

interface QueueItem {
  word: VocabWord
  originalIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type ChipColor = 'primary' | 'secondary' | 'warning' | 'default'

const TYPE_COLORS: Record<string, ChipColor> = {
  noun: 'primary',
  verb: 'secondary',
  adjective: 'warning',
}

const TYPE_LABELS: Record<string, string> = {
  noun: 'N',
  verb: 'V',
  adjective: 'Adj',
  adverb: 'Adv',
  preposition: 'Prep',
  particle: 'Part',
  phrase: 'Phr',
}

function typeColor(type: string): ChipColor {
  return TYPE_COLORS[type] ?? 'default'
}

// ── Card face animations ──────────────────────────────────────────────────────

const faceVariants = {
  enter: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: [0.55, 0.055, 0.675, 0.19] as [number, number, number, number],
    },
  },
}

const cardVariants = {
  enter: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: {
      duration: 0.2,
      ease: [0.55, 0.055, 0.675, 0.19] as [number, number, number, number],
    },
  },
}

// ── Done screen ───────────────────────────────────────────────────────────────

interface DoneScreenProps {
  knownCount: number
  total: number
  onRetry: () => void
  onBack: () => void
  t: ReturnType<typeof useI18n>['t']
}

function DoneScreen({ knownCount, total, onRetry, onBack, t }: DoneScreenProps) {
  const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0
  const message = pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good work!' : 'Keep practicing!'

  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          mx: 'auto',
          mt: { xs: 4, sm: 8 },
          p: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={1}>
          {t.vocabulary.study.done}
        </Typography>

        <Typography variant="h2" fontWeight={800} color="primary" sx={{ my: 2, lineHeight: 1 }}>
          {knownCount} / {total}
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={1}>
          {t.vocabulary.study.wordsKnown}
        </Typography>

        <Typography variant="h6" fontWeight={600} mb={4} color="text.primary">
          {message}
        </Typography>

        <Stack direction="row" gap={2} justifyContent="center">
          <Button variant="outlined" onClick={onRetry} size="large">
            {t.vocabulary.study.tryAgain}
          </Button>
          <Button variant="contained" onClick={onBack} size="large">
            {t.vocabulary.study.finish}
          </Button>
        </Stack>
      </Box>
    </motion.div>
  )
}

// ── VocabularyStudyPage ───────────────────────────────────────────────────────

export function VocabularyStudyPage({ setId }: VocabularyStudyPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { saveSession } = useVocabProgress()

  const [vocabSet, setVocabSet] = useState<VocabSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // Session state
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownIndices, setKnownIndices] = useState<number[]>([])
  const [forgotIndices, setForgotIndices] = useState<number[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
     
    setFetchError(false)
    void fetch(`/data/vocabulary/sets/${setId}.json`)
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<VocabSet>
      })
      .then(data => {
        setVocabSet(data)
        setQueue(shuffle(data.words.map((word, i) => ({ word, originalIndex: i }))))
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [setId])

  const resetSession = useCallback(() => {
    if (!vocabSet) return
    setQueue(shuffle(vocabSet.words.map((word, i) => ({ word, originalIndex: i }))))
    setCurrent(0)
    setFlipped(false)
    setKnownIndices([])
    setForgotIndices([])
    setDone(false)
  }, [vocabSet])

  const handleAnswer = useCallback(
    (knew: boolean) => {
      const item = queue[current]
      if (!item) return

      const newKnown = knew ? [...knownIndices, item.originalIndex] : knownIndices
      const newForgot = !knew ? [...forgotIndices, item.originalIndex] : forgotIndices

      setKnownIndices(newKnown)
      setForgotIndices(newForgot)

      if (current === queue.length - 1) {
        saveSession(setId, newKnown, newForgot)
        setDone(true)
      } else {
        setCurrent(c => c + 1)
        setFlipped(false)
      }
    },
    [current, queue, knownIndices, forgotIndices, saveSession, setId]
  )

  const goBack = useCallback(() => {
    void navigate({ to: '/vocabulary/$setId', params: { setId } })
  }, [navigate, setId])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
        <Skeleton variant="rounded" height={8} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Container>
    )
  }

  if (fetchError || !vocabSet) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Typography color="error" mb={2}>
          {t.common.error}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t.common.retry}
        </Button>
      </Container>
    )
  }

  if (done) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
        <DoneScreen
          knownCount={knownIndices.length}
          total={queue.length}
          onRetry={resetSession}
          onBack={goBack}
          t={t}
        />
      </Container>
    )
  }

  const item = queue[current]
  if (!item) return null
  const { word } = item

  const progressPct = queue.length > 0 ? (current / queue.length) * 100 : 0
  const cardLabel = t.vocabulary.study.cardOf

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Progress */}
      <Box mb={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography variant="caption" color="text.secondary">
            {current + 1} {cardLabel} {queue.length}
          </Typography>
          <Button variant="text" size="small" onClick={goBack} sx={{ color: 'text.disabled' }}>
            {t.vocabulary.backToVocab}
          </Button>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{ height: 5, borderRadius: 2.5 }}
        />
      </Box>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          variants={cardVariants}
          initial="enter"
          animate="visible"
          exit="exit"
        >
          <Box
            onClick={() => !flipped && setFlipped(true)}
            sx={{
              maxWidth: 480,
              minHeight: 320,
              mx: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              cursor: flipped ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              userSelect: 'none',
              position: 'relative',
              transition: 'box-shadow 0.2s',
              '&:hover': !flipped ? { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } : {},
            }}
          >
            <AnimatePresence mode="wait">
              {!flipped ? (
                /* Front face */
                <motion.div
                  key="front"
                  variants={faceVariants}
                  initial="enter"
                  animate="visible"
                  exit="exit"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  <Chip
                    label={TYPE_LABELS[word.type] ?? word.type}
                    color={typeColor(word.type)}
                    size="small"
                    sx={{ mb: 2, fontWeight: 700, fontSize: '0.7rem' }}
                  />
                  <Typography
                    dir="rtl"
                    sx={{
                      fontFamily: 'Amiri, serif',
                      fontSize: '3rem',
                      lineHeight: 1.3,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    {word.arabic}
                  </Typography>
                  <Typography variant="body2" color="text.disabled" mb={3}>
                    {word.root}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                    }}
                  >
                    {t.vocabulary.study.tapToFlip}
                  </Typography>
                </motion.div>
              ) : (
                /* Back face */
                <motion.div
                  key="back"
                  variants={faceVariants}
                  initial="enter"
                  animate="visible"
                  exit="exit"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    mb={0.5}
                    sx={{ fontSize: '2rem', lineHeight: 1.2 }}
                  >
                    {word.bs}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    {word.en}
                  </Typography>

                  <Box
                    sx={{
                      width: 32,
                      height: 1,
                      bgcolor: 'divider',
                      mx: 'auto',
                      mb: 2,
                    }}
                  />

                  <Typography
                    dir="rtl"
                    sx={{
                      fontFamily: 'Amiri, serif',
                      fontSize: '1.15rem',
                      lineHeight: 1.7,
                      display: 'block',
                      color: 'text.secondary',
                      mb: 0.75,
                    }}
                  >
                    {word.exampleArabic}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" display="block">
                    {word.exampleBs}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons — only after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: 0.05 } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          >
            <Stack direction="row" gap={2} justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                color="success"
                size="large"
                onClick={() => handleAnswer(true)}
                sx={{ flex: 1, maxWidth: 200, fontWeight: 700 }}
              >
                ✓ {t.vocabulary.study.knew}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => handleAnswer(false)}
                sx={{ flex: 1, maxWidth: 200, color: 'text.secondary', borderColor: 'divider' }}
              >
                ✗ {t.vocabulary.study.notYet}
              </Button>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  )
}
