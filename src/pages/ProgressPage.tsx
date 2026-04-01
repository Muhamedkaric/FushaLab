import {
  Box,
  Typography,
  Container,
  Stack,
  Chip,
  Button,
  LinearProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import TranslateIcon from '@mui/icons-material/Translate'
import BoltIcon from '@mui/icons-material/Bolt'
import LockIcon from '@mui/icons-material/Lock'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { useVocabProgress } from '@/hooks/useVocabProgress'
import { useExerciseProgress } from '@/hooks/useExerciseProgress'
import { useI18n } from '@/i18n'
import { useTheme } from '@mui/material/styles'

// ── Rank system ───────────────────────────────────────────────────────────────

const RANKS = [
  { min: 0,    ar: 'طَالِبٌ',   bs: 'Učenik',     en: 'Student',  color: '#6366f1' },
  { min: 100,  ar: 'قَارِئٌ',   bs: 'Čitalac',    en: 'Reader',   color: '#0ea5e9' },
  { min: 300,  ar: 'عَارِفٌ',   bs: 'Poznavalac', en: 'Knower',   color: '#10b981' },
  { min: 600,  ar: 'عَالِمٌ',   bs: 'Učenjak',    en: 'Scholar',  color: '#f59e0b' },
  { min: 1200, ar: 'حَكِيمٌ',   bs: 'Mudrac',     en: 'Wise',     color: '#ef4444' },
  { min: 2500, ar: 'أُسْتَاذٌ', bs: 'Majstor',    en: 'Master',   color: '#8b5cf6' },
]

function getRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) {
      return { rank: RANKS[i], next: RANKS[i + 1] ?? null, rankIndex: i }
    }
  }
  return { rank: RANKS[0], next: RANKS[1], rankIndex: 0 }
}

// ── Achievement definitions ───────────────────────────────────────────────────

const A1_IDS = ['a1-greetings', 'a1-objects', 'a1-family', 'a1-adjectives']
const A2_IDS = ['a2-verbs', 'a2-food', 'a2-places', 'a2-daily']
const B1_IDS = ['b1-work', 'b1-health', 'b1-travel', 'b1-society']
const B2_IDS = ['b2-formal', 'b2-business', 'b2-roots', 'b2-academic']

interface AchievementStats {
  readingTotal: number
  readingEasy: number
  vocabTotal: number
  exercisesXp: number
  packsCompleted: number
  maxStars: number
  a1Done: number
  a2Done: number
  b1Done: number
  b2Done: number
}

const ACHIEVEMENTS = [
  { id: 'first-text',   emoji: '📄', bs: 'Prve stranice',       en: 'First Pages',      desc: 'Pročitaj prvi tekst',              check: (s: AchievementStats) => s.readingTotal >= 1  },
  { id: 'reader-10',    emoji: '📚', bs: 'Čitalac',              en: 'Bookworm',         desc: 'Pročitaj 10 tekstova',             check: (s: AchievementStats) => s.readingTotal >= 10 },
  { id: 'reader-25',    emoji: '📖', bs: 'Strastveni čitalac',   en: 'Avid Reader',      desc: 'Pročitaj 25 tekstova',             check: (s: AchievementStats) => s.readingTotal >= 25 },
  { id: 'first-word',   emoji: '🌱', bs: 'Prve riječi',          en: 'First Words',      desc: 'Nauči prvu arapsku riječ',         check: (s: AchievementStats) => s.vocabTotal >= 1    },
  { id: 'vocab-50',     emoji: '📝', bs: '50 Riječi',            en: '50 Words',         desc: 'Nauči 50 arapskih riječi',         check: (s: AchievementStats) => s.vocabTotal >= 50   },
  { id: 'vocab-200',    emoji: '🌿', bs: '200 Riječi',           en: '200 Words',        desc: 'Nauči 200 arapskih riječi',        check: (s: AchievementStats) => s.vocabTotal >= 200  },
  { id: 'vocab-500',    emoji: '🌳', bs: '500 Riječi',           en: '500 Words',        desc: 'Nauči 500 arapskih riječi',        check: (s: AchievementStats) => s.vocabTotal >= 500  },
  { id: 'first-ex',     emoji: '⚡', bs: 'Vježbač',              en: 'Exerciser',        desc: 'Završi svoju prvu vježbu',         check: (s: AchievementStats) => s.packsCompleted >= 1},
  { id: 'xp-100',       emoji: '✨', bs: '100 XP',               en: '100 XP',           desc: 'Osvoji 100 XP u vježbama',         check: (s: AchievementStats) => s.exercisesXp >= 100 },
  { id: 'xp-500',       emoji: '⭐', bs: 'Istraživač',           en: 'Explorer',         desc: 'Osvoji 500 XP u vježbama',         check: (s: AchievementStats) => s.exercisesXp >= 500 },
  { id: 'perfect',      emoji: '🏆', bs: 'Savršen rezultat',     en: 'Perfect Score',    desc: 'Osvoji 3 zvjezdice u paketu',      check: (s: AchievementStats) => s.maxStars >= 3      },
  { id: 'a1-done',      emoji: '🥉', bs: 'A1 Završen',           en: 'A1 Complete',      desc: 'Završi sve A1 pakete vježbi',      check: (s: AchievementStats) => s.a1Done >= 4        },
  { id: 'a2-done',      emoji: '🥈', bs: 'A2 Završen',           en: 'A2 Complete',      desc: 'Završi sve A2 pakete vježbi',      check: (s: AchievementStats) => s.a2Done >= 4        },
  { id: 'b1-done',      emoji: '🥇', bs: 'B1 Završen',           en: 'B1 Complete',      desc: 'Završi sve B1 pakete vježbi',      check: (s: AchievementStats) => s.b1Done >= 4        },
  { id: 'b2-done',      emoji: '💎', bs: 'B2 Završen',           en: 'B2 Majstor',       desc: 'Završi sve B2 pakete vježbi',      check: (s: AchievementStats) => s.b2Done >= 4        },
]

// ── Motivational quotes ───────────────────────────────────────────────────────

const QUOTES = [
  { ar: 'اطْلُبُوا الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ', bs: 'Tražite znanje od kolijevke do groba' },
  { ar: 'الْعِلْمُ نُورٌ وَالْجَهْلُ ظُلْمَةٌ', bs: 'Znanje je svjetlost, a neznanje je tama' },
  { ar: 'مَنْ طَلَبَ الْعُلَا سَهِرَ اللَّيَالِي', bs: 'Ko teži visinama, bdije noćima' },
  { ar: 'تَعَلَّمُوا الْعَرَبِيَّةَ فَإِنَّهَا لِسَانُ الْجَنَّةِ', bs: 'Učite arapski — to je jezik Dženneta' },
  { ar: 'خَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابٌ', bs: 'Najbolji pratilac u svako doba je knjiga' },
]

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0)
  const frameRef = useRef<number | null>(null)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - (1 - t) ** 3
      setVal(Math.round(ease * target))
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])
  return val
}

// ── Circular SVG gauge ────────────────────────────────────────────────────────

function CircleGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const size = 130
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circ * (1 - pct)
  const cx = size / 2

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(128,128,128,0.12)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" fontWeight={800}>{value}</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>/ {max}</Typography>
      </Box>
    </Box>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 700, display: 'block', mb: 1.5 }}>
      {label}
    </Typography>
  )
}

// ── ProgressPage ──────────────────────────────────────────────────────────────

export function ProgressPage() {
  const { t, lang } = useI18n()
  const theme = useTheme()
  const { stats: readingStats, reset: resetReading, progress } = useProgress()
  const { totalKnown } = useVocabProgress()
  const { totalXp, packs: exercisePacks, resetAll: resetExercises } = useExerciseProgress()

  const [confirmOpen, setConfirmOpen] = useState(false)

  // Rank
  const { rank, next, rankIndex } = getRank(totalXp)
  const xpInLevel = totalXp - rank.min
  const xpToLevel = next ? next.min - rank.min : rank.min
  const levelPct = next ? Math.min((xpInLevel / xpToLevel) * 100, 100) : 100

  // Exercise pack stats
  const packsArr = Object.entries(exercisePacks ?? {})
  const packsCompleted = packsArr.filter(([, p]) => p.stars > 0).length
  const totalStars = packsArr.reduce((s, [, p]) => s + p.stars, 0)
  const maxStars = packsArr.reduce((m, [, p]) => Math.max(m, p.stars), 0)
  const countDone = (ids: string[]) => ids.filter(id => (exercisePacks[id]?.stars ?? 0) > 0).length

  // Achievement stats
  const achStats: AchievementStats = {
    readingTotal: readingStats.total,
    readingEasy: readingStats.easy,
    vocabTotal: totalKnown,
    exercisesXp: totalXp,
    packsCompleted,
    maxStars,
    a1Done: countDone(A1_IDS),
    a2Done: countDone(A2_IDS),
    b1Done: countDone(B1_IDS),
    b2Done: countDone(B2_IDS),
  }

  // Activity heatmap from reading completedAt timestamps
  const dayActivity: Record<string, number> = {}
  Object.values(progress.completedAt ?? {}).forEach(ts => {
    const day = new Date(ts as number).toDateString()
    dayActivity[day] = (dayActivity[day] ?? 0) + 1
  })
  const today = new Date()
  const heatmap = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    return { label: d.toDateString(), count: dayActivity[d.toDateString()] ?? 0 }
  })
  const maxActivity = Math.max(1, ...heatmap.map(h => h.count))

  // Count-up values
  const animTexts = useCountUp(readingStats.total)
  const animWords = useCountUp(totalKnown)
  const animXp = useCountUp(totalXp)

  // Daily motivational quote (rotates by day)
  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length]

  const handleReset = useCallback(() => {
    resetReading()
    resetExercises()
    setConfirmOpen(false)
  }, [resetReading, resetExercises])

  const isDark = theme.palette.mode === 'dark'

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* ── Motivational quote ──────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: 3,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.4rem', lineHeight: 1.8, color: 'text.primary', mb: 0.5 }}
        >
          {quote.ar}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {quote.bs}
        </Typography>
      </Box>

      {/* ── Rank Hero ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      >
        <Box
          sx={{
            mb: 4,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: `linear-gradient(135deg, ${rank.color}22 0%, ${rank.color}08 100%)`,
            border: '1px solid',
            borderColor: `${rank.color}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorative Arabic */}
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: { xs: '5rem', sm: '7rem' },
              color: rank.color,
              opacity: 0.06,
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {rank.ar}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={3}>
            <Box>
              <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
                <Chip
                  label={`Level ${rankIndex + 1}`}
                  size="small"
                  sx={{ bgcolor: rank.color, color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t.progress.rank}
                </Typography>
              </Stack>
              <Typography
                dir="rtl"
                sx={{
                  fontFamily: 'Amiri, serif',
                  fontSize: { xs: '3rem', sm: '3.5rem' },
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: rank.color,
                  display: 'block',
                  mb: 0.25,
                }}
              >
                {rank.ar}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {lang === 'bs' ? rank.bs : rank.en}
              </Typography>
            </Box>

            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" mb={0.75}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {animXp} XP
                </Typography>
                {next && (
                  <Typography variant="caption" color="text.disabled">
                    {next.min} XP → {lang === 'bs' ? next.bs : next.en}
                  </Typography>
                )}
              </Stack>
              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={levelPct}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: `${rank.color}22`,
                    '& .MuiLinearProgress-bar': { bgcolor: rank.color, borderRadius: 5 },
                  }}
                />
              </Box>
              {next && (
                <Typography variant="caption" color="text.disabled" display="block" mt={0.5} textAlign="right">
                  {next.min - totalXp} {t.progress.xpToNext}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </motion.div>

      {/* ── Stats Trinity ────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={4}>
        {[
          { icon: <MenuBookIcon />, value: animTexts, label: t.progress.textsRead, color: '#0ea5e9' },
          { icon: <TranslateIcon />, value: animWords, label: t.progress.wordsKnown, color: '#10b981' },
          { icon: <BoltIcon />, value: animXp, label: 'XP', color: '#f59e0b' },
        ].map(({ icon, value, label, color }, i) => (
          <Grid key={i} size={{ xs: 4 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            >
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2.5 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ color, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
                <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                  {label}
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* ── Activity Heatmap ─────────────────────────────────────────────────── */}
      <Box mb={4} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <SectionTitle label={t.progress.activity} />
          <Typography variant="caption" color="text.disabled">{t.progress.last35Days}</Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
          }}
        >
          {/* Day labels */}
          {(lang === 'bs' ? ['P','U','S','Č','P','S','N'] : ['M','T','W','T','F','S','S']).map((d, i) => (
            <Typography key={i} variant="caption" sx={{ textAlign: 'center', fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1, pb: 0.5 }}>
              {d}
            </Typography>
          ))}
          {heatmap.map((cell, i) => {
            const intensity = cell.count === 0 ? 0 : cell.count / maxActivity
            const alpha = cell.count === 0 ? 0.06 : 0.2 + intensity * 0.8
            return (
              <Tooltip key={i} title={cell.count > 0 ? `${cell.count} ${cell.count === 1 ? 'tekst' : 'tekstova'}` : ''} arrow>
                <Box
                  sx={{
                    height: { xs: 10, sm: 14 },
                    borderRadius: 0.5,
                    bgcolor: cell.count === 0 ? 'action.hover' : 'primary.main',
                    opacity: cell.count === 0 ? 1 : Math.max(0.15, alpha),
                    transition: 'opacity 0.2s',
                  }}
                />
              </Tooltip>
            )
          })}
        </Box>
      </Box>

      {/* ── Reading + Vocab + Exercises ──────────────────────────────────────── */}
      <Grid container spacing={2} mb={4}>
        {/* Reading breakdown */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', height: '100%' }}>
            <SectionTitle label={t.progress.readingSection} />
            {readingStats.total === 0 ? (
              <Typography variant="body2" color="text.disabled">{t.progress.noProgress}</Typography>
            ) : (
              <Stack gap={1.5}>
                {[
                  { label: t.progress.easy,   count: readingStats.easy,   color: '#10b981' },
                  { label: t.progress.medium, count: readingStats.medium, color: '#f59e0b' },
                  { label: t.progress.hard,   count: readingStats.hard,   color: '#ef4444' },
                ].map(({ label, count, color }) => (
                  <Box key={label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.4}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                      <Typography variant="caption" color="text.disabled">{count}</Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${readingStats.total > 0 ? (count / readingStats.total) * 100 : 0}%`,
                          bgcolor: color,
                          borderRadius: 4,
                          transition: 'width 1s ease-out',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
                <Typography variant="caption" color="text.disabled" mt={0.5}>
                  {readingStats.total} {t.progress.textsRead}
                </Typography>
              </Stack>
            )}
          </Box>
        </Grid>

        {/* Vocabulary gauge */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', height: '100%' }}>
            <SectionTitle label={t.progress.vocabSection} />
            {totalKnown === 0 ? (
              <Typography variant="body2" color="text.disabled">{t.progress.noProgress}</Typography>
            ) : (
              <Stack direction="row" alignItems="center" gap={3}>
                <CircleGauge value={totalKnown} max={1403} color={theme.palette.primary.main} />
                <Box>
                  <Typography variant="h5" fontWeight={800} color="primary">{totalKnown}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.progress.wordsKnown}</Typography>
                  <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                    {t.progress.outOf} 1403 {lang === 'bs' ? 'mogućih' : 'possible'}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1.5, px: 1, py: 0.5, borderRadius: 1,
                      bgcolor: totalKnown >= 500 ? 'success.light' : totalKnown >= 200 ? 'warning.light' : 'action.hover',
                      display: 'inline-block',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} sx={{ color: totalKnown >= 500 ? 'success.dark' : totalKnown >= 200 ? 'warning.dark' : 'text.secondary' }}>
                      {totalKnown >= 500 ? '🌳 ' : totalKnown >= 200 ? '🌿 ' : '🌱 '}
                      {totalKnown >= 500 ? (lang === 'bs' ? 'Ekspert' : 'Expert') : totalKnown >= 200 ? (lang === 'bs' ? 'Napredni' : 'Advanced') : (lang === 'bs' ? 'Početnik' : 'Beginner')}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>
        </Grid>

        {/* Exercise breakdown */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <SectionTitle label={t.progress.exerciseSection} />
              <Stack direction="row" gap={2}>
                <Typography variant="caption" color="text.secondary">
                  {packsCompleted}/16 {t.progress.packsDone}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ★ {totalStars}/48 {t.progress.starsCollected}
                </Typography>
              </Stack>
            </Stack>
            {packsCompleted === 0 ? (
              <Typography variant="body2" color="text.disabled">{t.progress.noProgress}</Typography>
            ) : (
              <Stack gap={1.25}>
                {[
                  { label: 'A1', ids: A1_IDS, color: '#10b981' },
                  { label: 'A2', ids: A2_IDS, color: '#0ea5e9' },
                  { label: 'B1', ids: B1_IDS, color: theme.palette.primary.main },
                  { label: 'B2', ids: B2_IDS, color: '#8b5cf6' },
                ].map(({ label, ids, color }) => {
                  const done = countDone(ids)
                  const stars = ids.reduce((s, id) => s + (exercisePacks[id]?.stars ?? 0), 0)
                  return (
                    <Stack key={label} direction="row" alignItems="center" gap={1.5}>
                      <Typography variant="caption" fontWeight={700} sx={{ width: 24, color, flexShrink: 0 }}>
                        {label}
                      </Typography>
                      <Box flex={1} sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${(done / 4) * 100}%`,
                            bgcolor: color,
                            borderRadius: 4,
                            transition: 'width 1s ease-out',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.disabled" sx={{ width: 40, textAlign: 'right', flexShrink: 0 }}>
                        {done}/4 {'★'.repeat(Math.round(stars / Math.max(done, 1)))}
                      </Typography>
                    </Stack>
                  )
                })}
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ── Achievements ─────────────────────────────────────────────────────── */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <SectionTitle label={t.progress.achievements} />
          <Typography variant="caption" color="text.secondary">
            {ACHIEVEMENTS.filter(a => a.check(achStats)).length}/{ACHIEVEMENTS.length}
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: 1.5,
          }}
        >
          {ACHIEVEMENTS.map((ach, i) => {
            const unlocked = ach.check(achStats)
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                }}
              >
                <Tooltip title={ach.desc} arrow>
                  <Box
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: unlocked ? 'primary.main' : 'divider',
                      borderRadius: 2.5,
                      textAlign: 'center',
                      bgcolor: unlocked ? 'primary.main' + '12' : 'background.paper',
                      filter: unlocked ? 'none' : 'grayscale(1)',
                      opacity: unlocked ? 1 : 0.5,
                      transition: 'all 0.2s',
                      cursor: 'default',
                      position: 'relative',
                    }}
                  >
                    {!unlocked && (
                      <LockIcon sx={{ position: 'absolute', top: 4, right: 4, fontSize: 11, color: 'text.disabled' }} />
                    )}
                    <Typography sx={{ fontSize: '1.8rem', lineHeight: 1.2, display: 'block', mb: 0.5 }}>
                      {ach.emoji}
                    </Typography>
                    <Typography variant="caption" fontWeight={unlocked ? 700 : 400} sx={{ fontSize: '0.6rem', lineHeight: 1.3, display: 'block', color: unlocked ? 'text.primary' : 'text.disabled' }}>
                      {lang === 'bs' ? ach.bs : ach.en}
                    </Typography>
                  </Box>
                </Tooltip>
              </motion.div>
            )
          })}
        </Box>
      </Box>

      {/* ── Reset ────────────────────────────────────────────────────────────── */}
      <Divider sx={{ mb: 3 }} />
      <Box textAlign="center">
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={() => setConfirmOpen(true)}
          sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
        >
          {t.progress.resetAll}
        </Button>
      </Box>

      {/* ── Reset confirm dialog ─────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.progress.resetAll}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">{t.progress.resetConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{lang === 'bs' ? 'Otkaži' : 'Cancel'}</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            {lang === 'bs' ? 'Resetuj' : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
