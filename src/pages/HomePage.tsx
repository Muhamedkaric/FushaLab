import { Box, Typography, Stack, Chip, Card, CardActionArea, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import SchoolIcon from '@mui/icons-material/School'
import FlightIcon from '@mui/icons-material/Flight'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import MosqueIcon from '@mui/icons-material/Mosque'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import type { Category, Level } from '@/types/content'
import { useI18n } from '@/i18n'

const ALL_LEVELS: Level[] = ['B1', 'B2', 'C1', 'C2']

const CATEGORIES: Array<{ id: Category; icon: React.ReactNode; levels: Level[] }> = [
  { id: 'travel', icon: <FlightIcon />, levels: ALL_LEVELS },
  { id: 'culture', icon: <TheaterComedyIcon />, levels: ALL_LEVELS },
  { id: 'news', icon: <NewspaperIcon />, levels: ALL_LEVELS },
  { id: 'literature', icon: <MenuBookIcon />, levels: ALL_LEVELS },
  { id: 'religion', icon: <MosqueIcon />, levels: ALL_LEVELS },
]

const LEVEL_COLORS: Record<Level, 'primary' | 'secondary' | 'warning' | 'error'> = {
  B1: 'primary',
  B2: 'secondary',
  C1: 'warning',
  C2: 'error',
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

export function HomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Box>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 }, mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SchoolIcon sx={{ fontSize: 38, color: 'primary.contrastText' }} />
            </Box>
          </Box>

          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ fontFamily: '"Amiri", serif', mb: 1, fontSize: { xs: '1.9rem', sm: '2.5rem' } }}
          >
            {t.home.hero}
          </Typography>

          <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 1 }}>
            {t.home.heroSub}
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Amiri", serif',
              fontSize: '1.3rem',
              color: 'primary.main',
              direction: 'rtl',
              mt: 2,
            }}
          >
            تَعَلَّمِ الْعَرَبِيَّةَ الْفُصْحَى
          </Typography>
        </Box>
      </motion.div>

      {/* Categories */}
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t.home.chooseCategory}
      </Typography>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={2}>
          {CATEGORIES.map(cat => (
            <Grid key={cat.id} size={{ xs: 12, sm: 6 }} component="div">
              <motion.div variants={itemVariants}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 20px rgba(201, 168, 76, 0.15)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() =>
                      void navigate({
                        to: '/learn/$category/$level',
                        params: { category: cat.id, level: cat.levels[0] },
                      })
                    }
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Stack direction="row" alignItems="flex-start" gap={2}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'primary.contrastText',
                          }}
                        >
                          {cat.icon}
                        </Box>

                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                            {t.categories[cat.id]}
                          </Typography>
                          <Stack direction="row" gap={0.5} flexWrap="wrap">
                            {cat.levels.map(level => (
                              <Chip
                                key={level}
                                label={level}
                                size="small"
                                color={LEVEL_COLORS[level]}
                                variant="outlined"
                                clickable
                                onClick={e => {
                                  e.stopPropagation()
                                  void navigate({
                                    to: '/learn/$category/$level',
                                    params: { category: cat.id, level },
                                  })
                                }}
                                sx={{ fontSize: '0.7rem', height: 22 }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  )
}
