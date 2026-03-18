import { Switch, FormControlLabel, Typography } from '@mui/material'
import { useI18n } from '@/i18n'

interface Props {
  show: boolean
  onToggle: (show: boolean) => void
}

export function HarakatToggle({ show, onToggle }: Props) {
  const { t } = useI18n()

  return (
    <FormControlLabel
      control={
        <Switch
          checked={show}
          onChange={e => onToggle(e.target.checked)}
          color="primary"
          size="small"
        />
      }
      label={
        <Typography variant="body2" fontWeight={500}>
          {show ? t.reader.hideHarakat : t.reader.showHarakat}
        </Typography>
      }
      labelPlacement="start"
      sx={{ mx: 0, gap: 1 }}
    />
  )
}
