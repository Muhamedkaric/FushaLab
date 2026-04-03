import { useState } from 'react'
import { Avatar, Box, Menu, MenuItem, Button, Typography, Divider } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useAuth } from '@/context/AuthContext'
import { AuthModal } from './AuthModal'
import { useI18n } from '@/i18n'

export function UserButton() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  if (!user) {
    return (
      <>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AccountCircleIcon fontSize="small" />}
          onClick={() => setModalOpen(true)}
          fullWidth
          sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: 2, justifyContent: 'flex-start' }}
        >
          {t.auth.signIn}
        </Button>
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    )
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <>
      <Box
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
          {initials}
        </Avatar>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            void signOut()
          }}
          dense
        >
          {t.auth.signOut}
        </MenuItem>
      </Menu>
    </>
  )
}
