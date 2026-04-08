import { Box, Typography, Stack, Container, Chip, IconButton, Skeleton, Paper } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n'
import type { PhraseSet, PhraseCategoryMeta, ConversationsIndex } from '@/types/conversations'

// ── Animations ────────────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
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

// ── TTS helper ────────────────────────────────────────────────────────────────

function speakArabic(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'
  window.speechSynthesis.speak(utt)
}

// ── Register chip ─────────────────────────────────────────────────────────────

type RegisterColor = 'primary' | 'warning' | 'default'

const REGISTER_COLORS: Record<string, RegisterColor> = {
  formal: 'primary',
  neutral: 'default',
  informal: 'warning',
}

// ── PhraseCard ────────────────────────────────────────────────────────────────

interface PhraseCardProps {
  arabic: string
  bs: string
  en: string
  register: 'formal' | 'neutral' | 'informal'
  context?: string
  contextBs?: string
  registerLabel: string
}

function PhraseCard({
  arabic,
  bs,
  en,
  register,
  context,
  contextBs,
  registerLabel,
}: PhraseCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box flex={1} minWidth={0}>
          {/* Arabic */}
          <Typography
            dir="rtl"
            sx={{
              fontFamily: 'Amiri, serif',
              fontSize: '1.5rem',
              lineHeight: 1.6,
              display: 'block',
              textAlign: 'right',
              color: 'primary.main',
              mb: 1,
            }}
          >
            {arabic}
          </Typography>

          {/* Register chip */}
          <Chip
            label={registerLabel}
            size="small"
            color={REGISTER_COLORS[register] ?? 'default'}
            variant="outlined"
            sx={{ mb: 1, fontWeight: 600, fontSize: '0.68rem' }}
          />

          {/* BS translation */}
          <Typography variant="body1" fontWeight={500} sx={{ mb: 0.25 }}>
            {bs}
          </Typography>

          {/* EN translation */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: context ? 1 : 0 }}>
            {en}
          </Typography>

          {/* Context note */}
          {(context || contextBs) && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontStyle: 'italic', display: 'block' }}
            >
              {contextBs ?? context}
            </Typography>
          )}
        </Box>

        {/* TTS */}
        <IconButton
          size="small"
          onClick={() => speakArabic(arabic)}
          sx={{ flexShrink: 0, color: 'text.secondary', mt: 0.25 }}
          aria-label="Speak Arabic phrase"
        >
          <VolumeUpIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  )
}

// ── Loading skeletons ─────────────────────────────────────────────────────────

function PhraseSkeletons() {
  return (
    <Stack gap={1.5}>
      {Array.from({ length: 6 }, (_, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Skeleton width="60%" height={36} sx={{ mb: 1 }} />
          <Skeleton width={60} height={20} sx={{ mb: 1 }} />
          <Skeleton width="80%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton width="50%" height={16} />
        </Paper>
      ))}
    </Stack>
  )
}

// ── PhrasesPage ───────────────────────────────────────────────────────────────

interface PhrasesPageProps {
  initialCategoryId?: string
}

export function PhrasesPage({ initialCategoryId }: PhrasesPageProps = {}) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<PhraseCategoryMeta[]>([])
  const [indexLoading, setIndexLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(initialCategoryId ?? null)
  const [phraseSet, setPhraseSet] = useState<PhraseSet | null>(null)
  const [phraseLoading, setPhraseLoading] = useState(false)

  // Load index
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndexLoading(true)
    void fetch('/data/conversations/index.json')
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<ConversationsIndex>
      })
      .then(data => {
        setCategories(data.phraseCategories)
        if (!initialCategoryId && data.phraseCategories.length > 0) {
          setSelectedId(data.phraseCategories[0].id)
        }
        setIndexLoading(false)
      })
      .catch(() => {
        setIndexLoading(false)
      })
  }, [])

  // Load selected category phrases
  useEffect(() => {
    if (!selectedId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhraseLoading(true)

    setPhraseSet(null)
    void fetch(`/data/conversations/phrases/${selectedId}.json`)
      .then(async r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json() as Promise<PhraseSet>
      })
      .then(data => {
        setPhraseSet(data)
        setPhraseLoading(false)
      })
      .catch(() => {
        setPhraseLoading(false)
      })
  }, [selectedId])

  const registerLabel = (r: string) => {
    if (r === 'formal') return t.conversation.register.formal
    if (r === 'informal') return t.conversation.register.informal
    return t.conversation.register.neutral
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Back button */}
      <Box
        component="button"
        onClick={() => void navigate({ to: '/conversation' })}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 3,
          ml: -0.5,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'text.secondary',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          p: 0.5,
          borderRadius: 1,
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        <ArrowBackIcon fontSize="small" />
        {t.conversation.backToConversations}
      </Box>

      {/* Header */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t.conversation.phrases}
        </Typography>
        <Typography
          dir="rtl"
          sx={{
            fontFamily: 'Amiri, serif',
            fontSize: '1.4rem',
            color: 'text.secondary',
            display: 'block',
          }}
        >
          التَّعْبِيرَاتُ الوَظِيفِيَّةُ
        </Typography>
      </Box>

      {/* Body: category selector + phrase list */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 2, sm: 4 }} alignItems="flex-start">
        {/* Category selector */}
        {indexLoading ? (
          <Box sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1, borderRadius: 2 }} />
            ))}
          </Box>
        ) : (
          <>
            {/* Mobile: horizontal scrollable chips */}
            <Box
              sx={{
                display: { xs: 'flex', sm: 'none' },
                overflowX: 'auto',
                gap: 1,
                pb: 0.5,
                '&::-webkit-scrollbar': { display: 'none' },
                width: '100%',
              }}
            >
              {categories.map(cat => (
                <Chip
                  key={cat.id}
                  label={cat.titleAr || cat.title}
                  onClick={() => setSelectedId(cat.id)}
                  color={selectedId === cat.id ? 'primary' : 'default'}
                  variant={selectedId === cat.id ? 'filled' : 'outlined'}
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>

            {/* Desktop: vertical list */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                gap: 1,
                width: 220,
                flexShrink: 0,
              }}
            >
              {categories.map(cat => (
                <Box
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedId === cat.id ? 'primary.main' : 'divider',
                    bgcolor: selectedId === cat.id ? 'primary.main' : 'background.paper',
                    color: selectedId === cat.id ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.15s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: selectedId === cat.id ? 'primary.main' : 'action.hover',
                    },
                  }}
                >
                  <Typography
                    dir="rtl"
                    sx={{
                      fontFamily: 'Amiri, serif',
                      fontSize: '1.1rem',
                      display: 'block',
                      textAlign: 'right',
                      mb: 0.25,
                    }}
                  >
                    {cat.titleAr}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      color: selectedId === cat.id ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                    }}
                  >
                    {cat.title} · {cat.phraseCount}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Phrase list */}
        <Box flex={1} minWidth={0}>
          {phraseLoading ? (
            <PhraseSkeletons />
          ) : phraseSet ? (
            <motion.div
              key={phraseSet.id}
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              <Stack gap={1.5}>
                {phraseSet.phrases.map((phrase, idx) => (
                  <motion.div key={idx} variants={cardVariants}>
                    <PhraseCard
                      arabic={phrase.arabic}
                      bs={phrase.bs}
                      en={phrase.en}
                      register={phrase.register}
                      context={phrase.context}
                      contextBs={phrase.contextBs}
                      registerLabel={registerLabel(phrase.register)}
                    />
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          ) : !indexLoading && categories.length === 0 ? (
            <Typography color="text.secondary">{t.conversation.noDialogues}</Typography>
          ) : null}
        </Box>
      </Stack>
    </Container>
  )
}
