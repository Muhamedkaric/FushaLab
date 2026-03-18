import { IconButton, Tooltip, CircularProgress } from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import StopIcon from '@mui/icons-material/Stop'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { useI18n } from '@/i18n'

interface Props {
  text: string
}

export function AudioPlayer({ text }: Props) {
  const { t } = useI18n()
  const { speak, stop, speaking, supported, hasArabicVoice } = useArabicSpeech()

  if (!supported) return null

  const tooltip = !hasArabicVoice
    ? t.reader.noVoice
    : speaking
      ? t.reader.stopAudio
      : t.reader.playAudio

  return (
    <Tooltip title={tooltip} placement="top">
      <span>
        <IconButton
          onClick={() => (speaking ? stop() : speak(text))}
          color="primary"
          size="medium"
          sx={{
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
            transition: 'all 0.2s',
          }}
        >
          {speaking ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <VolumeUpIcon fontSize="small" />
          )}
          {speaking && (
            <StopIcon
              fontSize="small"
              sx={{ position: 'absolute', opacity: 0, '&:hover': { opacity: 1 } }}
            />
          )}
        </IconButton>
      </span>
    </Tooltip>
  )
}
