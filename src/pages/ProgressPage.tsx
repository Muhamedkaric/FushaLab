import { Box, Typography, Container, Stack } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import { ComingSoon } from '@/components/ComingSoon'
import { useI18n } from '@/i18n'

export function ProgressPage() {
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
          <InsightsIcon />
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {t.progress.title}
        </Typography>
      </Stack>

      <ComingSoon message={t.progress.noProgress} />
    </Container>
  )
}
