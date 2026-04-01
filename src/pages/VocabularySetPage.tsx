import {
  Box,
  Typography,
  Stack,
  Container,
  Chip,
  Divider,
  Collapse,
  LinearProgress,
  Button,
  Skeleton,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SchoolIcon from '@mui/icons-material/School'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useVocabProgress } from '@/hooks/useVocabProgress'
import { useI18n } from '@/i18n'
import type { VocabSet, VocabWord } from '@/types/vocabulary'

interface VocabularySetPageProps {
  setId: string
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

type ChipColor = 'primary' | 'secondary' | 'warning' | 'default'

const TYPE_COLORS: Record<string, ChipColor> = {
  noun: 'primary',
  verb: 'secondary',
  adjective: 'warning',
}

function typeColor(type: string): ChipColor {
  return TYPE_COLORS[type] ?? 'default'
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

// ── Word row ──────────────────────────────────────────────────────────────────

interface WordRowProps {
  word: VocabWord
  isKnown: boolean
}

function WordRow({ word, isKnown }: WordRowProps) {
  const [expanded, setExpanded] = useState(false)

  const speakWord = () => {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(word.arabic)
    utt.lang = 'ar-SA'
    window.speechSynthesis.speak(utt)
  }

  return (
    <Box>
      <Box
        onClick={() => setExpanded(e => !e)}
        sx={{
          py: 1.5,
          px: 1,
          cursor: 'pointer',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {/* Left: type chip + translations */}
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.25} flexWrap="wrap">
            <Chip
              label={TYPE_LABELS[word.type] ?? word.type}
              color={typeColor(word.type)}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
            />
            <Typography variant="body2" fontWeight={600} noWrap>
              {word.bs}
            </Typography>
            {isKnown && (
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {word.en}
          </Typography>
        </Box>

        {/* Right: Arabic word + root */}
        <Box textAlign="right" flexShrink={0}>
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: '1.4rem',
              lineHeight: 1.3,
              display: 'block',
            }}
          >
            {word.arabic}
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block">
            {word.root}
          </Typography>
        </Box>

        {/* Expand chevron */}
        <Box sx={{ color: 'text.disabled', display: 'flex', flexShrink: 0 }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
      </Box>

      {/* Expanded detail */}
      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            px: 2,
            pb: 2,
            pt: 0.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            mb: 0.5,
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
            <Box flex={1}>
              <Typography
                dir="rtl"
                sx={{
                  fontFamily: 'Amiri, serif',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  display: 'block',
                  textAlign: 'right',
                  mb: 0.5,
                }}
                color="text.primary"
              >
                {word.exampleArabic}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                {word.exampleBs}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {word.exampleEn}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation()
                speakWord()
              }}
              sx={{ mt: 0.5, flexShrink: 0, color: 'text.secondary' }}
              aria-label="Speak Arabic word"
            >
              <VolumeUpIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Collapse>

      <Divider />
    </Box>
  )
}

// ── VocabularySetPage ─────────────────────────────────────────────────────────

export function VocabularySetPage({ setId }: VocabularySetPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isKnown, knownCountForSet } = useVocabProgress()

  const [vocabSet, setVocabSet] = useState<VocabSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchSet = () => {
    setLoading(true)
    setError(false)
    void fetch(`/data/vocabulary/sets/${setId}.json`)
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<VocabSet>
      })
      .then(data => {
        setVocabSet(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId])

  const knownCount = vocabSet ? knownCountForSet(setId, vocabSet.words.length) : 0
  const total = vocabSet?.words.length ?? 0
  const pctKnown = total > 0 ? Math.round((knownCount / total) * 100) : 0

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        onClick={() => void navigate({ to: '/vocabulary' })}
        sx={{ mb: 2, ml: -1 }}
      >
        {t.vocabulary.backToVocab}
      </Button>

      {/* Header */}
      {loading ? (
        <Box mb={3}>
          <Skeleton width={280} height={40} sx={{ mb: 1 }} />
          <Skeleton width={180} height={24} />
        </Box>
      ) : error ? (
        <Box py={6} textAlign="center">
          <Typography color="error" mb={2}>
            {t.common.error}
          </Typography>
          <Button variant="outlined" onClick={fetchSet}>
            {t.common.retry}
          </Button>
        </Box>
      ) : vocabSet ? (
        <>
          {/* Title row */}
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={2}
            mb={1}
          >
            <Box flex={1} minWidth={0}>
              <Stack direction="row" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                <Chip
                  label={vocabSet.level}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {t.levels[vocabSet.level]}
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {vocabSet.title}
              </Typography>
            </Box>
            <Typography
              dir="rtl"
              sx={{
                fontFamily: 'Amiri, serif',
                fontSize: '1.9rem',
                lineHeight: 1.2,
                flexShrink: 0,
                color: 'text.secondary',
              }}
            >
              {vocabSet.titleAr}
            </Typography>
          </Stack>

          {/* Progress bar + Study button */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                {knownCount} / {total} {t.vocabulary.words} {t.vocabulary.known}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<SchoolIcon />}
                onClick={() => void navigate({ to: '/vocabulary/$setId/study', params: { setId } })}
                disabled={total === 0}
              >
                {t.vocabulary.studySet}
              </Button>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={pctKnown}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Word list */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {vocabSet.words.map((word, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <WordRow word={word} isKnown={isKnown(setId, idx)} />
              </motion.div>
            ))}
          </motion.div>
        </>
      ) : null}

      {/* Loading skeletons */}
      {loading && (
        <Box>
          {Array.from({ length: 10 }, (_, i) => (
            <Box key={i} py={1.5}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Box flex={1}>
                  <Skeleton width="40%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton width="25%" height={14} />
                </Box>
                <Box textAlign="right">
                  <Skeleton width={80} height={28} />
                  <Skeleton width={40} height={14} sx={{ ml: 'auto' }} />
                </Box>
              </Stack>
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          ))}
        </Box>
      )}
    </Container>
  )
}
