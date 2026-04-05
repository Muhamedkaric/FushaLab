import { useState } from 'react'
import { Box, Popover, Typography, Divider, IconButton, Tooltip } from '@mui/material'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import type { Sentence, WordAnnotation } from '@/types/content'
import { toggleHarakat } from '@/utils/diacritics'
import { useI18n } from '@/i18n'

const PUNCT = /[،؟!.«»():؛\u0022\u0027]/g

function stripPunct(w: string) {
  return w.replace(PUNCT, '').trim()
}

interface WordChipProps {
  token: string // rendered text (with or without harakat)
  rawToken: string // original form for lookup
  annotation: WordAnnotation | null
  active: boolean
  onClick: (el: HTMLElement) => void
}

function WordChip({ token, annotation, active, onClick }: WordChipProps) {
  return (
    <Box
      component="span"
      onClick={e => annotation && onClick(e.currentTarget as HTMLElement)}
      sx={{
        cursor: annotation ? 'pointer' : 'default',
        borderRadius: '3px',
        px: 0.25,
        transition: 'background-color 0.15s',
        bgcolor: active ? 'rgba(201,168,76,0.35)' : annotation ? 'transparent' : 'transparent',
        '&:hover': annotation ? { bgcolor: 'rgba(201,168,76,0.18)' } : {},
        borderBottom: annotation ? '1px dotted' : 'none',
        borderColor: 'primary.main',
      }}
    >
      {token}
    </Box>
  )
}

interface Props {
  sentence: Sentence
  fontSize: string
  showHarakat: boolean
  lang: 'bs' | 'en'
  isSaved?: (ann: WordAnnotation) => boolean
  onToggleSave?: (ann: WordAnnotation) => void
}

export function WordTapText({
  sentence,
  fontSize,
  showHarakat,
  lang,
  isSaved,
  onToggleSave,
}: Props) {
  const { t } = useI18n()
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [annotation, setAnnotation] = useState<WordAnnotation | null>(null)

  // Build lookup map from exact form → annotation
  const lookup = new Map<string, WordAnnotation>()
  for (const w of sentence.words ?? []) {
    lookup.set(stripPunct(w.w), w)
  }

  const handleClick = (el: HTMLElement, rawToken: string, ann: WordAnnotation) => {
    if (activeWord === rawToken) {
      setActiveWord(null)
      setAnchor(null)
      setAnnotation(null)
    } else {
      setActiveWord(rawToken)
      setAnchor(el)
      setAnnotation(ann)
    }
  }

  const displayText = toggleHarakat(sentence.arabic, showHarakat)
  const tokens = displayText.split(' ')
  const rawTokens = sentence.arabic.split(' ')

  return (
    <>
      <Box
        component="span"
        sx={{
          fontFamily: '"Amiri", serif',
          fontSize,
          lineHeight: 2,
          letterSpacing: '0.02em',
          direction: 'rtl',
          textAlign: 'right',
          color: 'text.primary',
          display: 'block',
        }}
        dir="rtl"
      >
        {tokens.map((token, i) => {
          const rawToken = stripPunct(rawTokens[i] ?? token)
          const ann = lookup.get(rawToken) ?? null
          const isActive = activeWord === rawToken && ann !== null
          return (
            <span key={i}>
              <WordChip
                token={token}
                rawToken={rawToken}
                annotation={ann}
                active={isActive}
                onClick={el => ann && handleClick(el, rawToken, ann)}
              />
              {i < tokens.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </Box>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null)
          setActiveWord(null)
          setAnnotation(null)
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 4,
              minWidth: 160,
              maxWidth: 240,
              p: 1.5,
            },
          },
        }}
      >
        {annotation && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                {/* Lemma (dictionary form) — primary display */}
                <Typography
                  sx={{
                    fontFamily: '"Amiri", serif',
                    fontSize: '1.6rem',
                    direction: 'rtl',
                    textAlign: 'right',
                    lineHeight: 1.6,
                    color: 'primary.main',
                    fontWeight: 700,
                  }}
                  dir="rtl"
                >
                  {annotation.lemma ?? annotation.w}
                </Typography>

                {/* Show inflected form if different from lemma */}
                {annotation.lemma && annotation.lemma !== annotation.w && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'right', direction: 'rtl' }}
                    dir="rtl"
                  >
                    {t.savedWords.seenInText}: {annotation.w}
                  </Typography>
                )}

                {annotation.root && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'right', direction: 'rtl', mb: 0.5 }}
                    dir="rtl"
                  >
                    {annotation.root}
                  </Typography>
                )}
              </Box>

              {onToggleSave && (
                <Tooltip
                  title={isSaved?.(annotation) ? t.savedWords.unsaveWord : t.savedWords.saveWord}
                >
                  <IconButton
                    size="small"
                    onClick={() => onToggleSave(annotation)}
                    color={isSaved?.(annotation) ? 'primary' : 'default'}
                    sx={{ mt: 0.5, flexShrink: 0 }}
                  >
                    {isSaved?.(annotation) ? (
                      <BookmarkIcon fontSize="small" />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Divider sx={{ my: 0.75 }} />

            <Typography variant="body2" fontWeight={600}>
              {lang === 'en' ? annotation.en : annotation.bs}
            </Typography>
            {lang === 'bs' && annotation.en !== annotation.bs && (
              <Typography variant="caption" color="text.secondary">
                {annotation.en}
              </Typography>
            )}
          </Box>
        )}
      </Popover>
    </>
  )
}
