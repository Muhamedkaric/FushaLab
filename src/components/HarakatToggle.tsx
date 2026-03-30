import { IconButton, Tooltip } from '@mui/material'
import FormatColorTextIcon from '@mui/icons-material/FormatColorText'
import { useI18n } from '@/i18n'

interface Props {
  show: boolean
  onToggle: (show: boolean) => void
}

export function HarakatToggle({ show, onToggle }: Props) {
  const { t } = useI18n()

  return (
    <Tooltip title={show ? t.reader.hideHarakat : t.reader.showHarakat}>
      <IconButton size="small" onClick={() => onToggle(!show)} color={show ? 'primary' : 'default'}>
        <FormatColorTextIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}
