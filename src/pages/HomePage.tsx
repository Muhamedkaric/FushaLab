import {
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  Stack,
  Chip,
  Container,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import TranslateIcon from '@mui/icons-material/Translate'
import ForumIcon from '@mui/icons-material/Forum'
import QuizIcon from '@mui/icons-material/Quiz'
import InsightsIcon from '@mui/icons-material/Insights'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { getTodaysWord } from '@/data/wordOfDay'
import { useProgress } from '@/hooks/useProgress'

const DAILY_GOAL_KEY = 'fushalab_daily_goal'
const GOAL_OPTIONS = [1, 3, 5, 10]

// SVG ring showing daily goal progress
function GoalRing({ done, goal, onCycleGoal, label, reachedLabel }: {
  done: number; goal: number; onCycleGoal: () => void; label: string; reachedLabel: string
}) {
  const r = 16
  const circ = 2 * Math.PI * r
  const progress = Math.min(done / goal, 1)
  const dash = progress * circ
  const reached = done >= goal

  return (
    <Tooltip title={`${label} — ${reachedLabel.toLowerCase()} (${GOAL_OPTIONS.join('/')})`}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        onClick={onCycleGoal}
        sx={{ cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
      >
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth={3} />
            <circle
              cx="20" cy="20" r={r} fill="none"
              stroke={reached ? '#4caf50' : '#C9A84C'}
              strokeWidth={3}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          </svg>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.65rem',
              color: reached ? 'success.main' : 'primary.main',
            }}
          >
            {done}/{goal}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {reached ? reachedLabel : label}
        </Typography>
      </Stack>
    </Tooltip>
  )
}

// Parse a reading item ID like "travel-b1-042" into { category, level, path }
function parseLastReadId(id: string): { category: string; level: string; path: string } | null {
  // ID format: {category}-{level}-{number}, level is always 2 chars (b1/b2/c1/c2)
  const match = id.match(/^(.+)-(b1|b2|c1|c2)-\d+$/i)
  if (!match) return null
  const category = match[1]
  const level = match[2].toUpperCase()
  return { category, level, path: `/reading/${category}/${level}/${id}` }
}

// Arabic letters to float in the hero background
const FLOAT_LETTERS = ['ع', 'ل', 'م', 'ك', 'ت', 'ب', 'ق', 'ر', 'ن', 'و', 'ف', 'ص', 'ح', 'ذ', 'ش']

interface FloatLetter {
  letter: string
  x: string
  y: string
  size: string
  duration: number
  delay: number
  opacity: number
}

const FLOATERS: FloatLetter[] = FLOAT_LETTERS.map((letter, i) => ({
  letter,
  x: `${5 + ((i * 6.2) % 90)}%`,
  y: `${10 + ((i * 13.7) % 75)}%`,
  size: `${1.5 + (i % 4) * 0.6}rem`,
  duration: 4 + (i % 5),
  delay: i * 0.4,
  opacity: 0.06 + (i % 4) * 0.03,
}))

const SECTIONS = [
  { path: '/reading', icon: <MenuBookIcon />, key: 'reading' as const },
  { path: '/listening', icon: <HeadphonesIcon />, key: 'listening' as const },
  { path: '/vocabulary', icon: <TranslateIcon />, key: 'vocabulary' as const },
  { path: '/conversation', icon: <ForumIcon />, key: 'conversation' as const },
  { path: '/exercises', icon: <QuizIcon />, key: 'exercises' as const },
  { path: '/progress', icon: <InsightsIcon />, key: 'progress' as const },
]

export function HomePage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { stats, progress } = useProgress()
  const word = getTodaysWord()

  const lastRead = useMemo(() => {
    const entries = Object.entries(progress.completedAt)
    if (entries.length === 0) return null
    const [latestId] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))
    return parseLastReadId(latestId)
  }, [progress.completedAt])

  const [dailyGoal, setDailyGoal] = useState(() => {
    const stored = Number(localStorage.getItem(DAILY_GOAL_KEY))
    return GOAL_OPTIONS.includes(stored) ? stored : 3
  })

  const todayCount = useMemo(() => {
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)
    const midnightTs = midnight.getTime()
    return Object.values(progress.completedAt).filter(ts => ts >= midnightTs).length
  }, [progress.completedAt])

  const cycleGoal = () => {
    setDailyGoal(prev => {
      const nextIdx = (GOAL_OPTIONS.indexOf(prev) + 1) % GOAL_OPTIONS.length
      const next = GOAL_OPTIONS[nextIdx]
      localStorage.setItem(DAILY_GOAL_KEY, String(next))
      return next
    })
  }
  const prefersReducedMotion = useReducedMotion()

  return (
    <Box>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '92vh', md: '88vh' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          bgcolor: 'background.default',
          px: 3,
        }}
      >
        {/* Floating Arabic letters */}
        {!prefersReducedMotion && (
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none' }}>
            {FLOATERS.map((f, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  left: f.x,
                  top: f.y,
                  fontSize: f.size,
                  fontFamily: '"Amiri", serif',
                  color: '#C9A84C',
                  opacity: f.opacity,
                  direction: 'rtl',
                }}
                animate={{ y: [0, -18, 0], opacity: [f.opacity, f.opacity * 1.6, f.opacity] }}
                transition={{
                  duration: f.duration,
                  delay: f.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {f.letter}
              </motion.div>
            ))}
          </Box>
        )}

        {/* Gold glow orb */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 300, md: 500 },
            height: { xs: 300, md: 500 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          {/* Arabic calligraphy title */}
          <Typography
            sx={{
              fontFamily: '"Amiri", serif',
              fontSize: { xs: '2.8rem', sm: '4rem', md: '5rem' },
              fontWeight: 700,
              direction: 'rtl',
              lineHeight: 1.3,
              mb: 1,
              background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 24px rgba(201, 168, 76, 0.3))',
            }}
          >
            الْفُصْحَى
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {t.home.hero}
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            fontWeight={400}
            sx={{ mb: 4, maxWidth: 480, mx: 'auto', fontSize: { xs: '1rem', sm: '1.15rem' } }}
          >
            {t.home.heroSub}
          </Typography>

          <Stack direction="row" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => void navigate({ to: '/reading' })}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 0 24px rgba(201, 168, 76, 0.4)',
                '&:hover': {
                  boxShadow: '0 0 36px rgba(201, 168, 76, 0.6)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              {t.home.startLearning}
            </Button>

            {stats.total > 0 && (
              <Button
                variant="outlined"
                size="large"
                endIcon={<InsightsIcon />}
                onClick={() => void navigate({ to: '/progress' })}
                sx={{ px: 3, py: 1.5, fontSize: '1rem', borderRadius: 3 }}
              >
                {t.home.welcomeBack}
              </Button>
            )}
          </Stack>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          style={{ position: 'absolute', bottom: 24, left: '50%', x: '-50%' }}
          animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.5 }}>
            ↓
          </Typography>
        </motion.div>
      </Box>

      {/* ── Returning user bar (continue reading + daily goal) ───────── */}
      {stats.total > 0 && (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ py: 1.5 }}
              >
                {/* Continue reading */}
                {lastRead ? (
                  <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                    <MenuBookIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {t.home.continueReading}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ textTransform: 'capitalize' }}>
                      {t.categories[lastRead.category as keyof typeof t.categories] ?? lastRead.category}
                    </Typography>
                    <Chip label={lastRead.level} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      onClick={() => void navigate({ to: lastRead.path })}
                      sx={{ fontWeight: 700, fontSize: '0.8rem', minWidth: 0, flexShrink: 0 }}
                    >
                      {t.reader.next}
                    </Button>
                  </Stack>
                ) : (
                  <Box />
                )}

                {/* Daily goal ring */}
                <GoalRing
                  done={todayCount}
                  goal={dailyGoal}
                  onCycleGoal={cycleGoal}
                  label={t.home.dailyGoal}
                  reachedLabel={t.home.goalReached}
                />
              </Stack>
            </motion.div>
          </Container>
        </Box>
      )}

      {/* ── Word of the Day ───────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
              {t.home.wordOfDay}
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: { xs: 2.5, sm: 3 },
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, rgba(201, 168, 76, 0.05) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Amiri", serif',
                  fontSize: { xs: '2.5rem', sm: '3.5rem' },
                  fontWeight: 700,
                  color: 'primary.main',
                  direction: 'rtl',
                  lineHeight: 1.2,
                  minWidth: 120,
                  textAlign: 'center',
                  filter: 'drop-shadow(0 0 12px rgba(201, 168, 76, 0.25))',
                }}
              >
                {word.arabic}
              </Typography>
              <Box>
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                  <Chip
                    label={`${t.home.wordRoot}: ${word.root}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.7rem', fontFamily: '"Amiri", serif', direction: 'rtl' }}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {lang === 'bs' ? word.bs : word.en}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* ── Sections ──────────────────────────────────────────────────── */}
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" fontWeight={700} mb={3}>
            {t.home.exploreSection}
          </Typography>
        </motion.div>

        <Grid container spacing={2}>
          {SECTIONS.map((section, idx) => {
            const sec = t.home.sections[section.key]
            return (
              <Grid key={section.key} size={{ xs: 12, sm: 6, md: 4 }} component="div">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 6px 24px rgba(201, 168, 76, 0.12)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => void navigate({ to: section.path })}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        alignItems: 'flex-start',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
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
                          mb: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        {section.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                        {sec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {sec.desc}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}
