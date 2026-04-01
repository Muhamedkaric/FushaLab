import {
  Box,
  Typography,
  Container,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Skeleton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n'
import type { ConversationsIndex, DialogueMeta, PhraseCategoryMeta } from '@/types/conversations'

// ── Constants ──────────────────────────────────────────────────────────────────

const SITUATION_LABELS: Record<string, string> = {
  hotel: 'فُنْدُقٌ',
  restaurant: 'مَطْعَمٌ',
  airport: 'مَطَارٌ',
  doctor: 'طَبِيبٌ',
  university: 'جَامِعَةٌ',
  shopping: 'سُوقٌ',
  directions: 'طَرِيقٌ',
  introduction: 'تَعَارُفٌ',
  pharmacy: 'صَيْدَلِيَّةٌ',
  transport: 'سَيَّارَةٌ',
  business: 'أَعْمَالٌ',
  interview: 'مُقَابَلَةٌ',
  media: 'إِعْلَامٌ',
  bank: 'بَنْكٌ',
  academic: 'أَكَادِيمِيٌّ',
  complaint: 'شَكْوَىٌ',
  conference: 'مُؤْتَمَرٌ',
  negotiation: 'تَفَاوُضٌ',
  legal: 'قَانُونٌ',
  'education-policy': 'مَدْرَسَةٌ',
}

const LEVEL_COLORS = { B1: 'primary', B2: 'secondary', C1: 'warning', C2: 'error' } as const

type LevelFilter = 'all' | 'B1' | 'B2'

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

// ── Dialogue Card ─────────────────────────────────────────────────────────────

interface DialogueCardProps {
  dialogue: DialogueMeta
}

function DialogueCard({ dialogue }: DialogueCardProps) {
  const navigate = useNavigate()
  const levelColor = LEVEL_COLORS[dialogue.level] ?? 'primary'
  const situationLabel = SITUATION_LABELS[dialogue.situation] ?? dialogue.situation

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
            borderColor: 'primary.main',
            boxShadow: '0 4px 20px rgba(201, 168, 76, 0.15)',
          },
        }}
      >
        <CardActionArea
          onClick={() =>
            void navigate({ to: '/conversation/$id', params: { id: dialogue.id } })
          }
          sx={{ p: 2, height: '100%', alignItems: 'flex-start' }}
        >
          <CardContent sx={{ p: 0, width: '100%' }}>
            {/* Header: situation icon box + level chip */}
            <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'primary.contrastText',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Amiri", serif',
                    fontSize: '0.8rem',
                    lineHeight: 1,
                    direction: 'rtl',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {situationLabel}
                </Typography>
              </Box>
              <Box flex={1} minWidth={0}>
                <Chip
                  label={dialogue.level}
                  color={levelColor}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                />
              </Box>
            </Stack>

            {/* English title */}
            <Typography variant="subtitle2" fontWeight={600} noWrap mb={0.5}>
              {dialogue.title}
            </Typography>

            {/* Arabic title */}
            <Typography
              sx={{
                fontFamily: '"Amiri", serif',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                direction: 'rtl',
                textAlign: 'right',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {dialogue.titleAr}
            </Typography>

            {/* Footer: line count + duration */}
            <Stack direction="row" gap={2}>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <FormatListBulletedIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {dialogue.lineCount}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <AccessTimeIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {dialogue.estimatedMinutes} min
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  )
}

// ── Phrase Category Card ───────────────────────────────────────────────────────

interface PhraseCategoryCardProps {
  category: PhraseCategoryMeta
}

function PhraseCategoryCard({ category }: PhraseCategoryCardProps) {
  const navigate = useNavigate()

  return (
    <Box
      onClick={() =>
        void navigate({ to: '/conversation/phrases/$categoryId', params: { categoryId: category.id } })
      }
      sx={{
        flexShrink: 0,
        width: 180,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2,
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 16px rgba(201, 168, 76, 0.12)',
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Amiri", serif',
          fontSize: '1.5rem',
          lineHeight: 1.4,
          direction: 'rtl',
          textAlign: 'right',
          mb: 0.5,
          fontWeight: 700,
        }}
      >
        {category.titleAr}
      </Typography>
      <Typography variant="body2" fontWeight={600} noWrap mb={1}>
        {category.title}
      </Typography>
      <Chip
        label={`${category.phraseCount} phrases`}
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.65rem' }}
      />
    </Box>
  )
}

// ── ConversationPage ───────────────────────────────────────────────────────────

export function ConversationPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [index, setIndex] = useState<ConversationsIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    void fetch('/data/conversations/index.json')
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<ConversationsIndex>
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

  const allDialogues: DialogueMeta[] = index?.dialogues ?? []
  const phraseCategories: PhraseCategoryMeta[] = index?.phraseCategories ?? []

  const filteredDialogues =
    levelFilter === 'all'
      ? allDialogues
      : allDialogues.filter(d => d.level === levelFilter)

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
            <ChatBubbleOutlineIcon />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {t.conversation.title}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" mb={4}>
          {t.conversation.subtitle}
        </Typography>
      </motion.div>

      {/* ── Dialogues section ─────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          {t.conversation.dialogues}
        </Typography>
        <ToggleButtonGroup
          value={levelFilter}
          exclusive
          size="small"
          onChange={(_e, val) => {
            if (val !== null) setLevelFilter(val as LevelFilter)
          }}
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.75rem' } }}
        >
          <ToggleButton value="all">{t.conversation.filterAll}</ToggleButton>
          <ToggleButton value="B1">B1</ToggleButton>
          <ToggleButton value="B2">B2</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading ? (
        <Grid container spacing={2} mb={6}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }} component="div">
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredDialogues.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            mb: 6,
          }}
        >
          <Typography color="text.secondary">{t.conversation.noDialogues}</Typography>
        </Box>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2} mb={6}>
            {filteredDialogues.map(dialogue => (
              <Grid key={dialogue.id} size={{ xs: 12, sm: 6 }} component="div">
                <DialogueCard dialogue={dialogue} />
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* ── Functional Phrases strip ──────────────────────────────────────────── */}
      {(loading || phraseCategories.length > 0) && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              {t.conversation.phrases}
            </Typography>
            {!loading && (
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => void navigate({ to: '/conversation/phrases' })}
                sx={{ textTransform: 'none' }}
              >
                {t.conversation.viewAllPhrases}
              </Button>
            )}
          </Stack>

          {loading ? (
            <Stack direction="row" gap={1.5} overflow="hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={180}
                  height={120}
                  sx={{ borderRadius: 3, flexShrink: 0 }}
                />
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
              }}
            >
              {phraseCategories.map(category => (
                <PhraseCategoryCard key={category.id} category={category} />
              ))}
              <Box
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => void navigate({ to: '/conversation/phrases' })}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  {t.conversation.viewAllPhrases}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Container>
  )
}
