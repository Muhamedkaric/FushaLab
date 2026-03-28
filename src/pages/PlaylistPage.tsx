import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardActionArea,
  Chip,
  Paper,
  Divider,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useI18n } from '@/i18n'
import { usePlaylistIndex, usePlaylistVideos } from '@/hooks/useListeningFetch'
import type { ListeningVideo } from '@/types/listening'

interface Props {
  channelId: string
  playlistId: string
}

function VideoThumbnail({
  video,
  isSelected,
  onClick,
}: {
  video: ListeningVideo
  isSelected: boolean
  onClick: () => void
}) {
  const hasId = video.youtubeId && video.youtubeId.length > 0

  return (
    <CardActionArea
      onClick={onClick}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px solid',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        transition: 'border-color 0.2s',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {hasId ? (
          <Box
            component="img"
            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
            alt={video.title}
            sx={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '16/9',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <OndemandVideoIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
          </Box>
        )}

        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayCircleIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
        )}

        <Chip
          label={video.order}
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 18,
          }}
        />
      </Box>

      <Box sx={{ p: 1 }}>
        <Typography
          variant="caption"
          fontWeight={isSelected ? 700 : 400}
          color={isSelected ? 'primary.main' : 'text.primary'}
          sx={{ display: 'block', lineHeight: 1.3 }}
        >
          {video.title}
        </Typography>
      </Box>
    </CardActionArea>
  )
}

export function PlaylistPage({ channelId, playlistId }: Props) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const playlistIndex = usePlaylistIndex(channelId)
  const { data, loading, error } = usePlaylistVideos(channelId, playlistId)

  const [selectedVideo, setSelectedVideo] = useState<ListeningVideo | null>(null)

  const playlist = playlistIndex.data?.playlists.find(pl => pl.id === playlistId)
  const videos = data?.videos.filter(v => v.youtubeId && v.youtubeId.length > 0) ?? []
  const allVideos = data?.videos ?? []

  // auto-select first video with a real youtubeId
  useEffect(() => {
    if (!selectedVideo && videos.length > 0) {
      setSelectedVideo(videos[0])
    }
  }, [videos, selectedVideo])

  function getPlaylistName() {
    if (!playlist) return ''
    return lang === 'bs' ? playlist.nameBs : playlist.nameEn
  }

  const hasRealVideos = videos.length > 0

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() =>
          void navigate({
            to: '/listening/$channelId',
            params: { channelId },
          })
        }
        sx={{ mb: 3, color: 'text.secondary' }}
        size="small"
      >
        {t.listening.backToPlaylists}
      </Button>

      {playlist && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            {getPlaylistName()}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} mb={3}>
            <OndemandVideoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {allVideos.length} {t.listening.videos}
            </Typography>
          </Stack>
        </motion.div>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{t.common.error}</Alert>}

      {!loading && !error && !hasRealVideos && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t.listening.noVideos}
        </Alert>
      )}

      {!loading && !error && hasRealVideos && (
        <Box>
          {/* Player area */}
          <AnimatePresence mode="wait">
            {selectedVideo ? (
              <motion.div
                key={selectedVideo.youtubeId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    overflow: 'hidden',
                    mb: 2,
                  }}
                >
                  <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Box
                      component="iframe"
                      src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                      {lang === 'bs' ? selectedVideo.title : (selectedVideo.titleEn ?? selectedVideo.title)}
                    </Typography>
                    {selectedVideo.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedVideo.description}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Stack alignItems="center" gap={1}>
                    <PlayCircleIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t.listening.selectVideo}
                    </Typography>
                  </Stack>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ mb: 3 }} />

          {/* Video grid */}
          <Typography variant="h6" fontWeight={600} mb={2}>
            {t.listening.videos}
          </Typography>

          <Grid container spacing={1.5}>
            {videos.map(video => (
              <Grid key={video.youtubeId} size={{ xs: 6, sm: 4, md: 3 }} component="div">
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: selectedVideo?.youtubeId === video.youtubeId ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <VideoThumbnail
                    video={video}
                    isSelected={selectedVideo?.youtubeId === video.youtubeId}
                    onClick={() => setSelectedVideo(video)}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  )
}
