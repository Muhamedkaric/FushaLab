import { useState } from 'react'
import { Box, Card, CardContent, Typography, Chip, Divider, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import type { ContentItem } from '@/types/content'
import { toggleHarakat } from '@/utils/diacritics'
import { HarakatToggle } from './HarakatToggle'
import { AudioPlayer } from './AudioPlayer'
import { TranslationPanel } from './TranslationPanel'
import { DifficultyRating } from './DifficultyRating'
import { useProgress } from '@/hooks/useProgress'
import { useI18n } from '@/i18n'

interface Props {
  item: ContentItem
}

const difficultyColor = (d: number) =>
  d === 1 ? 'success' : d === 2 ? 'warning' : 'error'

export function TextCard({ item }: Props) {
  const { t } = useI18n()
  const [showHarakat, setShowHarakat] = useState(true)
  const { rate, getRating } = useProgress()

  const displayText = toggleHarakat(item.arabic, showHarakat)
  const rating = getRating(item.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header row */}
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

            <Stack direction="row" alignItems="center" gap={1}>
              <HarakatToggle show={showHarakat} onToggle={setShowHarakat} />
              <AudioPlayer text={item.arabic} />
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Arabic text */}
          <Box
            sx={{
              direction: 'rtl',
              textAlign: 'right',
              py: 2,
              px: 1,
              borderRadius: 2,
              bgcolor: 'action.hover',
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              component="p"
              sx={{
                fontFamily: '"Amiri", serif',
                fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' },
                lineHeight: 2,
                letterSpacing: '0.02em',
                color: 'text.primary',
              }}
            >
              {displayText}
            </Typography>
          </Box>

          {/* Translation */}
          <TranslationPanel translation={item.translation} />

          <Divider sx={{ my: 2 }} />

          {/* Rating */}
          <DifficultyRating
            itemId={item.id}
            current={rating}
            onRate={rate}
          />

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
