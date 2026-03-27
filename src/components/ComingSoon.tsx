import { Box, Typography } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

interface Props {
  message?: string
}

export function ComingSoon({ message }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        gap: 2,
        opacity: 0.6,
      }}
    >
      <ConstructionIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      <Typography variant="h6" fontWeight={600} textAlign="center">
        {message ?? 'Coming soon'}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Amiri", serif',
          fontSize: '1.8rem',
          color: 'primary.main',
          direction: 'rtl',
        }}
      >
        قريبًا
      </Typography>
    </Box>
  )
}
