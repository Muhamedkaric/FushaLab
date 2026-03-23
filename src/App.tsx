import { useState, useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { I18nProvider } from './i18n'
import { darkTheme, lightTheme } from './theme'
import { createAppRouter } from './router'

export function App() {
  const [isDark, setIsDark] = useState(true)
  const onToggleTheme = () => setIsDark(d => !d)

  const router = useMemo(
    () => createAppRouter({ isDark, onToggleTheme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  router.update({ context: { isDark, onToggleTheme } })

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  )
}
