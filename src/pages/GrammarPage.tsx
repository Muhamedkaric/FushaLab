import { Box, Typography, Container, Stack, Chip, Button, Skeleton } from '@mui/material'
import Grid from '@mui/material/Grid'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import BoltIcon from '@mui/icons-material/Bolt'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useGrammarProgress } from '@/hooks/useGrammarProgress'
import { useI18n } from '@/i18n'
import type { GrammarIndex, GrammarBlock, GrammarLessonMeta } from '@/types/grammar'

// ── Colours ───────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<
  string,
  'success' | 'info' | 'primary' | 'secondary' | 'warning' | 'error'
> = {
  A1: 'success',
  A2: 'info',
  B1: 'primary',
  B2: 'secondary',
  C1: 'warning',
  C2: 'error',
}

const BLOCK_COLORS = [
  '#1565C0', // Block 1 — deep blue
  '#1B5E20', // Block 2 — deep green
  '#E65100', // Block 3 — deep orange
  '#4A148C', // Block 4 — deep purple
  '#006064', // Block 5 — teal
  '#37474F', // Block 6 — blue-gray
  '#BF360C', // Block 7 — red-orange
  '#1A237E', // Block 8 — indigo
  '#004D40', // Block 9 — deep teal
  '#212121', // Block 10 — near black
]

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

// ── Lesson card ───────────────────────────────────────────────────────────────

type Loc = (bs: string, en?: string) => string

interface LessonCardProps {
  lesson: GrammarLessonMeta
  stars: number
  completed: boolean
  onStart: () => void
  t: ReturnType<typeof useI18n>['t']
  loc: Loc
}

function LessonCard({ lesson, stars, completed, onStart, t, loc }: LessonCardProps) {
  const levelColor = LEVEL_COLOR[lesson.level] ?? 'primary'

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: completed ? 'success.main' : stars > 0 ? 'primary.main' : 'divider',
        borderRadius: 3,
        p: 2.5,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
      }}
    >
      {/* Top: level + stars */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" gap={0.5} alignItems="center">
          <Chip
            label={lesson.level}
            color={levelColor}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20 }}
          />
          <Chip
            label={lesson.track === 'nahw' ? 'نَحْوٌ' : 'صَرْفٌ'}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'Amiri, serif', fontSize: '0.8rem', height: 20, fontWeight: 600 }}
          />
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {completed && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
          <Stack direction="row" gap={0.25}>
            {[0, 1, 2].map(i =>
              i < stars ? (
                <StarIcon key={i} sx={{ fontSize: 14, color: 'warning.main' }} />
              ) : (
                <StarBorderIcon key={i} sx={{ fontSize: 14, color: 'text.disabled' }} />
              )
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Arabic title */}
      <Typography
        dir="rtl"
        sx={{
          fontFamily: 'Amiri, serif',
          fontSize: '1.35rem',
          lineHeight: 1.7,
          color: 'text.primary',
          fontWeight: 600,
        }}
      >
        {lesson.titleAr}
      </Typography>

      {/* Localised title + summary */}
      <Box flex={1}>
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
          {loc(lesson.titleBs, lesson.titleEn)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
          {loc(lesson.summary, lesson.summaryEn)}
        </Typography>
      </Box>

      {/* Footer */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={0.4}>
          <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {lesson.estimatedMinutes} {t.grammar.minutes}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mx: 0.5 }}>
            ·
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {lesson.quizCount} {t.grammar.questions}
          </Typography>
        </Stack>
        <Button
          variant={completed ? 'text' : stars > 0 ? 'outlined' : 'contained'}
          size="small"
          color={completed ? 'success' : 'primary'}
          onClick={onStart}
          sx={{ fontWeight: 700, minWidth: 72 }}
        >
          {completed
            ? t.grammar.reviewLesson
            : stars > 0
              ? t.grammar.continueLesson
              : t.grammar.startLesson}
        </Button>
      </Stack>
    </Box>
  )
}

// ── Block section ─────────────────────────────────────────────────────────────

interface BlockSectionProps {
  block: GrammarBlock
  blockIndex: number
  getLessonProgress: (id: string) => { stars: number; completed: boolean }
  onLesson: (id: string) => void
  t: ReturnType<typeof useI18n>['t']
  loc: Loc
}

function BlockSection({
  block,
  blockIndex,
  getLessonProgress,
  onLesson,
  t,
  loc,
}: BlockSectionProps) {
  const accent = BLOCK_COLORS[blockIndex % BLOCK_COLORS.length]

  return (
    <Box mb={5}>
      {/* Block header */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box
          sx={{
            width: 4,
            height: 40,
            borderRadius: 2,
            bgcolor: accent,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: '1.2rem',
              lineHeight: 1.4,
              color: accent,
              fontWeight: 700,
            }}
          >
            {block.titleAr}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {loc(block.titleBs, block.titleEn)} · {block.lessons.length} {t.grammar.lessons}
          </Typography>
        </Box>
      </Stack>

      {/* Lesson cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={2}>
          {block.lessons.map(lesson => {
            const progress = getLessonProgress(lesson.id)
            return (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <LessonCard
                    lesson={lesson}
                    stars={progress.stars}
                    completed={progress.completed}
                    onStart={() => onLesson(lesson.id)}
                    t={t}
                    loc={loc}
                  />
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </motion.div>
    </Box>
  )
}

// ── GrammarPage ───────────────────────────────────────────────────────────────

export function GrammarPage() {
  const { t, lang } = useI18n()
  const loc = (bs: string, en?: string) => (lang === 'en' && en ? en : bs)
  const navigate = useNavigate()
  const { totalXp, completedCount, getLessonProgress } = useGrammarProgress()

  const [index, setIndex] = useState<GrammarIndex | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/data/grammar/index.json')
      .then(async r => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<GrammarIndex>
      })
      .then(data => {
        setIndex(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalLessons = index?.blocks.reduce((s, b) => s + b.lessons.length, 0) ?? 0

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={4}>
        <Box>
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: '2rem',
              lineHeight: 1.3,
              color: 'text.primary',
              fontWeight: 700,
              display: 'block',
            }}
          >
            قَوَاعِدُ اللُّغَةِ
          </Typography>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {t.grammar.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} maxWidth={520}>
            {t.grammar.subtitle}
          </Typography>
          {!loading && (
            <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
              {completedCount}/{totalLessons} {t.grammar.completed}
            </Typography>
          )}
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
            {totalXp} {t.grammar.totalXp}
          </Typography>
        </Box>
      </Stack>

      {/* Content */}
      {loading ? (
        <Stack gap={4}>
          {[1, 2].map(i => (
            <Box key={i}>
              <Skeleton variant="rounded" width={200} height={24} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[1, 2, 3].map(j => (
                  <Grid key={j} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      ) : index ? (
        index.blocks.map((block, idx) => (
          <BlockSection
            key={block.number}
            block={block}
            blockIndex={idx}
            getLessonProgress={id => getLessonProgress(id)}
            onLesson={id => void navigate({ to: '/grammar/$lessonId', params: { lessonId: id } })}
            t={t}
            loc={loc}
          />
        ))
      ) : (
        <Typography color="text.secondary">{t.common.error}</Typography>
      )}
    </Container>
  )
}
