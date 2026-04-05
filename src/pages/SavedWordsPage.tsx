import { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SchoolIcon from '@mui/icons-material/School'
import { motion, AnimatePresence } from 'framer-motion'
import { useSavedWords } from '@/hooks/useSavedWords'
import { useI18n } from '@/i18n'
import type { SavedWord } from '@/types/content'

// ── Review session ─────────────────────────────────────────────────────────────

function ReviewSession({ words, onDone }: { words: SavedWord[]; onDone: () => void }) {
  const { t, lang } = useI18n()
  const [queue, setQueue] = useState<SavedWord[]>([...words])
  const [revealed, setRevealed] = useState(false)
  const [knownCount, setKnownCount] = useState(0)

  const current = queue[0]

  const handleGotIt = () => {
    setKnownCount(c => c + 1)
    setQueue(q => q.slice(1))
    setRevealed(false)
  }

  const handleStillLearning = () => {
    setQueue(q => [...q.slice(1), q[0]])
    setRevealed(false)
  }

  if (!current) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          {t.savedWords.sessionDone}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {knownCount} / {words.length}
        </Typography>
        <Button variant="contained" onClick={onDone}>
          {t.common.backToHome}
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="caption" color="text.secondary">
          {queue.length} {t.savedWords.wordsCount}
        </Typography>
        <Button size="small" onClick={onDone} variant="text">
          ✕
        </Button>
      </Stack>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, minHeight: 220 }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              {/* Dictionary form */}
              <Typography
                sx={{
                  fontFamily: '"Amiri", serif',
                  fontSize: '2.2rem',
                  direction: 'rtl',
                  color: 'primary.main',
                  fontWeight: 700,
                  lineHeight: 1.8,
                  mb: 0.5,
                }}
                dir="rtl"
              >
                {current.lemma ?? current.w}
              </Typography>

              {/* Seen-as form if different */}
              {current.lemma && current.lemma !== current.w && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  dir="rtl"
                  display="block"
                  mb={1}
                >
                  {t.savedWords.seenInText}: {current.w}
                </Typography>
              )}

              {current.root && (
                <Chip
                  label={current.root}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: '"Amiri", serif', direction: 'rtl', mb: 2 }}
                />
              )}

              {!revealed ? (
                <Button
                  variant="outlined"
                  onClick={() => setRevealed(true)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {t.savedWords.reveal}
                </Button>
              ) : (
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" fontWeight={700} mb={0.5}>
                    {lang === 'en' ? current.en : current.bs}
                  </Typography>
                  {lang === 'bs' && current.en !== current.bs && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {current.en}
                    </Typography>
                  )}
                  <Stack direction="row" gap={1} justifyContent="center" mt={2}>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleStillLearning}
                      sx={{ flex: 1 }}
                    >
                      {t.savedWords.stillLearning}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleGotIt}
                      sx={{ flex: 1 }}
                    >
                      {t.savedWords.gotIt}
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}

// ── Word list ──────────────────────────────────────────────────────────────────

function WordListItem({ word, onRemove }: { word: SavedWord; onRemove: () => void }) {
  const { t, lang } = useI18n()
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Amiri", serif',
                fontSize: '1.4rem',
                direction: 'rtl',
                color: 'primary.main',
                fontWeight: 700,
                lineHeight: 1.6,
              }}
              dir="rtl"
            >
              {word.lemma ?? word.w}
            </Typography>
            {word.lemma && word.lemma !== word.w && (
              <Typography variant="caption" color="text.secondary" dir="rtl" display="block">
                {t.savedWords.seenInText}: {word.w}
              </Typography>
            )}
            {word.root && (
              <Typography variant="caption" color="text.secondary" dir="rtl" display="block">
                {word.root}
              </Typography>
            )}
            <Typography variant="body2" fontWeight={600} mt={0.5}>
              {lang === 'en' ? word.en : word.bs}
            </Typography>
            {lang === 'bs' && word.en !== word.bs && (
              <Typography variant="caption" color="text.secondary">
                {word.en}
              </Typography>
            )}
          </Box>
          <Tooltip title={t.savedWords.unsaveWord}>
            <IconButton size="small" onClick={onRemove} color="default">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function SavedWordsPage() {
  const { t } = useI18n()
  const { savedWords, removeWord, clearAll, count } = useSavedWords()
  const [reviewing, setReviewing] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  if (reviewing) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <ReviewSession words={savedWords} onDone={() => setReviewing(false)} />
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
        <BookmarkIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          {t.savedWords.title}
        </Typography>
      </Stack>
      <Typography color="text.secondary" mb={3}>
        {t.savedWords.subtitle}
      </Typography>

      {count === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <BookmarkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            {t.savedWords.empty}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {t.savedWords.emptyHint}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Actions */}
          <Stack direction="row" gap={1} mb={3}>
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => setReviewing(true)}
              sx={{ flex: 1 }}
            >
              {t.savedWords.review} ({count})
            </Button>
            <Button variant="outlined" color="error" onClick={() => setClearDialogOpen(true)}>
              {t.savedWords.clearAll}
            </Button>
          </Stack>

          {/* Word list */}
          <Stack gap={1.5}>
            {savedWords.map(word => (
              <motion.div
                key={word.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <WordListItem word={word} onRemove={() => removeWord(word.key)} />
              </motion.div>
            ))}
          </Stack>
        </>
      )}

      {/* Clear confirm dialog */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>{t.savedWords.clearAll}</DialogTitle>
        <DialogContent>
          <Typography>{t.savedWords.clearConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>{t.common.retry}</Button>
          <Button
            color="error"
            onClick={() => {
              clearAll()
              setClearDialogOpen(false)
            }}
          >
            {t.savedWords.clearAll}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
