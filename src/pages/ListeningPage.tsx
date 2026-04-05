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
} from '@mui/material'
import Grid from '@mui/material/Grid'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SchoolIcon from '@mui/icons-material/School'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useI18n } from '@/i18n'
import { useChannelIndex } from '@/hooks/useListeningFetch'
import type { ListeningChannel, ListeningLocale } from '@/types/listening'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const LOCALE_COLORS: Record<ListeningLocale, string> = {
  bs: '#2e7d32',
  en: '#1565c0',
  ar: '#6a1b9a',
}

const CHANNEL_GRADIENTS: Record<string, string> = {
  mrkonjic: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
  khasu: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
}

function ChannelThumbnail({ channel }: { channel: ListeningChannel }) {
  const hasVideo = channel.coverVideoId && channel.coverVideoId.length > 0

  if (hasVideo) {
    return (
      <Box
        component="img"
        src={`https://img.youtube.com/vi/${channel.coverVideoId}/mqdefault.jpg`}
        alt={channel.name}
        sx={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  const gradient =
    CHANNEL_GRADIENTS[channel.id] ?? 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)'
  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: '16/9',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <HeadphonesIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
    </Box>
  )
}

export function ListeningPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { data, loading, error } = useChannelIndex()

  const channels = data?.channels ?? []
  const filtered = channels.filter(ch => ch.locales.includes(lang as ListeningLocale))

  function getDescription(ch: ListeningChannel) {
    return lang === 'bs' ? ch.descriptionBs : ch.descriptionEn
  }

  function getApproachLabel(ch: ListeningChannel) {
    if (ch.approach === 'structured-course') return t.listening.approach.structuredCourse
    if (ch.approach === 'authentic-input') return t.listening.approach.authenticInput
    return t.listening.approach.mixed
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            <HeadphonesIcon />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {t.listening.title}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" mb={4}>
          {t.listening.subtitle}
        </Typography>
      </motion.div>

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t.common.error}
        </Alert>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Alert severity="info">{t.listening.noContentForLocale}</Alert>
      )}

      {!loading && !error && filtered.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={3}>
            {filtered.map(ch => (
              <Grid key={ch.id} size={{ xs: 12, sm: 6 }} component="div">
                <motion.div variants={itemVariants} style={{ height: '100%' }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
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
                          to: '/listening/$channelId',
                          params: { channelId: ch.id },
                        })
                      }
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <ChannelThumbnail channel={ch} />

                      <CardContent sx={{ flex: 1, p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={0.25}>
                          {ch.name}
                        </Typography>
                        {ch.subtitle && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mb={1}
                          >
                            {ch.subtitle}
                          </Typography>
                        )}

                        <Stack direction="row" gap={0.75} flexWrap="wrap" mb={1.5}>
                          {ch.locales.map(loc => (
                            <Chip
                              key={loc}
                              label={loc.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: LOCALE_COLORS[loc],
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          ))}
                          <Chip
                            icon={<SchoolIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={getApproachLabel(ch)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                          {getDescription(ch)}
                        </Typography>
                      </CardContent>

                      <Box
                        sx={{
                          px: 2,
                          pb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'text.disabled',
                        }}
                        onClick={e => {
                          e.stopPropagation()
                          window.open(ch.youtubeChannelUrl, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">{t.listening.openYouTube}</Typography>
                      </Box>
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
