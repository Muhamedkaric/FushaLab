import { Box, Typography, Container, Stack } from '@mui/material'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import { ComingSoon } from '@/components/ComingSoon'
import { useI18n } from '@/i18n'

export function ListeningPage() {
  const { t } = useI18n()

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={4}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
          }}
        >
          <HeadphonesIcon />
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {t.listening.title}
        </Typography>
      </Stack>

      <ComingSoon message={t.listening.comingSoon} />
    </Container>
  )
}
