import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import BoltIcon from '@mui/icons-material/Bolt'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useGrammarProgress } from '@/hooks/useGrammarProgress'
import { useI18n } from '@/i18n'
import type {
  GrammarLesson,
  GrammarSection,
  GrammarQuizQuestion,
  WordRole,
  AnnotatedWord,
  GrammarExample,
} from '@/types/grammar'

// ── Role colour map ────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<WordRole, { bg: string; color: string }> = {
  fail:         { bg: '#1565C0', color: '#fff' },
  mubtada:      { bg: '#1565C0', color: '#fff' },
  fil:          { bg: '#2E7D32', color: '#fff' },
  mafool:       { bg: '#BF360C', color: '#fff' },
  khabar:       { bg: '#E65100', color: '#fff' },
  mudaf:        { bg: '#6A1B9A', color: '#fff' },
  'mudaf-ilayh':{ bg: '#4A148C', color: '#fff' },
  harf:         { bg: '#546E7A', color: '#fff' },
  nat:          { bg: '#00695C', color: '#fff' },
  hal:          { bg: '#01579B', color: '#fff' },
  neutral:      { bg: 'transparent', color: 'inherit' },
}

// ── Annotated word chip ───────────────────────────────────────────────────────

function WordChip({ word, role, label }: AnnotatedWord) {
  const style = ROLE_STYLE[role ?? 'neutral']
  const hasRole = role && role !== 'neutral'
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.3,
        px: hasRole ? 1 : 0.5,
        py: hasRole ? 0.5 : 0,
        borderRadius: 1.5,
        bgcolor: style.bg,
        color: style.color,
        minWidth: 40,
      }}
    >
      <Typography
        dir="rtl"
        sx={{ fontFamily: 'Amiri, serif', fontSize: '1.35rem', lineHeight: 1.5, fontWeight: 600 }}
      >
        {word}
      </Typography>
      {hasRole && label && (
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '0.65rem', lineHeight: 1, opacity: 0.9 }}
        >
          {label}
        </Typography>
      )}
    </Box>
  )
}

// ── Annotated example display ─────────────────────────────────────────────────

function AnnotatedLine({ annotated }: { annotated: AnnotatedWord[] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        direction: 'rtl',
        justifyContent: 'center',
        py: 1,
      }}
    >
      {annotated.map((w, i) => (
        <WordChip key={i} {...w} />
      ))}
    </Box>
  )
}

// ── Example card ──────────────────────────────────────────────────────────────

function ExampleCard({ example }: { example: GrammarExample }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
      }}
    >
      {example.annotated ? (
        <AnnotatedLine annotated={example.annotated} />
      ) : (
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.5rem', lineHeight: 1.9, textAlign: 'center' }}
        >
          {example.arabic}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.75}>
        {example.bs}
      </Typography>
      {example.note && (
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={0.5} sx={{ fontStyle: 'italic' }}>
          {example.note}
        </Typography>
      )}
    </Box>
  )
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderSection(section: GrammarSection, t: ReturnType<typeof useI18n>['t'], idx: number) {
  switch (section.type) {
    case 'intro':
      return (
        <Typography key={idx} variant="body1" color="text.primary" sx={{ lineHeight: 1.8 }}>
          {section.content}
        </Typography>
      )

    case 'terms':
      return (
        <Box key={idx}>
          <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
            {t.grammar.keyTerms}
          </Typography>
          <Stack gap={0}>
            {section.items.map((term, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                  flexWrap: 'wrap',
                }}
              >
                {/* Arabic term */}
                <Box sx={{ minWidth: 160, textAlign: 'right' }}>
                  <Typography
                    dir="rtl"
                    sx={{ fontFamily: 'Amiri, serif', fontSize: '1.3rem', lineHeight: 1.5, color: 'primary.main', fontWeight: 700 }}
                  >
                    {term.arabic}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    {term.roman}
                  </Typography>
                </Box>
                {/* Meaning */}
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={700}>
                    {term.bs}
                  </Typography>
                  {term.note && (
                    <Typography variant="caption" color="text.secondary">
                      {term.note}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )

    case 'rule':
      return (
        <Box
          key={idx}
          sx={{
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 2.5,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(201,168,76,0.08)' : 'rgba(138,105,20,0.06)',
          }}
        >
          <Typography variant="overline" color="primary" fontWeight={800} display="block" mb={1}>
            {section.titleAr ?? t.grammar.rule}
          </Typography>
          {section.formula && (
            <Typography
              dir="rtl"
              sx={{
                fontFamily: 'Amiri, serif',
                fontSize: '1.4rem',
                lineHeight: 1.8,
                textAlign: 'center',
                color: 'text.primary',
                mb: 1.5,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1.5,
              }}
            >
              {section.formula}
            </Typography>
          )}
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
            {section.content}
          </Typography>
        </Box>
      )

    case 'examples':
      return (
        <Box key={idx}>
          {section.title && (
            <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
              {section.title ?? t.grammar.examples}
            </Typography>
          )}
          <Stack gap={1.5}>
            {section.items.map((ex, i) => (
              <ExampleCard key={i} example={ex} />
            ))}
          </Stack>
        </Box>
      )

    case 'callout': {
      const variantStyle = {
        tip:     { border: 'info.main',    bg: 'rgba(33,150,243,0.08)',   icon: '💡', label: t.grammar.tip },
        warning: { border: 'warning.main', bg: 'rgba(255,152,0,0.08)',   icon: '⚠️', label: t.grammar.warning },
        compare: { border: 'secondary.main', bg: 'rgba(156,39,176,0.07)', icon: '↔️', label: t.grammar.compare },
        root:    { border: 'success.main', bg: 'rgba(76,175,80,0.08)',   icon: '🌳', label: t.grammar.rootNote },
      }[section.variant]

      return (
        <Box
          key={idx}
          sx={{
            border: '1px solid',
            borderColor: variantStyle.border,
            borderRadius: 2,
            p: 2,
            bgcolor: variantStyle.bg,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {variantStyle.icon} {section.title ?? variantStyle.label}
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.75 }}>
            {section.content}
          </Typography>
        </Box>
      )
    }

    case 'table':
      return (
        <Box key={idx} sx={{ overflowX: 'auto' }}>
          {(section.titleAr || section.titleBs) && (
            <Stack direction="row" gap={1.5} alignItems="baseline" mb={1.5}>
              {section.titleAr && (
                <Typography dir="rtl" sx={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem', color: 'primary.main', fontWeight: 700 }}>
                  {section.titleAr}
                </Typography>
              )}
              {section.titleBs && (
                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  {section.titleBs}
                </Typography>
              )}
            </Stack>
          )}
          <Box
            component="table"
            sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}
          >
            <Box component="thead">
              <Box component="tr">
                {section.headers.map((h, i) => (
                  <Box
                    key={i}
                    component="th"
                    sx={{
                      p: 1,
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontFamily: h.match(/[\u0600-\u06FF]/) ? 'Amiri, serif' : 'inherit',
                      fontSize: h.match(/[\u0600-\u06FF]/) ? '1.1rem' : '0.8rem',
                      color: 'primary.main',
                    }}
                    dir={h.match(/[\u0600-\u06FF]/) ? 'rtl' : undefined}
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {section.rows.map((row, ri) => (
                <Box
                  key={ri}
                  component="tr"
                  sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                >
                  {row.map((cell, ci) => (
                    <Box
                      key={ci}
                      component="td"
                      sx={{
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        fontFamily: cell.match(/[\u0600-\u06FF]/) ? 'Amiri, serif' : 'inherit',
                        fontSize: cell.match(/[\u0600-\u06FF]/) ? '1.15rem' : '0.875rem',
                        lineHeight: 1.6,
                      }}
                      dir={cell.match(/[\u0600-\u06FF]/) ? 'rtl' : undefined}
                    >
                      {cell}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )

    default:
      return null
  }
}

// ── Quiz option button ────────────────────────────────────────────────────────

type QuizOptionState = 'idle' | 'correct' | 'wrong' | 'reveal'

interface QuizOptionProps {
  label: string
  state: QuizOptionState
  onClick: () => void
  isArabic?: boolean
}

function QuizOption({ label, state, onClick, isArabic }: QuizOptionProps) {
  const styles: Record<QuizOptionState, { border: string; bg: string; color: string }> = {
    idle:   { border: 'divider',       bg: 'background.paper', color: 'text.primary' },
    correct:{ border: 'success.main',  bg: 'success.main',     color: 'success.contrastText' },
    wrong:  { border: 'error.main',    bg: 'error.light',      color: 'error.dark' },
    reveal: { border: 'success.main',  bg: 'success.light',    color: 'success.dark' },
  }
  const s = styles[state]
  return (
    <Box
      component="button"
      onClick={onClick}
      dir={isArabic ? 'rtl' : undefined}
      sx={{
        width: '100%',
        p: '10px 14px',
        border: '2px solid',
        borderColor: s.border,
        borderRadius: 2,
        bgcolor: s.bg,
        color: s.color,
        cursor: state === 'idle' ? 'pointer' : 'default',
        fontFamily: isArabic ? 'Amiri, serif' : 'inherit',
        fontSize: isArabic ? '1.25rem' : '0.95rem',
        fontWeight: 600,
        lineHeight: isArabic ? 1.7 : 1.4,
        textAlign: isArabic ? 'right' : 'left',
        transition: 'all 0.15s',
        '&:hover': state === 'idle' ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
      }}
    >
      {label}
    </Box>
  )
}

// ── Quiz renderers ────────────────────────────────────────────────────────────

interface QuizQuestionProps {
  question: GrammarQuizQuestion
  onAnswer: (correct: boolean) => void
  answered: boolean
  selectedIdx: number | null
  setSelectedIdx: (i: number) => void
  t: ReturnType<typeof useI18n>['t']
}

function QuizQuestionRenderer({ question, onAnswer, answered, selectedIdx, setSelectedIdx, t }: QuizQuestionProps) {
  const pick = (i: number, correct: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === correct)
  }

  const optStateAfter = (i: number, correct: number): QuizOptionState => {
    if (!answered) return selectedIdx === i ? 'idle' : 'idle'
    if (i === correct) return 'correct'
    if (selectedIdx === i) return 'wrong'
    return 'idle'
  }

  switch (question.type) {
    case 'classify':
    case 'choose': {
      const correct = question.correctIndex
      const isArabic = (opt: string) => /[\u0600-\u06FF]/.test(opt)
      return (
        <Stack gap={3}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {question.type === 'classify' ? t.grammar.classify : ''}
          </Typography>
          {question.arabic && (
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
              <Typography dir="rtl" sx={{ fontFamily: 'Amiri, serif', fontSize: '1.5rem', lineHeight: 1.9 }}>
                {question.arabic}
              </Typography>
            </Box>
          )}
          <Typography variant="body1" fontWeight={600}>{question.question}</Typography>
          <Stack gap={1}>
            {question.options.map((opt, i) => (
              <QuizOption
                key={i}
                label={opt}
                isArabic={isArabic(opt)}
                state={optStateAfter(i, correct)}
                onClick={() => pick(i, correct)}
              />
            ))}
          </Stack>
          {answered && (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{question.explanation}</Typography>
            </Box>
          )}
        </Stack>
      )
    }

    case 'true-false': {
      const correctIndex = question.correct ? 0 : 1
      const btnLabels = ['✓ Tačno', '✗ Netačno']
      return (
        <Stack gap={3}>
          {question.arabic && (
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
              <Typography dir="rtl" sx={{ fontFamily: 'Amiri, serif', fontSize: '1.5rem', lineHeight: 1.9 }}>
                {question.arabic}
              </Typography>
            </Box>
          )}
          <Typography variant="body1" fontWeight={600}>{question.statement}</Typography>
          <Stack direction="row" gap={1.5}>
            {[0, 1].map(i => (
              <Box
                key={i}
                component="button"
                onClick={() => { if (!answered) { setSelectedIdx(i); onAnswer(i === correctIndex) } }}
                sx={{
                  flex: 1,
                  py: 1.75,
                  border: '2px solid',
                  borderRadius: 2,
                  borderColor: !answered ? 'divider' : i === correctIndex ? 'success.main' : selectedIdx === i ? 'error.main' : 'divider',
                  bgcolor: !answered ? 'background.paper' : i === correctIndex ? 'success.main' : selectedIdx === i ? 'error.light' : 'background.paper',
                  color: !answered ? 'text.primary' : i === correctIndex ? 'success.contrastText' : selectedIdx === i ? 'error.dark' : 'text.disabled',
                  cursor: answered ? 'default' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  transition: 'all 0.15s',
                }}
              >
                {btnLabels[i]}
              </Box>
            ))}
          </Stack>
          {answered && (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{question.explanation}</Typography>
            </Box>
          )}
        </Stack>
      )
    }

    case 'identify-role': {
      return (
        <Stack gap={3}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t.grammar.identify}
          </Typography>
          <Typography variant="body1" fontWeight={600}>{question.question}</Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              direction: 'rtl',
              justifyContent: 'center',
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
            }}
          >
            {question.words.map((word, i) => {
              let bg = 'background.paper'
              let color = 'text.primary'
              let border = 'divider'
              if (answered) {
                if (i === question.correctIndex) { bg = 'success.main'; color = 'success.contrastText'; border = 'success.main' }
                else if (selectedIdx === i) { bg = 'error.light'; color = 'error.dark'; border = 'error.main' }
              } else if (selectedIdx === i) {
                border = 'primary.main'
              }
              return (
                <Box
                  key={i}
                  component="button"
                  onClick={() => { if (!answered) { setSelectedIdx(i); onAnswer(i === question.correctIndex) } }}
                  sx={{
                    px: 1.5, py: 0.75,
                    border: '2px solid',
                    borderColor: border,
                    borderRadius: 1.5,
                    bgcolor: bg,
                    color,
                    cursor: answered ? 'default' : 'pointer',
                    fontFamily: 'Amiri, serif',
                    fontSize: '1.3rem',
                    lineHeight: 1.6,
                    transition: 'all 0.15s',
                    '&:hover': !answered ? { borderColor: 'primary.main' } : {},
                  }}
                >
                  {word}
                </Box>
              )
            })}
          </Box>
          {answered && (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{question.explanation}</Typography>
            </Box>
          )}
        </Stack>
      )
    }

    default:
      return null
  }
}

// ── Done screen ───────────────────────────────────────────────────────────────

function DoneScreen({
  correct, total, xp, onRetry, onBack, t,
}: {
  correct: number; total: number; xp: number
  onRetry: () => void; onBack: () => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const pct = total > 0 ? correct / total : 0
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1
  const msg = pct === 1 ? t.grammar.quizDone.perfect : pct >= 0.9 ? t.grammar.quizDone.great : pct >= 0.7 ? t.grammar.quizDone.good : t.grammar.quizDone.keep

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
      <Box sx={{ maxWidth: 440, mx: 'auto', mt: { xs: 4, sm: 8 }, p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Stack direction="row" justifyContent="center" gap={1} mb={2}>
          {[0, 1, 2].map(i => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 300, damping: 15 }}>
              {i < stars
                ? <StarIcon sx={{ fontSize: 44, color: 'warning.main' }} />
                : <StarBorderIcon sx={{ fontSize: 44, color: 'text.disabled' }} />}
            </motion.div>
          ))}
        </Stack>
        <Typography variant="h5" fontWeight={700} mb={0.5}>{msg}</Typography>
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
          <Typography variant="h3" fontWeight={800} color="primary">{correct}/{total}</Typography>
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 2, py: 0.75, borderRadius: 2, bgcolor: 'warning.main', color: 'warning.contrastText', mb: 3 }}>
          <BoltIcon sx={{ fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={800}>+{xp} {t.grammar.totalXp}</Typography>
        </Box>
        <Stack direction="row" gap={2} justifyContent="center">
          <Button variant="outlined" onClick={onRetry}>{t.grammar.tryAgain}</Button>
          <Button variant="contained" onClick={onBack}>{t.grammar.finish}</Button>
        </Stack>
      </Box>
    </motion.div>
  )
}

// ── GrammarLessonPage ─────────────────────────────────────────────────────────

interface GrammarLessonPageProps {
  lessonId: string
}

type Phase = 'content' | 'quiz' | 'done'

export function GrammarLessonPage({ lessonId }: GrammarLessonPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { saveResult } = useGrammarProgress()

  const [lesson, setLesson] = useState<GrammarLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Phase state
  const [phase, setPhase] = useState<Phase>('content')
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [sessionXp, setSessionXp] = useState(0)
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    void fetch(`/data/grammar/lessons/${lessonId}.json`)
      .then(async r => { if (!r.ok) throw new Error(); return r.json() as Promise<GrammarLesson> })
      .then(data => { setLesson(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [lessonId])

  const handleAnswer = useCallback((correct: boolean) => {
    if (answered) return
    setAnswered(true)
    const xpGained = correct ? 10 : 0
    if (xpGained > 0) {
      setSessionXp(x => x + xpGained)
      setXpPop({ id: Date.now(), amount: xpGained })
      setTimeout(() => setXpPop(null), 900)
    }
    setResults(r => [...r, correct])
  }, [answered])

  const handleNext = useCallback(() => {
    if (!lesson) return
    const next = current + 1
    if (next >= lesson.quiz.length) {
      const finalCorrect = results.filter(Boolean).length
      const pct = finalCorrect / lesson.quiz.length
      const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1
      const bonus = stars === 3 ? 50 : stars === 2 ? 25 : 0
      const finalXp = sessionXp + bonus
      setSessionXp(finalXp)
      saveResult(lessonId, stars, finalXp)
      setPhase('done')
    } else {
      setCurrent(next)
      setAnswered(false)
      setSelectedIdx(null)
    }
  }, [current, lesson, results, sessionXp, saveResult, lessonId, answered])

  const resetQuiz = useCallback(() => {
    setCurrent(0)
    setResults([])
    setSessionXp(0)
    setAnswered(false)
    setSelectedIdx(null)
    setPhase('quiz')
  }, [])

  const goBack = useCallback(() => void navigate({ to: '/grammar' }), [navigate])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Skeleton variant="rounded" height={8} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Stack gap={2}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />)}
        </Stack>
      </Container>
    )
  }

  if (error || !lesson) {
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: 'center' }}>
        <Typography color="error" mb={2}>{t.common.error}</Typography>
        <Button variant="outlined" onClick={goBack}>{t.grammar.backToGrammar}</Button>
      </Container>
    )
  }

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
        <DoneScreen
          correct={results.filter(Boolean).length}
          total={results.length}
          xp={sessionXp}
          onRetry={resetQuiz}
          onBack={goBack}
          t={t}
        />
      </Container>
    )
  }

  // ── Quiz phase ───────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = lesson.quiz[current]
    const progressPct = (current / lesson.quiz.length) * 100
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Top bar */}
        <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
          <IconButton size="small" onClick={goBack} sx={{ color: 'text.disabled' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box flex={1}>
            <LinearProgress variant="determinate" value={progressPct} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Box position="relative">
            <AnimatePresence>
              {xpPop && (
                <motion.div
                  key={xpPop.id}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -28 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{ position: 'absolute', top: -8, right: 0, pointerEvents: 'none', whiteSpace: 'nowrap', color: '#C9A84C', fontWeight: 800, fontSize: 14 }}
                >
                  +{xpPop.amount} XP
                </motion.div>
              )}
            </AnimatePresence>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {current + 1}/{lesson.quiz.length}
            </Typography>
          </Box>
        </Stack>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', mb: 2 }}>
              <QuizQuestionRenderer
                question={q}
                onAnswer={handleAnswer}
                answered={answered}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
                t={t}
              />
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Feedback + next */}
        {answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700} color={results[results.length - 1] ? 'success.main' : 'error.main'}>
                {results[results.length - 1] ? t.grammar.correct : t.grammar.wrong}
              </Typography>
              <Button variant="contained" onClick={handleNext}>
                {current + 1 === lesson.quiz.length ? t.grammar.finish : t.grammar.next}
              </Button>
            </Stack>
          </motion.div>
        )}
      </Container>
    )
  }

  // ── Content phase ────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        size="small"
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        {t.grammar.backToGrammar}
      </Button>

      {/* Lesson header */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: 3,
          mb: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" gap={1} mb={1.5}>
          <Chip label={lesson.level} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
          <Chip
            label={lesson.track === 'nahw' ? t.grammar.tracks.nahw : t.grammar.tracks.sarf}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Stack>
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: { xs: '1.8rem', sm: '2.3rem' }, lineHeight: 1.5, color: 'primary.main', fontWeight: 700, display: 'block', mb: 0.5 }}
        >
          {lesson.titleAr}
        </Typography>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {lesson.titleBs}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {lesson.summary}
        </Typography>
        <Stack direction="row" gap={2} mt={1.5}>
          <Typography variant="caption" color="text.disabled">⏱ {lesson.estimatedMinutes} {t.grammar.minutes}</Typography>
          <Typography variant="caption" color="text.disabled">❓ {lesson.quiz.length} pitanja</Typography>
        </Stack>
      </Box>

      {/* Sections */}
      <Stack gap={4}>
        {lesson.sections.map((section, idx) => renderSection(section, t, idx))}
      </Stack>

      {/* Take quiz CTA */}
      <Box
        sx={{
          mt: 6,
          p: 3,
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 3,
          textAlign: 'center',
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(201,168,76,0.06)' : 'rgba(138,105,20,0.04)',
        }}
      >
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.5rem', color: 'primary.main', fontWeight: 700, mb: 0.5 }}
        >
          {t.grammar.quizTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {t.grammar.quizSubtitle} — {lesson.quiz.length} pitanja
        </Typography>
        <Button variant="contained" size="large" onClick={() => { setPhase('quiz'); setCurrent(0); setResults([]); setAnswered(false); setSelectedIdx(null); setSessionXp(0) }} sx={{ fontWeight: 700, px: 4 }}>
          {t.grammar.takeQuiz}
        </Button>
      </Box>
    </Container>
  )
}
