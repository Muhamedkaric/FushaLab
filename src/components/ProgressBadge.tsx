import { Chip, Tooltip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { DifficultyRating } from '@/types/content'

interface Props {
  rating: DifficultyRating
}

const CONFIG = {
  easy: { color: 'success' as const, icon: <CheckCircleIcon fontSize="inherit" />, label: '✓' },
  medium: { color: 'warning' as const, icon: undefined, label: '~' },
  hard: { color: 'error' as const, icon: undefined, label: '!' },
}

export function ProgressBadge({ rating }: Props) {
  if (!rating) return null
  const cfg = CONFIG[rating]
  return (
    <Tooltip title={rating}>
      <Chip
        icon={cfg.icon}
        label={cfg.label}
        color={cfg.color}
        size="small"
        variant="filled"
        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
      />
    </Tooltip>
  )
}
