import { createTheme, type ThemeOptions } from '@mui/material/styles'

const baseOptions: ThemeOptions = {
  direction: 'ltr',
  typography: {
    fontFamily: '"Inter", "Amiri", sans-serif',
    h1: { fontFamily: '"Amiri", serif', fontWeight: 700 },
    h2: { fontFamily: '"Amiri", serif', fontWeight: 700 },
    h3: { fontFamily: '"Amiri", serif', fontWeight: 700 },
    h4: { fontFamily: '"Amiri", serif', fontWeight: 700 },
    h5: { fontFamily: '"Amiri", serif' },
    h6: { fontFamily: '"Amiri", serif' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0.3,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
}

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#C9A84C',
      light: '#E8C96A',
      dark: '#A07C2A',
      contrastText: '#0F0F0F',
    },
    secondary: {
      main: '#4CAFA8',
      light: '#6ECCC6',
      dark: '#2A8C85',
    },
    background: {
      default: '#0D1117',
      paper: '#161B22',
    },
    text: {
      primary: '#E6EDF3',
      secondary: '#8B949E',
    },
    divider: 'rgba(230, 237, 243, 0.08)',
    success: { main: '#3FB950' },
    warning: { main: '#D29922' },
    error: { main: '#F85149' },
  },
})

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#8A6914',
      light: '#C9A84C',
      dark: '#5C440A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2A8C85',
      light: '#4CAFA8',
      dark: '#1A5C58',
    },
    background: {
      default: '#F6F1E9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
    divider: 'rgba(28, 27, 31, 0.12)',
    success: { main: '#2E7D32' },
    warning: { main: '#E65100' },
    error: { main: '#C62828' },
  },
})
