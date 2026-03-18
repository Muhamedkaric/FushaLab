import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/i18n'

interface Props {
  translation: string
}

export function TranslationPanel({ translation }: Props) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                direction: 'ltr',
                textAlign: 'left',
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
