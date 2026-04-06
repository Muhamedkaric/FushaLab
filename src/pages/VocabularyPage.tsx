import {
  Box,
  Typography,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Container,
  LinearProgress,
  Skeleton,
  Chip,
  Button,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import FlightIcon from '@mui/icons-material/Flight'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import MosqueIcon from '@mui/icons-material/Mosque'
import FavoriteIcon from '@mui/icons-material/Favorite'
import WorkIcon from '@mui/icons-material/Work'
import LaptopIcon from '@mui/icons-material/Laptop'
import GroupsIcon from '@mui/icons-material/Groups'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import SchoolIcon from '@mui/icons-material/School'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import PsychologyIcon from '@mui/icons-material/Psychology'
import TranslateIcon from '@mui/icons-material/Translate'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useVocabProgress } from '@/hooks/useVocabProgress'
import { useI18n } from '@/i18n'
import type { VocabIndex, VocabSetMeta, VocabRootMeta } from '@/types/vocabulary'

// ── Constants ──────────────────────────────────────────────────────────────────

const LEVEL_COLORS = { B1: 'primary', B2: 'secondary', C1: 'warning', C2: 'error' } as const

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  travel: <FlightIcon />,
  culture: <TheaterComedyIcon />,
  news: <NewspaperIcon />,
  literature: <MenuBookIcon />,
  religion: <MosqueIcon />,
  health: <FavoriteIcon />,
  work: <WorkIcon />,
  technology: <LaptopIcon />,
  social: <GroupsIcon />,
  food: <RestaurantIcon />,
  education: <SchoolIcon />,
  finance: <AccountBalanceIcon />,
  history: <HistoryEduIcon />,
  psychology: <PsychologyIcon />,
  general: <TranslateIcon />,
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

// ── Stat Box ──────────────────────────────────────────────────────────────────

interface StatBoxProps {
  label: string
  value: number | string
  loading?: boolean
}

function StatBox({ label, value, loading }: StatBoxProps) {
  return (
    <Box
      sx={{
        flex: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 1.5,
        textAlign: 'center',
      }}
    >
      {loading ? (
        <Skeleton width={40} height={28} sx={{ mx: 'auto' }} />
      ) : (
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}

// ── Word Set Card ─────────────────────────────────────────────────────────────

interface SetCardProps {
  set: VocabSetMeta
  knownCount: number
}

function SetCard({ set, knownCount }: SetCardProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const hasWords = set.wordCount > 0
  const progress = hasWords ? (knownCount / set.wordCount) * 100 : 0
  const icon = TOPIC_ICONS[set.topic] ?? <TranslateIcon />
  const levelColor = LEVEL_COLORS[set.level] ?? 'primary'

  return (
    <motion.div variants={itemVariants} style={{ height: '100%' }}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: hasWords ? 'primary.main' : 'divider',
            boxShadow: hasWords ? '0 4px 20px rgba(201, 168, 76, 0.15)' : 'none',
          },
        }}
      >
        <CardActionArea
          onClick={() => void navigate({ to: '/vocabulary/$setId', params: { setId: set.id } })}
          sx={{ p: 2, height: '100%', alignItems: 'flex-start' }}
        >
          <CardContent sx={{ p: 0, width: '100%' }}>
            {/* Header row: icon + Arabic title + level chip */}
            <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: hasWords ? 'primary.main' : 'action.selected',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: hasWords ? 'primary.contrastText' : 'text.disabled',
                  transition: 'background-color 0.2s',
                }}
              >
                {icon}
              </Box>

              <Box flex={1} minWidth={0} display="flex" alignItems="center" gap={1}>
                <Typography
                  sx={{
                    fontFamily: '"Amiri", serif',
                    fontSize: '1.25rem',
                    lineHeight: 1.6,
                    direction: 'rtl',
                    flex: 1,
                    textAlign: 'right',
                    pt: 0.5,
                  }}
                >
                  {set.titleAr}
                </Typography>
                <Chip
                  label={set.level}
                  color={levelColor}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}
                />
              </Box>
            </Stack>

            {/* English title */}
            <Typography
              variant="subtitle2"
              fontWeight={600}
              noWrap
              mb={1.5}
              color={hasWords ? 'text.primary' : 'text.disabled'}
            >
              {set.title}
            </Typography>

            {/* Progress bar + word count */}
            <LinearProgress
              variant="determinate"
              value={progress}
              color={levelColor}
              sx={{ height: 4, borderRadius: 2, mb: 0.75 }}
            />
            <Typography variant="caption" color="text.secondary">
              {knownCount} / {set.wordCount} {t.vocabulary.words} {t.vocabulary.known}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  )
}

// ── Root Chip ─────────────────────────────────────────────────────────────────

interface RootChipProps {
  root: VocabRootMeta
}

function RootChip({ root }: RootChipProps) {
  const navigate = useNavigate()

  return (
    <Box
      onClick={() => void navigate({ to: '/vocabulary' })}
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Amiri", serif',
          fontSize: '1.4rem',
          lineHeight: 1.2,
          direction: 'rtl',
          fontWeight: 700,
        }}
      >
        {root.root}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.25, maxWidth: 90, textAlign: 'center', lineHeight: 1.2 }}
        noWrap
      >
        {root.rootMeaning}
      </Typography>
    </Box>
  )
}

// ── VocabularyPage ─────────────────────────────────────────────────────────────

export function VocabularyPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { knownCountForSet, totalKnown } = useVocabProgress()

  const [index, setIndex] = useState<VocabIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    setError(false)

    void fetch('/data/vocabulary/index.json')
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<VocabIndex>
      })
      .then(data => {
        if (!cancelled) {
          setIndex(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const sets: VocabSetMeta[] = index?.sets ?? []
  const roots: VocabRootMeta[] = index?.roots ?? []
  const totalWords = sets.reduce((sum, s) => sum + s.wordCount, 0)

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Typography color="error" mb={2}>
          {t.common.error}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t.common.retry}
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            <TranslateIcon />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {t.vocabulary.title}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {t.vocabulary.subtitle}
        </Typography>

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <Stack direction="row" gap={1.5} mb={4}>
          <StatBox label={t.vocabulary.words} value={totalWords} loading={loading} />
          <StatBox label={t.vocabulary.known} value={totalKnown} />
          <StatBox
            label={t.vocabulary.rootExplorer}
            value={loading ? '' : roots.length}
            loading={loading}
          />
        </Stack>
      </motion.div>

      {/* ── Word Sets ─────────────────────────────────────────────────────────── */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        {t.vocabulary.sets}
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }} component="div">
              <Skeleton variant="rounded" height={148} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2}>
            {sets.map(set => (
              <Grid key={set.id} size={{ xs: 12, sm: 6 }} component="div">
                <SetCard set={set} knownCount={knownCountForSet(set.id, set.wordCount)} />
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* ── Root Explorer strip ───────────────────────────────────────────────── */}
      {(loading || roots.length > 0) && (
        <Box mt={5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              {t.vocabulary.rootExplorer}
            </Typography>
            {!loading && (
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => void navigate({ to: '/vocabulary' })}
                sx={{ textTransform: 'none' }}
              >
                {t.vocabulary.viewAllRoots}
              </Button>
            )}
          </Stack>

          {loading ? (
            <Stack direction="row" gap={1.5} overflow="hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={90}
                  height={72}
                  sx={{ borderRadius: 2, flexShrink: 0 }}
                />
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
              }}
            >
              {roots.map(root => (
                <RootChip key={root.id} root={root} />
              ))}
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => void navigate({ to: '/vocabulary' })}
                sx={{
                  flexShrink: 0,
                  alignSelf: 'center',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.vocabulary.viewAllRoots}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  )
}
