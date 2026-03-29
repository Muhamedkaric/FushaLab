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
  ButtonBase,
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
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import PsychologyIcon from '@mui/icons-material/Psychology'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import BalanceIcon from '@mui/icons-material/Balance'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { Category, Level } from '@/types/content'
import { useProgress } from '@/hooks/useProgress'
import { useI18n } from '@/i18n'

const LEVELS: Level[] = ['B1', 'B2', 'C1', 'C2']

const LEVEL_COLORS: Record<Level, 'primary' | 'secondary' | 'warning' | 'error'> = {
  B1: 'primary',
  B2: 'secondary',
  C1: 'warning',
  C2: 'error',
}

interface CategoryDef {
  id: Category
  icon: React.ReactNode
}

// Sorted alphabetically by id
const ALL_CATEGORIES: CategoryDef[] = [
  { id: 'conversations', icon: <ChatBubbleOutlineIcon /> },
  { id: 'culture', icon: <TheaterComedyIcon /> },
  { id: 'education', icon: <SchoolIcon /> },
  { id: 'finance', icon: <AccountBalanceIcon /> },
  { id: 'food', icon: <RestaurantIcon /> },
  { id: 'health', icon: <FavoriteIcon /> },
  { id: 'history', icon: <HistoryEduIcon /> },
  { id: 'idioms', icon: <FormatQuoteIcon /> },
  { id: 'literature', icon: <MenuBookIcon /> },
  { id: 'mysteries', icon: <ManageSearchIcon /> },
  { id: 'news', icon: <NewspaperIcon /> },
  { id: 'opinions', icon: <BalanceIcon /> },
  { id: 'psychology', icon: <PsychologyIcon /> },
  { id: 'religion', icon: <MosqueIcon /> },
  { id: 'social', icon: <GroupsIcon /> },
  { id: 'stories', icon: <AutoStoriesIcon /> },
  { id: 'technology', icon: <LaptopIcon /> },
  { id: 'travel', icon: <FlightIcon /> },
  { id: 'work', icon: <WorkIcon /> },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// ── Level progress pill ───────────────────────────────────────────────────────

interface LevelPillProps {
  level: Level
  total: number
  score: number
  loading: boolean
  onClick: (e: React.MouseEvent) => void
}

function LevelPill({ level, total, score, loading, onClick }: LevelPillProps) {
  const color = LEVEL_COLORS[level]
  const hasData = !loading && total > 0
  const isEmpty = !loading && total === 0

  return (
    <ButtonBase
      onClick={onClick}
      disableRipple={isEmpty}
      sx={{
        flex: 1,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: hasData ? `${color}.main` : 'divider',
        borderStyle: isEmpty ? 'dashed' : 'solid',
        px: 1,
        py: 0.75,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0.5,
        opacity: isEmpty ? 0.4 : 1,
        transition: 'background-color 0.15s, opacity 0.15s',
        '&:hover': !isEmpty
          ? { bgcolor: 'action.hover' }
          : {},
        cursor: isEmpty ? 'default' : 'pointer',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          component="span"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            lineHeight: 1,
            color: hasData ? `${color}.main` : 'text.disabled',
          }}
        >
          {level}
        </Typography>

        {loading ? (
          <Skeleton width={20} height={10} />
        ) : hasData ? (
          <Typography
            component="span"
            sx={{ fontSize: '0.62rem', lineHeight: 1, color: 'text.secondary' }}
          >
            {score}%
          </Typography>
        ) : (
          <Typography
            component="span"
            sx={{ fontSize: '0.62rem', lineHeight: 1, color: 'text.disabled' }}
          >
            —
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Skeleton variant="rounded" height={3} sx={{ mt: 0.25 }} />
      ) : hasData ? (
        <LinearProgress
          variant="determinate"
          value={score}
          color={color}
          sx={{ height: 3, borderRadius: 1.5 }}
        />
      ) : (
        <Box sx={{ height: 3, borderRadius: 1.5, bgcolor: 'action.hover', mt: 0.25 }} />
      )}
    </ButtonBase>
  )
}

// ── ReadingPage ───────────────────────────────────────────────────────────────

export function ReadingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { progress } = useProgress()
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [totalsLoading, setTotalsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const jobs = ALL_CATEGORIES.flatMap(cat =>
      LEVELS.map(async level => {
        const key = `${cat.id}-${level}`
        try {
          const r = await fetch(`/data/${cat.id}/${level}/index.json`)
          if (!r.ok) return [key, 0] as const
          const data = (await r.json()) as { items?: unknown[] }
          return [key, data.items?.length ?? 0] as const
        } catch {
          return [key, 0] as const
        }
      })
    )

    void Promise.all(jobs).then(results => {
      if (!cancelled) {
        setTotals(Object.fromEntries(results))
        setTotalsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>
          {t.nav.reading}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          {t.home.sections.reading.desc}
        </Typography>
      </motion.div>

      <Typography variant="h6" fontWeight={600} mb={2}>
        {t.home.chooseCategory}
      </Typography>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={2}>
          {ALL_CATEGORIES.map(cat => {
            const levelStats = LEVELS.map(level => {
              const key = `${cat.id}-${level}`
              const total = totals[key] ?? 0
              const prefix = `${cat.id}-${level.toLowerCase()}-`
              let easy = 0,
                medium = 0
              for (const [id, rating] of Object.entries(progress.ratings)) {
                if (id.startsWith(prefix)) {
                  if (rating === 'easy') easy++
                  else if (rating === 'medium') medium++
                }
              }
              const score = total > 0 ? Math.round(((easy + 0.5 * medium) / total) * 100) : 0
              return { level, total, easy, score }
            })

            const hasAnyData = levelStats.some(s => s.total > 0)
            const firstLevel = levelStats.find(s => s.total > 0)?.level ?? 'B1'
            const totalLearned = levelStats.reduce((s, l) => s + l.easy, 0)
            const totalItems = levelStats.reduce((s, l) => s + l.total, 0)

            return (
              <Grid key={cat.id} size={{ xs: 12, sm: 6 }} component="div">
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
                        borderColor: hasAnyData ? 'primary.main' : 'divider',
                        boxShadow: hasAnyData
                          ? '0 4px 20px rgba(201, 168, 76, 0.15)'
                          : 'none',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() =>
                        void navigate({
                          to: '/reading/$category/$level',
                          params: { category: cat.id, level: firstLevel },
                        })
                      }
                      sx={{ p: 2, height: '100%', alignItems: 'flex-start' }}
                    >
                      <CardContent sx={{ p: 0, width: '100%' }}>
                        {/* Header row */}
                        <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: hasAnyData ? 'primary.main' : 'action.selected',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: hasAnyData ? 'primary.contrastText' : 'text.disabled',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            {cat.icon}
                          </Box>

                          <Box flex={1} minWidth={0}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {t.categories[cat.id]}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              noWrap
                            >
                              {totalsLoading ? (
                                <Skeleton width={90} height={12} />
                              ) : hasAnyData ? (
                                `${totalLearned} / ${totalItems} ${t.reader.textsTotal}`
                              ) : (
                                t.reader.noContent
                              )}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Level progress pills */}
                        <Stack direction="row" gap={0.75}>
                          {levelStats.map(({ level, total, score }) => (
                            <LevelPill
                              key={level}
                              level={level}
                              total={total}
                              score={score}
                              loading={totalsLoading}
                              onClick={e => {
                                e.stopPropagation()
                                void navigate({
                                  to: '/reading/$category/$level',
                                  params: { category: cat.id, level },
                                })
                              }}
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </motion.div>
    </Container>
  )
}
