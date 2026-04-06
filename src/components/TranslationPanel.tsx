import { useState, useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/i18n'

interface Props {
  translation: string
  pinned: boolean
  onTogglePin: () => void
  /** Pass item.id so the panel resets visibility when navigating to a new item */
  itemId: string
}

export function TranslationPanel({ translation, pinned, itemId }: Props) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(pinned)

  // When pinned is turned on, immediately show translation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pinned) setVisible(true)
  }, [pinned])

  // When navigating to a new item, reset visibility to pinned preference
  // We use a ref-style pattern — update state during render when itemId changes
  const [prevItemId, setPrevItemId] = useState(itemId)
  if (prevItemId !== itemId) {
    setPrevItemId(itemId)
    setVisible(pinned)
  }

  // If pinned: no toggle button, always show
  if (pinned) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'primary.main',
          borderOpacity: 0.3,
        }}
      >
        <Typography variant="body1" color="text.secondary" fontStyle="italic">
          {translation}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
        onClick={() => setVisible(v => !v)}
        sx={{ mb: 1 }}
      >
        {visible ? t.reader.hideTranslation : t.reader.showTranslation}
      </Button>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="translation"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body1" color="text.secondary" fontStyle="italic">
                {translation}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
