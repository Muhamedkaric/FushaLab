import { StrictMode, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider } from '@emotion/react'
import { I18nProvider } from './i18n'
import { darkTheme, lightTheme } from './theme'
import { rtlCache } from './theme/rtl'
import { createAppRouter } from './router'
import './index.css'

function AppShell() {
  const [isDark, setIsDark] = useState(true)
  const onToggleTheme = () => setIsDark(d => !d)

  const router = useMemo(
    () => createAppRouter({ isDark, onToggleTheme }),
    // router is created once; context is updated via router.update below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  router.update({ context: { isDark, onToggleTheme } })

  return (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </ThemeProvider>
    </CacheProvider>
  )
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <AppShell />
  </StrictMode>
)
