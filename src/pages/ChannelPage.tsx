import { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Stack,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useI18n } from '@/i18n'
import { useChannelIndex, usePlaylistIndex } from '@/hooks/useListeningFetch'
import type { ListeningLocale, ListeningPlaylist } from '@/types/listening'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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

const LEVEL_COLORS: Record<string, string> = {
  A1: '#388e3c',
  A2: '#1976d2',
  B1: '#f57c00',
  B2: '#d32f2f',
  C1: '#7b1fa2',
  C2: '#00838f',
}

function getLevelColor(level: string): string {
  for (const [key, color] of Object.entries(LEVEL_COLORS)) {
    if (level.startsWith(key)) return color
  }
  return '#546e7a'
}

function PlaylistThumbnail({
  playlist,
  channelId,
}: {
  playlist: ListeningPlaylist
  channelId: string
}) {
  const hasVideo = playlist.coverVideoId && playlist.coverVideoId.length > 0
  const levelColor = getLevelColor(playlist.level)

  if (hasVideo) {
    return (
      <Box
        component="img"
        src={`https://img.youtube.com/vi/${playlist.coverVideoId}/mqdefault.jpg`}
        alt={playlist.nameBs}
        sx={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  // gradient placeholder with level badge
  void channelId
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: '16/9',
        background: `linear-gradient(135deg, ${levelColor}cc 0%, ${levelColor}88 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <HeadphonesIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.8)' }} />
      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 1 }}>
        {playlist.level}
      </Typography>
    </Box>
  )
}

interface Props {
  channelId: string
}

export function ChannelPage({ channelId }: Props) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const channelIndex = useChannelIndex()
  const playlistIndex = usePlaylistIndex(channelId)

  const [localeFilter, setLocaleFilter] = useState<ListeningLocale | 'all'>(lang)

  const channel = channelIndex.data?.channels.find(ch => ch.id === channelId)
  const playlists = playlistIndex.data?.playlists ?? []

  const filtered =
    localeFilter === 'all' ? playlists : playlists.filter(pl => pl.locale === localeFilter)

  function getPlaylistName(pl: ListeningPlaylist) {
    return lang === 'bs' ? pl.nameBs : pl.nameEn
  }

  function getPlaylistDesc(pl: ListeningPlaylist) {
    return lang === 'bs' ? pl.descriptionBs : pl.descriptionEn
  }

  const loading = channelIndex.loading || playlistIndex.loading
  const error = channelIndex.error || playlistIndex.error

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => void navigate({ to: '/listening' })}
        sx={{ mb: 3, color: 'text.secondary' }}
        size="small"
      >
        {t.listening.backToChannels}
      </Button>

      {channel && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Typography variant="h4" fontWeight={700} mb={0.5}>
            {channel.name}
          </Typography>
          {channel.subtitle && (
            <Typography variant="subtitle1" color="text.secondary" mb={1}>
              {channel.subtitle}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" mb={3} sx={{ maxWidth: 600 }}>
            {lang === 'bs' ? channel.descriptionBs : channel.descriptionEn}
          </Typography>
        </motion.div>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h6" fontWeight={600}>
          {t.listening.playlists}
        </Typography>
        <ToggleButtonGroup
          value={localeFilter}
          exclusive
          onChange={(_, val) => {
            if (val) setLocaleFilter(val as ListeningLocale | 'all')
          }}
          size="small"
        >
          <ToggleButton value="all">{t.listening.filterAll}</ToggleButton>
          <ToggleButton value="bs">{t.listening.filterBs}</ToggleButton>
          <ToggleButton value="en">{t.listening.filterEn}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{t.common.error}</Alert>}

      {!loading && !error && filtered.length === 0 && (
        <Alert severity="info">{t.listening.noContentForLocale}</Alert>
      )}

      {!loading && !error && filtered.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2}>
            {filtered.map(pl => (
              <Grid key={pl.id} size={{ xs: 12, sm: 6 }} component="div">
                <motion.div variants={itemVariants}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 4px 20px rgba(201, 168, 76, 0.15)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() =>
                        void navigate({
                          to: '/listening/$channelId/$playlistId',
                          params: { channelId, playlistId: pl.id },
                        })
                      }
                    >
                      <PlaylistThumbnail playlist={pl} channelId={channelId} />

                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          gap={1}
                          mb={0.75}
                        >
                          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                            {getPlaylistName(pl)}
                          </Typography>
                          <Chip
                            label={pl.level}
                            size="small"
                            sx={{
                              bgcolor: getLevelColor(pl.level),
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 20,
                              flexShrink: 0,
                            }}
                          />
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1.5}
                          sx={{ lineHeight: 1.4 }}
                        >
                          {getPlaylistDesc(pl)}
                        </Typography>

                        {!!pl.videoCount && pl.videoCount > 0 && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={0.5}
                            color="text.disabled"
                          >
                            <OndemandVideoIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {pl.videoCount} {t.listening.videos}
                            </Typography>
                          </Stack>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}
    </Container>
  )
}
