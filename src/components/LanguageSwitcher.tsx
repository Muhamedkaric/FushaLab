import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { useI18n, type Language } from '@/i18n'

const LANGUAGES: Array<{ code: Language; label: string; title: string }> = [
  { code: 'bs', label: 'BS', title: 'Bosanski' },
  { code: 'en', label: 'EN', title: 'English' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  return (
    <ToggleButtonGroup
      value={lang}
      exclusive
      onChange={(_, val: Language | null) => val && setLang(val)}
      size="small"
      sx={{ height: 32 }}
    >
      {LANGUAGES.map(({ code, label, title }) => (
        <Tooltip key={code} title={title}>
          <ToggleButton
            value={code}
            sx={{
              px: 1.5,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {label}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  )
}
