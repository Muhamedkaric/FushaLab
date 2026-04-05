import {
  Box,
  Typography,
  Stack,
  Container,
  Chip,
  IconButton,
  Button,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SchoolIcon from '@mui/icons-material/School'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/i18n'
import type { Dialogue, ConversationLine } from '@/types/conversations'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DialoguePageProps {
  id: string
}

type StudyMode = 'read' | 'roleplay-a' | 'roleplay-b' | 'shadow'

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
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

// ── TTS helper ────────────────────────────────────────────────────────────────

function speakArabic(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'
  window.speechSynthesis.speak(utt)
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

interface ChatBubbleProps {
  line: ConversationLine
  mode: StudyMode
  shadowVisible: boolean
}

function ChatBubble({ line, mode, shadowVisible }: ChatBubbleProps) {
  const [translationOpen, setTranslationOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const isA = line.speaker === 'A'

  // Determine if this line is the "player's" hidden line in role-play
  const isHiddenLine = (mode === 'roleplay-a' && isA) || (mode === 'roleplay-b' && !isA)

  // In role-play mode translations are hidden by default; in read mode they're tappable
  const showTranslationToggle = mode !== 'shadow'

  // Shadow mode: line hidden until shadowVisible is true
  if (mode === 'shadow' && !shadowVisible) return null

  const handleBubbleClick = () => {
    if (isHiddenLine && !revealed) {
      setRevealed(true)
      return
    }
    if (showTranslationToggle) {
      setTranslationOpen(o => !o)
    }
  }

  const blurred = isHiddenLine && !revealed

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isA ? 'flex-end' : 'flex-start',
        width: '100%',
      }}
    >
      {/* Role label */}
      <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, px: 1, direction: 'ltr' }}>
        {line.roleAr} · {line.role}
      </Typography>

      {/* Bubble */}
      <Box
        onClick={handleBubbleClick}
        sx={{
          maxWidth: { xs: '90%', sm: '75%' },
          cursor: showTranslationToggle || isHiddenLine ? 'pointer' : 'default',
          bgcolor: isA ? 'primary.main' : 'background.paper',
          color: isA ? 'primary.contrastText' : 'text.primary',
          border: isA ? 'none' : '1px solid',
          borderColor: 'divider',
          borderRadius: isA ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          px: 2,
          py: 1.5,
          transition: 'box-shadow 0.15s',
          '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
          userSelect: 'none',
          filter: blurred ? 'blur(6px)' : 'none',
        }}
      >
        {/* Arabic text */}
        <Typography
          dir="rtl"
          sx={{
            fontFamily: 'Amiri, serif',
            fontSize: '1.25rem',
            lineHeight: 1.8,
            display: 'block',
            textAlign: 'right',
          }}
        >
          {line.arabic}
        </Typography>

        {/* Translation — collapsible, hidden in shadow + hidden by default in role-play */}
        {mode !== 'shadow' && (
          <Collapse in={translationOpen} unmountOnExit>
            <Box
              mt={1}
              pt={1}
              sx={{
                borderTop: '1px solid',
                borderColor: isA ? 'rgba(255,255,255,0.2)' : 'divider',
              }}
            >
              <Typography variant="body2" sx={{ color: isA ? 'inherit' : 'text.primary' }}>
                {line.bs}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: isA ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}
              >
                {line.en}
              </Typography>
            </Box>
          </Collapse>
        )}
      </Box>

      {/* TTS button — outside/below bubble */}
      <IconButton
        size="small"
        onClick={e => {
          e.stopPropagation()
          speakArabic(line.arabic)
        }}
        sx={{ mt: 0.25, color: 'text.disabled' }}
        aria-label="Speak Arabic"
      >
        <VolumeUpIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}

// ── ShadowControls ────────────────────────────────────────────────────────────

interface ShadowControlsProps {
  currentIdx: number
  total: number
  onNext: () => void
}

function ShadowControls({ currentIdx, total, onNext }: ShadowControlsProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        position: 'sticky',
        bottom: 16,
        mt: 3,
        px: 2,
        py: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {currentIdx + 1} / {total}
      </Typography>
      <Button
        variant="contained"
        size="small"
        disabled={currentIdx >= total - 1}
        onClick={onNext}
        sx={{ fontWeight: 700 }}
      >
        Next line →
      </Button>
    </Stack>
  )
}

// ── DialoguePage ──────────────────────────────────────────────────────────────

export function DialoguePage({ id }: DialoguePageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [mode, setMode] = useState<StudyMode>('read')
  const [shadowIdx, setShadowIdx] = useState(0)

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    setShadowIdx(0)
    void fetch(`/data/conversations/dialogues/${id}.json`)
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<Dialogue>
      })
      .then(data => {
        setDialogue(data)
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [id])

  // Auto-play TTS when shadow mode advances to a new line
  useEffect(() => {
    if (mode !== 'shadow' || !dialogue) return
    const line = dialogue.lines[shadowIdx]
    if (line) speakArabic(line.arabic)
  }, [mode, shadowIdx, dialogue])

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, val: StudyMode | null) => {
      if (!val) return
      setMode(val)
      setShadowIdx(0)
    },
    []
  )

  const goBack = useCallback(() => {
    void navigate({ to: '/conversation' })
  }, [navigate])

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Skeleton width={120} height={36} sx={{ mb: 3 }} />
        <Skeleton width="60%" height={48} sx={{ mb: 1 }} />
        <Skeleton width="40%" height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={52} sx={{ mb: 3, borderRadius: 2 }} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box
            key={i}
            mb={2}
            display="flex"
            justifyContent={i % 2 === 0 ? 'flex-end' : 'flex-start'}
          >
            <Skeleton variant="rounded" width="65%" height={72} sx={{ borderRadius: 3 }} />
          </Box>
        ))}
      </Container>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (fetchError || !dialogue) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Typography color="error" mb={2}>
          {t.common.error}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t.common.retry}
        </Button>
      </Container>
    )
  }

  const isRolePlay = mode === 'roleplay-a' || mode === 'roleplay-b'
  const hiddenSpeaker = mode === 'roleplay-a' ? 'A' : mode === 'roleplay-b' ? 'B' : null

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        onClick={goBack}
        sx={{ mb: 3, ml: -1 }}
      >
        {t.conversation.backToConversations}
      </Button>

      {/* Header */}
      <Box mb={3}>
        <Typography
          dir="rtl"
          sx={{
            fontFamily: 'Amiri, serif',
            fontSize: { xs: '2rem', sm: '2.6rem' },
            lineHeight: 1.4,
            display: 'block',
            textAlign: 'right',
            mb: 0.5,
          }}
        >
          {dialogue.titleAr}
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} mb={1.5}>
          {dialogue.title}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip
            label={dialogue.level}
            color="primary"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`${dialogue.estimatedMinutes} ${t.conversation.minutes}`}
            size="small"
            variant="outlined"
          />
          {dialogue.grammarFocus && (
            <Chip
              icon={<SchoolIcon />}
              label={`${t.conversation.grammarFocus}: ${dialogue.grammarFocus}`}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
        </Stack>
      </Box>

      {/* Mode selector */}
      <Box
        sx={{
          overflowX: 'auto',
          mb: 3,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{ whiteSpace: 'nowrap' }}
        >
          <ToggleButton value="read">{t.conversation.modes.read}</ToggleButton>
          <ToggleButton value="roleplay-a">{t.conversation.modes.rolePlayA}</ToggleButton>
          <ToggleButton value="roleplay-b">{t.conversation.modes.rolePlayB}</ToggleButton>
          <ToggleButton value="shadow">{t.conversation.modes.shadow}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Role-play instruction chip */}
      {isRolePlay && hiddenSpeaker && (
        <Box mb={2}>
          <Chip
            icon={<VisibilityIcon />}
            label={t.conversation.tapToReveal}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
      )}

      {/* Lines */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Stack gap={1.5}>
          {dialogue.lines.map((line, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <ChatBubble
                line={line}
                mode={mode}
                shadowVisible={mode !== 'shadow' || idx <= shadowIdx}
              />
            </motion.div>
          ))}
        </Stack>
      </motion.div>

      {/* Shadow controls */}
      {mode === 'shadow' && (
        <ShadowControls
          currentIdx={shadowIdx}
          total={dialogue.lines.length}
          onNext={() => setShadowIdx(i => Math.min(i + 1, dialogue.lines.length - 1))}
        />
      )}
    </Container>
  )
}
