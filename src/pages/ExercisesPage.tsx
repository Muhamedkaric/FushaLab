import {
  Box,
  Typography,
  Container,
  Stack,
  Chip,
  Button,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import BoltIcon from '@mui/icons-material/Bolt'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useExerciseProgress } from '@/hooks/useExerciseProgress'
import { useI18n } from '@/i18n'
import type { ExercisesIndex, ExercisePackMeta, ExerciseType } from '@/types/exercises'

// ── Topic emojis ──────────────────────────────────────────────────────────────

const TOPIC_EMOJI: Record<string, string> = {
  greetings: '👋',
  objects: '🏠',
  family: '👨‍👩‍👧',
  adjectives: '🎨',
  verbs: '⚡',
  food: '🍽️',
  places: '🗺️',
  daily: '📅',
  work: '💼',
  health: '🏥',
  travel: '✈️',
  society: '📰',
  formal: '📋',
  business: '🤝',
  roots: '🌳',
  academic: '🎓',
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  'word-meaning': '📖',
  'word-arabic': 'ع',
  'fill-blank': '___',
  'sentence-order': '🔀',
  'match-pairs': '🔗',
  'odd-one-out': '🔍',
  'listen-select': '🔊',
}

type LevelColor = 'success' | 'info' | 'primary' | 'secondary'

const LEVEL_COLOR: Record<string, LevelColor> = {
  A1: 'success',
  A2: 'info',
  B1: 'primary',
  B2: 'secondary',
}

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

// ── Pack card ─────────────────────────────────────────────────────────────────

interface PackCardProps {
  pack: ExercisePackMeta
  stars: number
  onStart: () => void
  t: ReturnType<typeof useI18n>['t']
}

function PackCard({ pack, stars, onStart, t }: PackCardProps) {
  const emoji = TOPIC_EMOJI[pack.topic] ?? '📝'
  const levelColor = LEVEL_COLOR[pack.level] ?? 'primary'

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: stars > 0 ? 'primary.main' : 'divider',
        borderRadius: 3,
        p: 2.5,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
      }}
    >
      {/* Top row: emoji + level chip + stars */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
          }}
        >
          {emoji}
        </Box>
        <Stack alignItems="flex-end" gap={0.5}>
          <Chip
            label={pack.level}
            color={levelColor}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20 }}
          />
          <Stack direction="row" gap={0.25}>
            {[0, 1, 2].map(i =>
              i < stars ? (
                <StarIcon key={i} sx={{ fontSize: 16, color: 'warning.main' }} />
              ) : (
                <StarBorderIcon key={i} sx={{ fontSize: 16, color: 'text.disabled' }} />
              )
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Title */}
      <Box flex={1}>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} gutterBottom>
          {pack.title}
        </Typography>
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1rem', color: 'text.secondary', lineHeight: 1.6 }}
        >
          {pack.titleAr}
        </Typography>
      </Box>

      {/* Exercise type pills */}
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {pack.types.map(type => (
          <Box
            key={type}
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
            }}
          >
            {TYPE_LABELS[type]} {type.replace('-', ' ')}
          </Box>
        ))}
      </Stack>

      {/* Footer: metadata + button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" gap={1.5} alignItems="center">
          <Stack direction="row" alignItems="center" gap={0.4}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              {pack.estimatedMinutes} {t.exercises.minutes}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.disabled">
            {pack.exerciseCount} {t.exercises.exercises}
          </Typography>
        </Stack>
        <Button
          variant={stars > 0 ? 'outlined' : 'contained'}
          size="small"
          onClick={onStart}
          sx={{ fontWeight: 700, minWidth: 80 }}
        >
          {stars > 0 ? t.exercises.continue : t.exercises.start}
        </Button>
      </Stack>
    </Box>
  )
}

// ── ExercisesPage ─────────────────────────────────────────────────────────────

type LevelFilter = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2'

export function ExercisesPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { totalXp, getPackProgress } = useExerciseProgress()

  const [packs, setPacks] = useState<ExercisePackMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL')

  useEffect(() => {
    void fetch('/data/exercises/index.json')
      .then(async r => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<ExercisesIndex>
      })
      .then(data => {
        setPacks(data.packs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = levelFilter === 'ALL' ? packs : packs.filter(p => p.level === levelFilter)

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {t.exercises.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {t.exercises.subtitle}
          </Typography>
        </Box>
        {/* XP badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            flexShrink: 0,
          }}
        >
          <BoltIcon sx={{ fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={800}>
            {totalXp} {t.exercises.totalXp}
          </Typography>
        </Box>
      </Stack>

      {/* Level filter */}
      <Box mb={3} sx={{ overflowX: 'auto', pb: 0.5 }}>
        <ToggleButtonGroup
          value={levelFilter}
          exclusive
          onChange={(_, v) => {
            if (v !== null) setLevelFilter(v as LevelFilter)
          }}
          size="small"
        >
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as LevelFilter[]).map(lv => (
            <ToggleButton key={lv} value={lv} sx={{ px: 2, fontWeight: 600 }}>
              {lv === 'ALL' ? 'All' : lv}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Pack grid */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }, (_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2}>
            {filtered.map(pack => (
              <Grid key={pack.id} size={{ xs: 12, sm: 6 }}>
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <PackCard
                    pack={pack}
                    stars={getPackProgress(pack.id).stars}
                    onStart={() => void navigate({ to: '/exercises/$packId', params: { packId: pack.id } })}
                    t={t}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}
    </Container>
  )
}
