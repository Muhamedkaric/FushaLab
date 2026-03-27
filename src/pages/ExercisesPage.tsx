import { Box, Typography, Container, Stack } from '@mui/material'
import QuizIcon from '@mui/icons-material/Quiz'
import { ComingSoon } from '@/components/ComingSoon'
import { useI18n } from '@/i18n'

export function ExercisesPage() {
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
          <QuizIcon />
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {t.exercises.title}
        </Typography>
      </Stack>

      <ComingSoon message={t.exercises.comingSoon} />
    </Container>
  )
}
