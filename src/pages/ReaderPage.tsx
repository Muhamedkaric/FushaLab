import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Container,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { useNavigate } from '@tanstack/react-router'
import type { Category, Level } from '@/types/content'
import { useContentItem, useLevelManifest } from '@/hooks/useContentFetch'
import { TextCard } from '@/components/TextCard'
import { useI18n } from '@/i18n'

interface Props {
  category: Category
  level: Level
  id: string
}

export function ReaderPage({ category, level, id }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: item, loading, error } = useContentItem(category, level, id)
  const { data: manifest } = useLevelManifest(category, level)

  const items = manifest?.items ?? []
  const currentIdx = items.findIndex(i => i.id === id)
  const prevItem = currentIdx > 0 ? items[currentIdx - 1] : null
  const nextItem = currentIdx < items.length - 1 ? items[currentIdx + 1] : null

  const goTo = (targetId: string) => {
    void navigate({
      to: '/reading/$category/$level/$id',
      params: { category, level, id: targetId },
    })
  }

  const goToList = () => {
    void navigate({ to: '/reading/$category/$level', params: { category, level } })
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      {/* Navigation bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Button startIcon={<ArrowBackIosIcon />} variant="text" size="small" onClick={goToList}>
          {t.reader.backToList}
        </Button>

        {items.length > 0 && (
          <Stack direction="row" gap={1}>
            <Tooltip title={t.reader.prev}>
              <span>
                <IconButton
                  size="small"
                  disabled={!prevItem}
                  onClick={() => prevItem && goTo(prevItem.id)}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontSize: '0.8rem',
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              {currentIdx + 1} / {items.length}
            </Box>

            <Tooltip title={t.reader.next}>
              <span>
                <IconButton
                  size="small"
                  disabled={!nextItem}
                  onClick={() => nextItem && goTo(nextItem.id)}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
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

      {item && <TextCard item={item} />}

      {/* Bottom navigation */}
      {items.length > 0 && !loading && (
        <Stack direction="row" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            disabled={!prevItem}
            onClick={() => prevItem && goTo(prevItem.id)}
          >
            {t.reader.prev}
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            disabled={!nextItem}
            onClick={() => nextItem && goTo(nextItem.id)}
          >
            {t.reader.next}
          </Button>
        </Stack>
      )}
    </Container>
  )
}
