import { useState } from 'react'
import { Box, Button, Typography, Snackbar } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { motion } from 'framer-motion'
import type { DifficultyRating } from '@/types/content'
import { useI18n } from '@/i18n'

interface Props {
  itemId: string
  current: DifficultyRating
  onRate: (id: string, rating: DifficultyRating) => void
}

const RATINGS: Array<{ value: DifficultyRating; color: 'success' | 'warning' | 'error' }> = [
  { value: 'easy', color: 'success' },
  { value: 'medium', color: 'warning' },
  { value: 'hard', color: 'error' },
]

export function DifficultyRating({ itemId, current, onRate }: Props) {
  const { t } = useI18n()
  const [snack, setSnack] = useState(false)

  const handleRate = (rating: DifficultyRating) => {
    onRate(itemId, rating)
    setSnack(true)
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        {t.difficulty.label}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {RATINGS.map(({ value, color }) => {
          const label = value ? t.difficulty[value] : ''
          const active = current === value
          return (
            <motion.div key={value} whileTap={{ scale: 0.93 }}>
              <Button
                size="small"
                variant={active ? 'contained' : 'outlined'}
                color={color}
                onClick={() => handleRate(value)}
                startIcon={active ? <CheckCircleIcon fontSize="small" /> : undefined}
                sx={{
                  minWidth: 80,
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </Button>
            </motion.div>
          )
        })}
      </Box>

      <Snackbar
        open={snack}
        autoHideDuration={1800}
        onClose={() => setSnack(false)}
        message={t.difficulty.saved}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
