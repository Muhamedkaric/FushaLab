import { useState, useRef } from 'react'
import { Box, Popover, Typography, ButtonBase, Tooltip, Divider } from '@mui/material'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import { useFontScale, type FontScale } from '@/context/FontScaleContext'

const SIZES: { value: FontScale; label: string; arSize: string; bsLabel: string }[] = [
  { value: 0.9, label: 'S', arSize: '1rem', bsLabel: 'Sitno' },
  { value: 1, label: 'M', arSize: '1.15rem', bsLabel: 'Zadano' },
  { value: 1.15, label: 'L', arSize: '1.3rem', bsLabel: 'Veće' },
  { value: 1.3, label: 'XL', arSize: '1.5rem', bsLabel: 'Veliko' },
]

export function FontSizeButton() {
  const { scale, setScale } = useFontScale()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <Tooltip title="Veličina teksta">
        <ButtonBase
          ref={anchorRef}
          onClick={() => setOpen(v => !v)}
          sx={{
            borderRadius: 1.5,
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: open ? 'primary.main' : 'text.secondary',
            border: '1px solid',
            borderColor: open ? 'primary.main' : 'divider',
            transition: 'all 0.15s',
            '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
          }}
        >
          <TextFieldsIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1, fontSize: '0.7rem' }}>
            {SIZES.find(s => s.value === scale)?.label ?? 'M'}
          </Typography>
        </ButtonBase>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: -1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              p: 1.5,
              width: 240,
              boxShadow: 4,
            },
          },
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}
        >
          Veličina teksta
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {SIZES.map(size => {
            const active = scale === size.value
            return (
              <ButtonBase
                key={size.value}
                onClick={() => {
                  setScale(size.value)
                  setOpen(false)
                }}
                sx={{
                  flex: 1,
                  flexDirection: 'column',
                  gap: 0.25,
                  py: 1,
                  borderRadius: 1.5,
                  border: '1.5px solid',
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'primary.contrastText' : 'text.secondary',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: active ? 'primary.contrastText' : 'primary.main',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: size.arSize,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  A
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.8 }}
                >
                  {size.bsLabel}
                </Typography>
              </ButtonBase>
            )
          })}
        </Box>

        <Divider sx={{ my: 1.25 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Pregled:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
              Bosanski
            </Typography>
            <Typography
              sx={{ fontFamily: '"Amiri", serif', fontSize: '1.1rem', lineHeight: 1 }}
              dir="rtl"
            >
              عَرَبِيٌّ
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
