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
import CloseIcon from '@mui/icons-material/Close'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useExerciseProgress } from '@/hooks/useExerciseProgress'
import { useI18n } from '@/i18n'
import type {
  ExercisePack,
  Exercise,
  WordMeaningExercise,
  WordArabicExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  MatchPairsExercise,
  OddOneOutExercise,
  ListenSelectExercise,
  SentenceTranslateExercise,
  TrueFalseExercise,
} from '@/types/exercises'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function speakArabic(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

// ── Option button ─────────────────────────────────────────────────────────────

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'reveal'

interface OptionBtnProps {
  label: string
  state: OptionState
  onClick: () => void
  isArabic?: boolean
}

function OptionBtn({ label, state, onClick, isArabic }: OptionBtnProps) {
  const colors: Record<OptionState, { border: string; bg: string; color: string }> = {
    idle: { border: 'divider', bg: 'background.paper', color: 'text.primary' },
    selected: { border: 'primary.main', bg: 'primary.main', color: 'primary.contrastText' },
    correct: { border: 'success.main', bg: 'success.main', color: 'success.contrastText' },
    wrong: { border: 'error.main', bg: 'error.light', color: 'error.dark' },
    reveal: { border: 'success.main', bg: 'success.light', color: 'success.dark' },
  }
  const c = colors[state]
  return (
    <Box
      component="button"
      onClick={onClick}
      dir={isArabic ? 'rtl' : undefined}
      sx={{
        width: '100%',
        p: isArabic ? '10px 14px' : '10px 14px',
        border: '2px solid',
        borderColor: c.border,
        borderRadius: 2,
        bgcolor: c.bg,
        color: c.color,
        cursor: state === 'idle' ? 'pointer' : 'default',
        fontFamily: isArabic ? 'Amiri, serif' : 'inherit',
        fontSize: isArabic ? '1.35rem' : '0.95rem',
        fontWeight: 600,
        lineHeight: isArabic ? 1.6 : 1.4,
        textAlign: isArabic ? 'right' : 'left',
        transition: 'all 0.15s',
        '&:hover': state === 'idle' ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
      }}
    >
      {label}
    </Box>
  )
}

// ── Shared prompt label ───────────────────────────────────────────────────────

function PromptLabel({ text }: { text: string }) {
  return (
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {text}
    </Typography>
  )
}

// ── Exercise: WordMeaning ─────────────────────────────────────────────────────

interface RendererProps<T extends Exercise> {
  exercise: T
  onAnswer: (correct: boolean) => void
  answered: boolean
  selectedIdx: number | null
  setSelectedIdx: (i: number) => void
}

function WordMeaningCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<WordMeaningExercise>) {
  const { t } = useI18n()
  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.correctIndex)
  }
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.whatMeans} />
      <Box textAlign="center" py={2}>
        {exercise.root && (
          <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
            {exercise.root}
          </Typography>
        )}
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '3.5rem', lineHeight: 1.4, color: 'text.primary' }}
        >
          {exercise.arabic}
        </Typography>
      </Box>
      <Stack gap={1}>
        {exercise.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            state={
              !answered
                ? selectedIdx === i
                  ? 'selected'
                  : 'idle'
                : selectedIdx === i
                  ? i === exercise.correctIndex
                    ? 'correct'
                    : 'wrong'
                  : i === exercise.correctIndex
                    ? 'reveal'
                    : 'idle'
            }
            onClick={() => handleClick(i)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

// ── Exercise: WordArabic ──────────────────────────────────────────────────────

function WordArabicCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<WordArabicExercise>) {
  const { t } = useI18n()
  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.correctIndex)
  }
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.selectArabic} />
      <Box textAlign="center" py={2}>
        <Typography variant="h4" fontWeight={700}>
          {exercise.word}
        </Typography>
      </Box>
      <Stack gap={1}>
        {exercise.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            isArabic
            state={
              !answered
                ? selectedIdx === i
                  ? 'selected'
                  : 'idle'
                : selectedIdx === i
                  ? i === exercise.correctIndex
                    ? 'correct'
                    : 'wrong'
                  : i === exercise.correctIndex
                    ? 'reveal'
                    : 'idle'
            }
            onClick={() => handleClick(i)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

// ── Exercise: FillBlank ───────────────────────────────────────────────────────

function FillBlankCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<FillBlankExercise>) {
  const { t } = useI18n()
  const parts = exercise.sentence.split('___')
  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.correctIndex)
  }
  const isCorrect = selectedIdx === exercise.correctIndex
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.fillGap} />
      <Box
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" mb={1}>
          {exercise.sentenceBs}
        </Typography>
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.5rem', lineHeight: 1.8 }}
        >
          {parts[0]}
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              minWidth: 80,
              px: 1.5,
              py: 0.25,
              mx: 0.5,
              borderRadius: 1,
              border: '2px dashed',
              borderColor: !answered
                ? 'text.disabled'
                : isCorrect
                  ? 'success.main'
                  : 'error.main',
              bgcolor: !answered
                ? 'transparent'
                : isCorrect
                  ? 'success.light'
                  : 'error.light',
              color: !answered
                ? 'text.disabled'
                : isCorrect
                  ? 'success.dark'
                  : 'error.dark',
              transition: 'all 0.2s',
              fontFamily: 'Amiri, serif',
            }}
          >
            {answered && selectedIdx !== null ? exercise.options[selectedIdx] : '   '}
          </Box>
          {parts[1] ?? ''}
        </Typography>
        {answered && !isCorrect && (
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: '1.1rem',
              color: 'success.main',
              mt: 1,
              lineHeight: 1.8,
            }}
          >
            ✓ {parts[0]}{exercise.options[exercise.correctIndex]}{parts[1] ?? ''}
          </Typography>
        )}
      </Box>
      <Stack gap={1}>
        {exercise.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            isArabic
            state={
              !answered
                ? selectedIdx === i
                  ? 'selected'
                  : 'idle'
                : selectedIdx === i
                  ? i === exercise.correctIndex
                    ? 'correct'
                    : 'wrong'
                  : i === exercise.correctIndex
                    ? 'reveal'
                    : 'idle'
            }
            onClick={() => handleClick(i)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

// ── Exercise: OddOneOut ───────────────────────────────────────────────────────

function OddOneOutCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<OddOneOutExercise>) {
  const { t } = useI18n()
  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.oddIndex)
  }
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.oddOneOut} />
      <Stack gap={1.5}>
        {exercise.words.map((word, i) => {
          const isOdd = i === exercise.oddIndex
          const isSelected = selectedIdx === i
          let state: OptionState = 'idle'
          if (answered) {
            if (isOdd) state = 'correct'
            else if (isSelected) state = 'wrong'
          } else if (isSelected) {
            state = 'selected'
          }
          return (
            <Box
              key={i}
              component="button"
              onClick={() => handleClick(i)}
              sx={{
                width: '100%',
                p: 1.5,
                border: '2px solid',
                borderColor:
                  state === 'correct'
                    ? 'success.main'
                    : state === 'wrong'
                      ? 'error.main'
                      : state === 'selected'
                        ? 'primary.main'
                        : 'divider',
                borderRadius: 2,
                bgcolor:
                  state === 'correct'
                    ? 'success.main'
                    : state === 'wrong'
                      ? 'error.light'
                      : state === 'selected'
                        ? 'primary.main'
                        : 'background.paper',
                cursor: answered ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s',
                '&:hover': !answered ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color:
                    state === 'correct'
                      ? 'success.contrastText'
                      : state === 'selected'
                        ? 'primary.contrastText'
                        : 'text.secondary',
                }}
              >
                {exercise.translations[i]}
              </Typography>
              <Typography
                dir="rtl"
                sx={{
                  fontFamily: 'Amiri, serif',
                  fontSize: '1.4rem',
                  lineHeight: 1.5,
                  color:
                    state === 'correct'
                      ? 'success.contrastText'
                      : state === 'selected'
                        ? 'primary.contrastText'
                        : 'text.primary',
                }}
              >
                {word}
              </Typography>
            </Box>
          )
        })}
      </Stack>
      {answered && (
        <Box
          sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}
        >
          <Typography variant="body2" color="success.dark">
            {exercise.reason}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

// ── Exercise: ListenSelect ────────────────────────────────────────────────────

function ListenSelectCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<ListenSelectExercise>) {
  const { t } = useI18n()
  const [played, setPlayed] = useState(false)
  const handlePlay = () => {
    speakArabic(exercise.word)
    setPlayed(true)
  }
  const handleClick = (i: number) => {
    if (!played || answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.correctIndex)
  }
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.listenSelect} />
      <Box textAlign="center" py={2}>
        <motion.div
          animate={played ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <IconButton
            onClick={handlePlay}
            sx={{
              width: 80,
              height: 80,
              bgcolor: played ? 'primary.main' : 'action.hover',
              color: played ? 'primary.contrastText' : 'text.secondary',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <VolumeUpIcon sx={{ fontSize: 36 }} />
          </IconButton>
        </motion.div>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          {t.exercises.tapToListen}
        </Typography>
      </Box>
      <Stack gap={1}>
        {exercise.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            isArabic
            state={
              !played
                ? 'idle'
                : !answered
                  ? selectedIdx === i
                    ? 'selected'
                    : 'idle'
                  : selectedIdx === i
                    ? i === exercise.correctIndex
                      ? 'correct'
                      : 'wrong'
                    : i === exercise.correctIndex
                      ? 'reveal'
                      : 'idle'
            }
            onClick={() => handleClick(i)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

// ── Exercise: SentenceOrder ───────────────────────────────────────────────────

function SentenceOrderCard({
  exercise,
  onAnswer,
}: {
  exercise: SentenceOrderExercise
  onAnswer: (correct: boolean) => void
  answered: boolean
}) {
  const { t } = useI18n()
  // Each bank item has a stable unique ID so duplicate words are handled correctly
  const [bank] = useState<Array<{ word: string; id: number }>>(() =>
    shuffle(exercise.words.map((word, i) => ({ word, id: i })))
  )
  // placed = list of bank item IDs in the order the user placed them
  const [placedIds, setPlacedIds] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const usedIds = new Set(placedIds)
  const availableBank = bank.filter(item => !usedIds.has(item.id))
  const placedWords = placedIds.map(id => bank.find(item => item.id === id)!.word)

  const addWord = (id: number) => {
    if (checked) return
    setPlacedIds(prev => [...prev, id])
  }

  const removeWord = (placedIdx: number) => {
    if (checked) return
    setPlacedIds(prev => prev.filter((_, i) => i !== placedIdx))
  }

  const checkAnswer = () => {
    const correct = JSON.stringify(placedWords) === JSON.stringify(exercise.correct)
    setIsCorrect(correct)
    setChecked(true)
    onAnswer(correct)
  }

  return (
    <Stack gap={2.5}>
      <PromptLabel text={t.exercises.prompts.orderWords} />
      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {exercise.translation}
        </Typography>
      </Box>

      {/* Answer row */}
      <Box
        sx={{
          minHeight: 56,
          border: '2px dashed',
          borderColor: checked ? (isCorrect ? 'success.main' : 'error.main') : 'divider',
          borderRadius: 2,
          p: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          alignItems: 'center',
          direction: 'rtl',
          transition: 'border-color 0.2s',
        }}
      >
        {placedIds.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ mx: 'auto', direction: 'ltr' }}>
            —
          </Typography>
        )}
        {placedWords.map((word, i) => (
          <Chip
            key={i}
            label={word}
            onClick={() => removeWord(i)}
            onDelete={() => removeWord(i)}
            color={checked ? (isCorrect ? 'success' : 'error') : 'default'}
            sx={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem', lineHeight: 1.6, cursor: 'pointer', height: 'auto', py: 0.5 }}
          />
        ))}
      </Box>

      {/* Show correct sentence after wrong */}
      {checked && !isCorrect && (
        <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography
            dir="rtl"
            sx={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem', lineHeight: 1.7, color: 'success.dark' }}
          >
            ✓ {exercise.correct.join(' ')}
          </Typography>
        </Box>
      )}

      {/* Check button */}
      {!checked && (
        <Button
          variant="contained"
          fullWidth
          disabled={placedIds.length !== exercise.words.length}
          onClick={checkAnswer}
          sx={{ fontWeight: 700 }}
        >
          {t.exercises.check}
        </Button>
      )}

      {/* Word bank */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, direction: 'rtl', justifyContent: 'center' }}>
        {availableBank.map(item => (
          <Chip
            key={item.id}
            label={item.word}
            onClick={() => addWord(item.id)}
            variant="outlined"
            sx={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem', lineHeight: 1.6, height: 'auto', py: 0.5, cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Stack>
  )
}

// ── Exercise: MatchPairs ──────────────────────────────────────────────────────

function MatchPairsCard({
  exercise,
  onAnswer,
  answered,
}: {
  exercise: MatchPairsExercise
  onAnswer: (correct: boolean) => void
  answered: boolean
}) {
  const { t } = useI18n()
  const [rightOrder] = useState(() => shuffle([0, 1, 2, 3]))
  const [leftSel, setLeftSel] = useState<number | null>(null)
  const [rightSel, setRightSel] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrongFlash, setWrongFlash] = useState(false)
  const [hadMistake, setHadMistake] = useState(false)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (leftSel === null || rightSel === null || pendingRef.current) return
    const actualRight = rightOrder[rightSel]
    if (leftSel === actualRight) {
      const next = new Set(matched)
      next.add(leftSel)
      setMatched(next)
      setLeftSel(null)
      setRightSel(null)
      if (next.size === 4) {
        onAnswer(!hadMistake)
      }
    } else {
      setHadMistake(true)
      setWrongFlash(true)
      pendingRef.current = true
      setTimeout(() => {
        setWrongFlash(false)
        setLeftSel(null)
        setRightSel(null)
        pendingRef.current = false
      }, 500)
    }
  }, [leftSel, rightSel])

  const cardStyle = (isSelected: boolean, isMatched: boolean, isWrong: boolean) => ({
    p: 1.25,
    border: '2px solid',
    borderColor: isMatched
      ? 'success.main'
      : isWrong
        ? 'error.main'
        : isSelected
          ? 'primary.main'
          : 'divider',
    borderRadius: 2,
    bgcolor: isMatched
      ? 'success.light'
      : isWrong
        ? 'error.light'
        : isSelected
          ? 'primary.light'
          : 'background.paper',
    cursor: isMatched || answered ? 'default' : 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
    minHeight: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <Stack gap={2.5}>
      <PromptLabel text={t.exercises.prompts.matchPairs} />
      <Stack direction="row" gap={1.5}>
        {/* Left column: Arabic */}
        <Stack gap={1} flex={1}>
          {exercise.pairs.map((pair, i) => (
            <Box
              key={i}
              onClick={() => {
                if (matched.has(i) || answered || pendingRef.current) return
                setLeftSel(leftSel === i ? null : i)
              }}
              sx={cardStyle(leftSel === i, matched.has(i), wrongFlash && (leftSel === i || rightSel !== null && rightOrder[rightSel] === i))}
            >
              <Typography
                dir="rtl"
                sx={{
                  fontFamily: 'Amiri, serif',
                  fontSize: '1.3rem',
                  lineHeight: 1.5,
                  color: matched.has(i) ? 'success.dark' : 'text.primary',
                }}
              >
                {pair.arabic}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Right column: BS (shuffled) */}
        <Stack gap={1} flex={1}>
          {rightOrder.map((actualIdx, shuffledIdx) => (
            <Box
              key={shuffledIdx}
              onClick={() => {
                if (matched.has(actualIdx) || answered || pendingRef.current) return
                setRightSel(rightSel === shuffledIdx ? null : shuffledIdx)
              }}
              sx={cardStyle(
                rightSel === shuffledIdx,
                matched.has(actualIdx),
                wrongFlash && rightSel === shuffledIdx
              )}
            >
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ color: matched.has(actualIdx) ? 'success.dark' : 'text.primary' }}
              >
                {exercise.pairs[actualIdx].bs}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

// ── Exercise: SentenceTranslate ───────────────────────────────────────────────

function SentenceTranslateCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<SentenceTranslateExercise>) {
  const { t } = useI18n()
  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === exercise.correctIndex)
  }
  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.sentenceTranslate} />
      <Box
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 2,
          p: 2.5,
          textAlign: 'center',
        }}
      >
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.65rem', lineHeight: 1.9, color: 'text.primary' }}
        >
          {exercise.arabic}
        </Typography>
      </Box>
      <Stack gap={1}>
        {exercise.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            state={
              !answered
                ? selectedIdx === i
                  ? 'selected'
                  : 'idle'
                : selectedIdx === i
                  ? i === exercise.correctIndex
                    ? 'correct'
                    : 'wrong'
                  : i === exercise.correctIndex
                    ? 'reveal'
                    : 'idle'
            }
            onClick={() => handleClick(i)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

// ── Exercise: TrueFalse ───────────────────────────────────────────────────────

function TrueFalseCard({
  exercise,
  onAnswer,
  answered,
  selectedIdx,
  setSelectedIdx,
}: RendererProps<TrueFalseExercise>) {
  const { t } = useI18n()
  const correctIndex = exercise.correct ? 0 : 1

  const handleClick = (i: number) => {
    if (answered) return
    setSelectedIdx(i)
    onAnswer(i === correctIndex)
  }

  const btnState = (i: number): OptionState => {
    if (!answered) return selectedIdx === i ? 'selected' : 'idle'
    if (i === correctIndex) return 'correct'
    if (selectedIdx === i) return 'wrong'
    return 'idle'
  }

  const btnColors = (state: OptionState): { border: string; bg: string; color: string } => {
    const map: Record<OptionState, { border: string; bg: string; color: string }> = {
      idle: { border: 'divider', bg: 'background.paper', color: 'text.primary' },
      selected: { border: 'primary.main', bg: 'primary.main', color: 'primary.contrastText' },
      correct: { border: 'success.main', bg: 'success.main', color: 'success.contrastText' },
      wrong: { border: 'error.main', bg: 'error.light', color: 'error.dark' },
      reveal: { border: 'success.main', bg: 'success.light', color: 'success.dark' },
    }
    return map[state]
  }

  return (
    <Stack gap={3}>
      <PromptLabel text={t.exercises.prompts.trueFalse} />

      {/* Arabic sentence */}
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2.5, textAlign: 'center' }}>
        <Typography
          dir="rtl"
          sx={{ fontFamily: 'Amiri, serif', fontSize: '1.65rem', lineHeight: 1.9, color: 'text.primary' }}
        >
          {exercise.arabic}
        </Typography>
      </Box>

      {/* Statement to evaluate */}
      <Box sx={{ px: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t.exercises.prompts.trueFalse.split('?')[0]}
        </Typography>
        <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.5 }}>
          {exercise.statement}
        </Typography>
      </Box>

      {/* True / False buttons */}
      <Stack direction="row" gap={1.5}>
        {[t.exercises.trueFalseTrue, t.exercises.trueFalseFalse].map((label, i) => {
          const state = btnState(i)
          const c = btnColors(state)
          return (
            <Box
              key={i}
              component="button"
              onClick={() => handleClick(i)}
              sx={{
                flex: 1,
                py: 2,
                border: '2px solid',
                borderColor: c.border,
                borderRadius: 2,
                bgcolor: c.bg,
                color: c.color,
                cursor: answered ? 'default' : 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': state === 'idle' ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
              }}
            >
              {i === 0 ? '✓ ' : '✗ '}{label}
            </Box>
          )
        })}
      </Stack>

      {/* Explanation after answering */}
      {answered && (
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {exercise.explanation}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

// ── Exercise router ───────────────────────────────────────────────────────────

interface ExerciseRouterProps {
  exercise: Exercise
  onAnswer: (correct: boolean) => void
  answered: boolean
  selectedIdx: number | null
  setSelectedIdx: (i: number) => void
}

function ExerciseRouter({ exercise, onAnswer, answered, selectedIdx, setSelectedIdx }: ExerciseRouterProps) {
  const props = { exercise, onAnswer, answered, selectedIdx, setSelectedIdx }
  switch (exercise.type) {
    case 'word-meaning':
      return <WordMeaningCard {...props} exercise={exercise} />
    case 'word-arabic':
      return <WordArabicCard {...props} exercise={exercise} />
    case 'fill-blank':
      return <FillBlankCard {...props} exercise={exercise} />
    case 'odd-one-out':
      return <OddOneOutCard {...props} exercise={exercise} />
    case 'listen-select':
      return <ListenSelectCard {...props} exercise={exercise} />
    case 'sentence-order':
      return <SentenceOrderCard exercise={exercise} onAnswer={onAnswer} answered={answered} />
    case 'match-pairs':
      return <MatchPairsCard exercise={exercise} onAnswer={onAnswer} answered={answered} />
    case 'sentence-translate':
      return <SentenceTranslateCard {...props} exercise={exercise} />
    case 'true-false':
      return <TrueFalseCard {...props} exercise={exercise} />
  }
}

// ── Done screen ───────────────────────────────────────────────────────────────

interface DoneScreenProps {
  correctCount: number
  total: number
  xpEarned: number
  onRetry: () => void
  onBack: () => void
  t: ReturnType<typeof useI18n>['t']
}

function DoneScreen({ correctCount, total, xpEarned, onRetry, onBack, t }: DoneScreenProps) {
  const pct = total > 0 ? correctCount / total : 0
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1
  const message =
    pct === 1
      ? t.exercises.done.perfect
      : pct >= 0.9
        ? t.exercises.done.great
        : pct >= 0.7
          ? t.exercises.done.good
          : t.exercises.done.keep

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
    >
      <Box
        sx={{
          maxWidth: 440,
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
        {/* Stars */}
        <Stack direction="row" justifyContent="center" gap={1} mb={2}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2 + i * 0.15,
                type: 'spring',
                stiffness: 300,
                damping: 15,
              }}
            >
              {i < stars ? (
                <StarIcon sx={{ fontSize: 44, color: 'warning.main' }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
              )}
            </motion.div>
          ))}
        </Stack>

        <Typography variant="h4" fontWeight={700} mb={0.5}>
          {t.exercises.complete}
        </Typography>
        <Typography variant="h6" fontWeight={600} color="text.secondary" mb={2}>
          {message}
        </Typography>

        {/* Score */}
        <Box
          sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}
        >
          <Typography variant="h3" fontWeight={800} color="primary">
            {correctCount}/{total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            correct
          </Typography>
        </Box>

        {/* XP earned */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 2,
            py: 0.75,
            borderRadius: 2,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            mb: 3,
          }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            +{xpEarned} {t.exercises.totalXp}
          </Typography>
        </Box>

        <Stack direction="row" gap={2} justifyContent="center">
          <Button variant="outlined" onClick={onRetry} size="large">
            {t.exercises.tryAgain}
          </Button>
          <Button variant="contained" onClick={onBack} size="large">
            {t.exercises.finish}
          </Button>
        </Stack>
      </Box>
    </motion.div>
  )
}

// ── ExerciseSessionPage ───────────────────────────────────────────────────────

interface ExerciseSessionPageProps {
  packId: string
}

export function ExerciseSessionPage({ packId }: ExerciseSessionPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { saveResult } = useExerciseProgress()

  const [pack, setPack] = useState<ExercisePack | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // Session state
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [sessionXp, setSessionXp] = useState(0)
  const [combo, setCombo] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    void fetch(`/data/exercises/packs/${packId}.json`)
      .then(async r => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<ExercisePack>
      })
      .then(data => {
        setPack(data)
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [packId])

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (answered) return
      setAnswered(true)

      const newCombo = correct ? combo + 1 : 0
      setCombo(newCombo)

      const multiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1
      const xpGained = correct ? 10 * multiplier : 0

      if (xpGained > 0) {
        setSessionXp(x => x + xpGained)
        setXpPop({ id: Date.now(), amount: xpGained })
        setTimeout(() => setXpPop(null), 1000)
      }

      setResults(r => [...r, correct])
    },
    [answered, combo]
  )

  const handleNext = useCallback(() => {
    if (!pack) return
    const nextIdx = current + 1
    if (nextIdx >= pack.exercises.length) {
      // compute final results
      const finalResults = [...results]
      const correctCount = finalResults.filter(Boolean).length
      const pct = correctCount / pack.exercises.length
      const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1

      // Completion bonus
      const bonus = stars === 3 ? 50 : stars === 2 ? 25 : 0
      const finalXp = sessionXp + bonus
      setSessionXp(finalXp)

      saveResult(packId, stars, finalXp)
      setDone(true)
    } else {
      setCurrent(nextIdx)
      setAnswered(false)
      setSelectedIdx(null)
    }
  }, [current, pack, results, sessionXp, saveResult, packId])

  const resetSession = useCallback(() => {
    setCurrent(0)
    setResults([])
    setSessionXp(0)
    setCombo(0)
    setAnswered(false)
    setSelectedIdx(null)
    setDone(false)
  }, [])

  const goBack = useCallback(() => {
    void navigate({ to: '/exercises' })
  }, [navigate])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
        <Skeleton variant="rounded" height={8} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
      </Container>
    )
  }

  if (fetchError || !pack) {
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
    const correctCount = results.filter(Boolean).length
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
        <DoneScreen
          correctCount={correctCount}
          total={results.length}
          xpEarned={sessionXp}
          onRetry={resetSession}
          onBack={goBack}
          t={t}
        />
      </Container>
    )
  }

  const exercise = pack.exercises[current]
  if (!exercise) return null

  const progressPct = (current / pack.exercises.length) * 100
  const comboMultiplier = combo >= 5 ? 3 : combo >= 3 ? 2 : 1
  const showCombo = combo >= 3

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Top bar */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <IconButton size="small" onClick={goBack} sx={{ color: 'text.disabled' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box flex={1} position="relative">
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        {/* XP + combo */}
        <Stack direction="row" gap={1} alignItems="center" flexShrink={0} position="relative">
          <AnimatePresence>
            {xpPop && (
              <motion.div
                key={xpPop.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -30, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: 0,
                  pointerEvents: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#f59e0b',
                  whiteSpace: 'nowrap',
                }}
              >
                +{xpPop.amount} XP
              </motion.div>
            )}
          </AnimatePresence>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
            }}
          >
            <Typography variant="caption" fontWeight={800}>
              {sessionXp} XP
            </Typography>
          </Box>
          <AnimatePresence>
            {showCombo && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                  }}
                >
                  <Typography variant="caption" fontWeight={800}>
                    🔥 ×{comboMultiplier}
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Stack>

      {/* Exercise counter */}
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        {current + 1} / {pack.exercises.length}
      </Typography>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }}
          exit={{ opacity: 0, x: -40, transition: { duration: 0.18, ease: [0.55, 0.055, 0.675, 0.19] as [number, number, number, number] } }}
        >
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: { xs: 2.5, sm: 3 },
              bgcolor: 'background.paper',
              mb: 2,
            }}
          >
            <ExerciseRouter
              exercise={exercise}
              onAnswer={handleAnswer}
              answered={answered}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
            />
          </Box>
        </motion.div>
      </AnimatePresence>

      {/* Feedback + Next button */}
      <AnimatePresence>
        {answered && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0 }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color={
                  exercise.type === 'sentence-order' || exercise.type === 'match-pairs'
                    ? 'text.secondary'
                    : results[results.length - 1]
                      ? 'success.main'
                      : 'error.main'
                }
              >
                {exercise.type === 'sentence-order' || exercise.type === 'match-pairs'
                  ? ''
                  : results[results.length - 1]
                    ? t.exercises.correct
                    : t.exercises.wrong}
              </Typography>
              <Button variant="contained" size="large" onClick={handleNext} sx={{ fontWeight: 700 }}>
                {current < pack.exercises.length - 1 ? t.exercises.next : t.exercises.finish}
              </Button>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  )
}
