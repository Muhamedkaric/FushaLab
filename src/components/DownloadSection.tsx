import { Box, Button, Typography, LinearProgress, Tooltip, IconButton } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { Category, Level } from '@/types/content'
import type { LevelManifest } from '@/hooks/useContentFetch'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'

interface Props {
  category: Category
  level: Level
  manifest: LevelManifest | null
}

export function DownloadSection({ category, level, manifest }: Props) {
  const { state, progress, itemCount, download, remove } = useOfflineStatus(category, level)

  if (state === 'downloading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 180 }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {progress}%
        </Typography>
      </Box>
    )
  }

  if (state === 'done') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <WifiOffIcon sx={{ fontSize: 14, color: 'success.main' }} />
        <Typography variant="caption" color="success.main" fontWeight={600}>
          Offline · {itemCount}
        </Typography>
        <Tooltip title="Remove offline data">
          <IconButton size="small" onClick={() => void remove()} sx={{ ml: 0.5 }}>
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  if (state === 'error') {
    return (
      <Button
        size="small"
        variant="text"
        color="error"
        startIcon={<ErrorOutlineIcon fontSize="small" />}
        onClick={() => manifest && void download(manifest)}
        sx={{ fontSize: '0.75rem' }}
      >
        Retry
      </Button>
    )
  }

  return (
    <Tooltip title="Save for offline use">
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon fontSize="small" />}
        disabled={!manifest}
        onClick={() => manifest && void download(manifest)}
        sx={{ fontSize: '0.75rem', borderRadius: 2, py: 0.25 }}
      >
        Offline
      </Button>
    </Tooltip>
  )
}
