import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Popover,
} from '@mui/material'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import SubjectIcon from '@mui/icons-material/Subject'
import TextIncreaseIcon from '@mui/icons-material/TextIncrease'
import TextDecreaseIcon from '@mui/icons-material/TextDecrease'
import { motion } from 'framer-motion'
import type { ContentItem, Sentence } from '@/types/content'
import { toggleHarakat } from '@/utils/diacritics'
import { HarakatToggle } from './HarakatToggle'
import { WordTapText } from './WordTapText'
import { AudioPlayer } from './AudioPlayer'
import { TranslationPanel } from './TranslationPanel'
import { DifficultyRating } from './DifficultyRating'
import { useProgress } from '@/hooks/useProgress'
import { useI18n } from '@/i18n'

const PIN_KEY = 'fushalab_pin_translation'
const SENTENCE_MODE_KEY = 'fushalab_sentence_mode'
const FONT_SIZE_KEY = 'fushalab_fontsize'

const FONT_SIZES = [1.2, 1.5, 1.9, 2.3, 2.8] // rem steps
const DEFAULT_FONT_IDX = 2

const difficultyColor = (d: number) => (d === 1 ? 'success' : d === 2 ? 'warning' : 'error')

const baseArabicSx = {
  fontFamily: '"Amiri", serif',
  lineHeight: 2,
  letterSpacing: '0.02em',
  direction: 'rtl',
  textAlign: 'right',
  color: 'text.primary',
} as const

interface SentenceSpanProps {
  text: string
  active: boolean
  onClick: (el: HTMLElement) => void
  isLast: boolean
}

function SentenceSpan({ text, active, onClick, isLast }: SentenceSpanProps) {
  return (
    <>
      <Box
        component="span"
        onClick={e => onClick(e.currentTarget as HTMLElement)}
        sx={{
          cursor: 'pointer',
          borderRadius: '3px',
          px: 0.25,
          transition: 'background-color 0.15s',
          bgcolor: active ? 'rgba(201,168,76,0.25)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(201,168,76,0.12)' },
        }}
      >
        {text}
      </Box>
      {!isLast && ' '}
    </>
  )
}

interface Props {
  item: ContentItem
}

export function TextCard({ item }: Props) {
  const { t, lang } = useI18n()
  const { rate, getRating } = useProgress()
  const rating = getRating(item.id)

  const [showHarakat, setShowHarakat] = useState(true)

  // ── Persistent reading preferences ───────────────────────────────────────────
  const [pinTranslation, setPinTranslation] = useState(
    () => localStorage.getItem(PIN_KEY) === 'true'
  )
  const [sentenceMode, setSentenceMode] = useState(
    () => localStorage.getItem(SENTENCE_MODE_KEY) === 'true'
  )
  const [fontSizeIdx, setFontSizeIdx] = useState(() => {
    const stored = Number(localStorage.getItem(FONT_SIZE_KEY))
    return isNaN(stored) || stored < 0 || stored >= FONT_SIZES.length ? DEFAULT_FONT_IDX : stored
  })

  const changeFontSize = (delta: number) => {
    setFontSizeIdx(prev => {
      const next = Math.max(0, Math.min(FONT_SIZES.length - 1, prev + delta))
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }

  const togglePin = () => {
    const next = !pinTranslation
    setPinTranslation(next)
    localStorage.setItem(PIN_KEY, String(next))
  }

  const toggleSentenceMode = () => {
    const next = !sentenceMode
    setSentenceMode(next)
    localStorage.setItem(SENTENCE_MODE_KEY, String(next))
    setCurrentIdx(0)
    setPopoverAnchor(null)
    setPopoverIdx(-1)
  }

  // ── Sentence navigation ───────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0)
  const total = item.sentences.length
  const safeIdx = Math.min(currentIdx, total - 1)
  const currentSentence = item.sentences[safeIdx]

  const goNext = () => setCurrentIdx(i => Math.min(i + 1, total - 1))
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0))

  // ── Sentence popover (full-text mode) ─────────────────────────────────────────
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [popoverIdx, setPopoverIdx] = useState(-1)

  const handleSentenceClick = (el: HTMLElement, idx: number) => {
    if (popoverIdx === idx) {
      setPopoverAnchor(null)
      setPopoverIdx(-1)
    } else {
      setPopoverAnchor(el)
      setPopoverIdx(idx)
    }
  }

  const closePopover = () => {
    setPopoverAnchor(null)
    setPopoverIdx(-1)
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const getTranslation = (s: Sentence) => (lang === 'en' ? s.translationEn : s.translation)

  const fullArabic = item.sentences.map(s => s.arabic).join(' ')
  const audioText = sentenceMode ? currentSentence.arabic : fullArabic

  const displayTranslation = sentenceMode
    ? getTranslation(currentSentence)
    : item.sentences.map(getTranslation).join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'visible' }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* ── Header ───────────────────────────────────────────────────────── */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mb={2}
          >
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip label={item.level} size="small" variant="outlined" color="primary" />
              <Chip
                label={`#${item.metadata.difficulty}`}
                size="small"
                color={difficultyColor(item.metadata.difficulty)}
                variant="filled"
                sx={{ opacity: 0.8 }}
              />
              {item.metadata.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" gap={0.5}>
              {/* Font size */}
              <Tooltip title="-A">
                <span>
                  <IconButton size="small" onClick={() => changeFontSize(-1)} disabled={fontSizeIdx === 0}>
                    <TextDecreaseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="+A">
                <span>
                  <IconButton size="small" onClick={() => changeFontSize(1)} disabled={fontSizeIdx === FONT_SIZES.length - 1}>
                    <TextIncreaseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Pin translation */}
              <Tooltip title={pinTranslation ? t.reader.unpinTranslation : t.reader.pinTranslation}>
                <IconButton
                  size="small"
                  onClick={togglePin}
                  color={pinTranslation ? 'primary' : 'default'}
                >
                  {pinTranslation ? (
                    <PushPinIcon fontSize="small" />
                  ) : (
                    <PushPinOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              {/* Sentence / full mode toggle */}
              <Tooltip title={sentenceMode ? t.reader.fullMode : t.reader.sentenceMode}>
                <IconButton
                  size="small"
                  onClick={toggleSentenceMode}
                  color={sentenceMode ? 'primary' : 'default'}
                >
                  {sentenceMode ? (
                    <SubjectIcon fontSize="small" />
                  ) : (
                    <ViewStreamIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <HarakatToggle show={showHarakat} onToggle={setShowHarakat} />
              <AudioPlayer text={audioText} />
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* ── Sentence navigator (sentence mode only) ───────────────────── */}
          {sentenceMode && total > 1 && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={1} mb={1.5}>
              <IconButton size="small" disabled={safeIdx === 0} onClick={goPrev}>
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ minWidth: 56, textAlign: 'center' }}
              >
                {safeIdx + 1} {t.reader.sentenceOf} {total}
              </Typography>
              <IconButton size="small" disabled={safeIdx === total - 1} onClick={goNext}>
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}

          {/* ── Arabic text ───────────────────────────────────────────────── */}
          <Box dir="rtl" sx={{ py: 2, px: 1, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
            {sentenceMode ? (
              <WordTapText
                sentence={currentSentence}
                fontSize={`${FONT_SIZES[fontSizeIdx]}rem`}
                showHarakat={showHarakat}
                lang={lang}
              />
            ) : (
              <Typography
                variant="h5"
                component="p"
                sx={{ ...baseArabicSx, fontSize: `${FONT_SIZES[fontSizeIdx]}rem` }}
              >
                {item.sentences.map((s, i) => (
                  <SentenceSpan
                    key={i}
                    text={toggleHarakat(s.arabic, showHarakat)}
                    active={popoverIdx === i}
                    onClick={el => handleSentenceClick(el, i)}
                    isLast={i === total - 1}
                  />
                ))}
              </Typography>
            )}
          </Box>

          {/* ── Sentence tooltip popover (full-text mode) ─────────────────── */}
          <Popover
            open={popoverIdx >= 0}
            anchorEl={popoverAnchor}
            onClose={closePopover}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            disableScrollLock
            sx={{ pointerEvents: 'none' }}
            slotProps={{ paper: { sx: { pointerEvents: 'auto', maxWidth: 340, borderRadius: 2 } } }}
          >
            {popoverIdx >= 0 && popoverIdx < total && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {getTranslation(item.sentences[popoverIdx])}
                </Typography>
              </Box>
            )}
          </Popover>

          {/* ── Translation panel ─────────────────────────────────────────── */}
          <TranslationPanel
            itemId={item.id}
            translation={displayTranslation}
            pinned={pinTranslation}
            onTogglePin={togglePin}
          />

          <Divider sx={{ my: 2 }} />

          {/* ── Difficulty rating ─────────────────────────────────────────── */}
          <DifficultyRating itemId={item.id} current={rating} onRate={rate} />

          {rating === 'easy' && (
            <Typography
              variant="caption"
              color="success.main"
              fontWeight={600}
              display="block"
              mt={1}
            >
              ✓ {t.reader.completed}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
