import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Chip,
  Divider,
  AppBar,
  Toolbar,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import TranslateIcon from '@mui/icons-material/Translate'
import QuizIcon from '@mui/icons-material/Quiz'
import SchoolIcon from '@mui/icons-material/School'
import InsightsIcon from '@mui/icons-material/Insights'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserButton } from './UserButton'
import { FontSizeButton } from './FontSizeButton'
import { useI18n } from '@/i18n'

const SIDEBAR_WIDTH = 220
const BOTTOM_NAV_HEIGHT = 60

interface Props {
  children: React.ReactNode
  onToggleTheme: () => void
  isDark: boolean
}

export function Layout({ children, onToggleTheme, isDark }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: s => s.location.pathname })

  const NAV_ITEMS = [
    { path: '/', label: t.nav.home, icon: <HomeIcon fontSize="small" /> },
    { path: '/reading', label: t.nav.reading, icon: <MenuBookIcon fontSize="small" /> },
    { path: '/listening', label: t.nav.listening, icon: <HeadphonesIcon fontSize="small" /> },
    { path: '/vocabulary', label: t.nav.vocabulary, icon: <TranslateIcon fontSize="small" /> },
    { path: '/exercises', label: t.nav.exercises, icon: <QuizIcon fontSize="small" /> },
    { path: '/grammar', label: t.nav.grammar, icon: <SchoolIcon fontSize="small" /> },
    { path: '/progress', label: t.nav.progress, icon: <InsightsIcon fontSize="small" /> },
    { path: '/words', label: t.nav.savedWords, icon: <BookmarkIcon fontSize="small" /> },
  ]

  const BOTTOM_NAV_ITEMS = [
    { path: '/', label: t.nav.home, icon: <HomeIcon /> },
    { path: '/reading', label: t.nav.reading, icon: <MenuBookIcon /> },
    { path: '/listening', label: t.nav.listening, icon: <HeadphonesIcon /> },
    { path: '/grammar', label: t.nav.grammar, icon: <SchoolIcon /> },
    { path: '/vocabulary', label: t.nav.vocabulary, icon: <TranslateIcon /> },
    { path: '/progress', label: t.nav.progress, icon: <InsightsIcon /> },
  ]

  // Determine active bottom nav value
  const activePath = pathname
  const activeBottomValue = (() => {
    // Match exactly for home, prefix-match for others
    const match = BOTTOM_NAV_ITEMS.find(item =>
      item.path === '/' ? activePath === '/' : activePath.startsWith(item.path)
    )
    return match?.path ?? '/'
  })()

  const isActive = (path: string) =>
    path === '/' ? activePath === '/' : activePath.startsWith(path)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Logo */}
        <Box
          onClick={() => void navigate({ to: '/' })}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 2.5,
            cursor: 'pointer',
            color: 'inherit',
            '&:hover': { color: 'primary.main' },
            transition: 'color 0.2s',
          }}
        >
          <AutoStoriesIcon color="primary" sx={{ fontSize: 22 }} />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ fontFamily: '"Amiri", serif', letterSpacing: '0.04em', lineHeight: 1 }}
          >
            {t.appName}
          </Typography>
          <Chip
            label="Beta"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, ml: 'auto' }}
          />
        </Box>

        <Divider />

        {/* Nav items */}
        <List sx={{ flex: 1, pt: 1, px: 1 }}>
          {NAV_ITEMS.map(item => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => void navigate({ to: item.path })}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 36, color: isActive(item.path) ? 'inherit' : 'text.secondary' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Bottom controls */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <UserButton />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />
            <FontSizeButton />
            <Tooltip title={isDark ? t.common.lightMode : t.common.darkMode}>
              <IconButton onClick={onToggleTheme} size="small" color="inherit">
                {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      {/* ── Mobile AppBar ─────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          color: 'inherit',
        }}
      >
        <Toolbar sx={{ gap: 1, justifyContent: 'space-between', minHeight: 52 }}>
          <Box
            onClick={() => void navigate({ to: '/' })}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            <AutoStoriesIcon color="primary" sx={{ fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontFamily: '"Amiri", serif', letterSpacing: '0.04em' }}
            >
              {t.appName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UserButton compact />
            <LanguageSwitcher />
            <FontSizeButton />
            <IconButton onClick={onToggleTheme} size="small" color="inherit">
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          mt: { xs: '52px', md: 0 },
          mb: { xs: `${BOTTOM_NAV_HEIGHT}px`, md: 0 },
          minHeight: { xs: `calc(100vh - 52px - ${BOTTOM_NAV_HEIGHT}px)`, md: '100vh' },
        }}
      >
        {children}
      </Box>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
      <Paper
        elevation={8}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <BottomNavigation
          value={activeBottomValue}
          onChange={(_, newValue: string) => void navigate({ to: newValue })}
          sx={{ height: BOTTOM_NAV_HEIGHT, bgcolor: 'background.paper' }}
        >
          {BOTTOM_NAV_ITEMS.map(item => (
            <BottomNavigationAction
              key={item.path}
              value={item.path}
              label={item.label}
              icon={item.icon}
              sx={{
                minWidth: 0,
                fontSize: '0.6rem',
                '&.Mui-selected': { color: 'primary.main' },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
