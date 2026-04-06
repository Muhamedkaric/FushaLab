import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Container,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import type { Category, Level } from '@/types/content'
import { useLevelManifest } from '@/hooks/useContentFetch'
import { useProgress } from '@/hooks/useProgress'
import { ProgressBadge } from '@/components/ProgressBadge'
import { DownloadSection } from '@/components/DownloadSection'
import { useI18n } from '@/i18n'

const LEVELS: Level[] = ['B1', 'B2', 'C1', 'C2']
const PAGE_SIZE = 20

interface Props {
  category: Category
  level: Level
}

export function LevelPage({ category, level }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data, loading, error } = useLevelManifest(category, level)
  const { getRating } = useProgress()
  const [hideEasy, setHideEasy] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset pagination when level or filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE)
  }, [category, level, hideEasy])

  const handleLevelChange = (_: React.SyntheticEvent, newLevel: string) => {
    void navigate({
      to: '/reading/$category/$level',
      params: { category, level: newLevel as Level },
    })
  }

  const filtered = data
    ? data.items.filter(item => !(hideEasy && getRating(item.id) === 'easy'))
    : []
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        sx={{ mb: 3 }}
        onClick={() => void navigate({ to: '/reading' })}
      >
        {t.reader.backToList}
      </Button>

      <Typography variant="h4" fontWeight={700} mb={1}>
        {t.categories[category]}
      </Typography>

      {/* Level tabs */}
      <Tabs
        value={level}
        onChange={handleLevelChange}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {LEVELS.map(l => (
          <Tab key={l} value={l} label={l} sx={{ fontWeight: 600, minWidth: 60 }} />
        ))}
      </Tabs>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {error && (
        <Alert
          severity="info"
          sx={{ borderRadius: 2 }}
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              {t.common.retry}
            </Button>
          }
        >
          {t.common.error}
        </Alert>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {data.items.length} {t.progress.total}
              </Typography>
              <Typography variant="body2" color="success.main">
                · {data.items.filter(i => getRating(i.id) === 'easy').length} {t.reader.completed}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              {data.items.some(i => getRating(i.id) === 'easy') && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={hideEasy ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  onClick={() => setHideEasy(h => !h)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {hideEasy ? t.reader.showCompleted : t.reader.hideCompleted}
                </Button>
              )}
              <DownloadSection category={category} level={level} manifest={data} />
            </Stack>
          </Stack>

          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {visible.map((item, idx) => {
              const rating = getRating(item.id)
              const isEasy = rating === 'easy'

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx, 5) * 0.05, duration: 0.25 }}
                >
                  <ListItem
                    disablePadding
                    sx={{
                      border: '1px solid',
                      borderColor: isEasy ? 'success.main' : 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      opacity: isEasy ? 0.65 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <ListItemButton
                      onClick={() =>
                        void navigate({
                          to: '/reading/$category/$level/$id',
                          params: { category, level, id: item.id },
                        })
                      }
                      sx={{ py: 1.5, px: 2 }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            dir="rtl"
                            sx={{
                              fontFamily: '"Amiri", serif',
                              fontSize: '1.15rem',
                              direction: 'rtl',
                              textAlign: 'right',
                              lineHeight: 1.8,
                            }}
                          >
                            {item.arabic.split(' ').slice(0, 8).join(' ')}
                            {item.arabic.split(' ').length > 8 ? '…' : ''}
                          </Typography>
                        }
                        secondary={
                          <Stack
                            component="span"
                            direction="row"
                            gap={0.5}
                            mt={0.5}
                            flexWrap="wrap"
                          >
                            {item.metadata.tags.map(tag => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            ))}
                          </Stack>
                        }
                      />
                      <Box sx={{ ml: 2 }}>
                        {isEasy ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ProgressBadge rating={rating} />
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              )
            })}
          </List>

          {hasMore && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {t.common.loadMore} ({filtered.length - visibleCount})
              </Button>
            </Box>
          )}
        </motion.div>
      )}
    </Container>
  )
}
