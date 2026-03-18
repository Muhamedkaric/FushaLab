import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { useNavigate } from '@tanstack/react-router'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '@/i18n'

interface Props {
  children: React.ReactNode
  onToggleTheme: () => void
  isDark: boolean
}

export function Layout({ children, onToggleTheme, isDark }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ gap: 2, justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box
            onClick={() => void navigate({ to: '/' })}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              color: 'inherit',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            <AutoStoriesIcon color="primary" />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ fontFamily: '"Amiri", serif', letterSpacing: '0.05em' }}
              dir="ltr"
            >
              {t.appName}
            </Typography>
            <Chip
              label="Beta"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
            />
          </Box>

          {/* Right controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />
            <Tooltip title={isDark ? t.common.lightMode : t.common.darkMode}>
              <IconButton onClick={onToggleTheme} size="small" color="inherit">
                {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1 }}>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
          {children}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} FushaLab — {t.tagline}
        </Typography>
      </Box>
    </Box>
  )
}
