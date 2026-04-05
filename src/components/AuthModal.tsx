import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'

interface Props {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp, resetPassword } = useAuth()
  const { t } = useI18n()

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    let err = null
    if (mode === 'signup') {
      err = await signUp(email, password)
    } else if (mode === 'reset') {
      err = await resetPassword(email)
    } else {
      err = await signIn(email, password)
    }

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    if (mode === 'signin') {
      onClose()
    } else {
      setSuccess(t.auth.checkEmail)
    }
  }

  function handleClose() {
    setEmail('')
    setPassword('')
    setError(null)
    setSuccess(null)
    setMode('signin')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        {mode === 'reset' ? (
          t.auth.forgotPassword
        ) : (
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => {
              if (v) {
                setMode(v as 'signin' | 'signup')
                setError(null)
                setSuccess(null)
              }
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="signin" sx={{ flex: 1 }}>
              {t.auth.signIn}
            </ToggleButton>
            <ToggleButton value="signup" sx={{ flex: 1 }}>
              {t.auth.signUp}
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack component="form" onSubmit={handleSubmit} gap={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label={t.auth.email}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="email"
          />

          {mode !== 'reset' && (
            <TextField
              label={t.auth.password}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              inputProps={{ minLength: 6 }}
            />
          )}

          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === 'signin' ? (
              t.auth.signIn
            ) : mode === 'signup' ? (
              t.auth.signUp
            ) : (
              t.auth.sendResetLink
            )}
          </Button>

          {mode === 'signin' && (
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setMode('reset')
                setError(null)
                setSuccess(null)
              }}
              sx={{ alignSelf: 'center', fontSize: '0.75rem' }}
            >
              {t.auth.forgotPassword}
            </Button>
          )}

          {mode === 'reset' && (
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setMode('signin')
                setError(null)
                setSuccess(null)
              }}
              sx={{ alignSelf: 'center', fontSize: '0.75rem' }}
            >
              {t.auth.backToSignIn}
            </Button>
          )}

          {mode === 'signup' && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {t.auth.passwordHint}
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
