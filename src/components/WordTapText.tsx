import { useState } from 'react'
import { Box, Popover, Typography, Divider, IconButton, Tooltip } from '@mui/material'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import type { Sentence, WordAnnotation } from '@/types/content'
import { lookupParticle, type ParticleEntry } from '@/data/particles'
import { useDictionary } from '@/context/DictionaryContext'
import { toggleHarakat } from '@/utils/diacritics'
import { useI18n } from '@/i18n'

const PUNCT = /[،؟!.«»():؛\u0022\u0027]/g

function stripPunct(w: string) {
  return w.replace(PUNCT, '').trim()
}

// A word can have a full annotation (content word) or a particle entry (function word)
type AnyAnnotation = { kind: 'word'; ann: WordAnnotation } | { kind: 'particle'; entry: ParticleEntry; w: string }

interface WordChipProps {
  token: string
  annotation: AnyAnnotation | null
  active: boolean
  onClick: (el: HTMLElement) => void
}

function WordChip({ token, annotation, active, onClick }: WordChipProps) {
  const isParticle = annotation?.kind === 'particle'
  return (
    <Box
      component="span"
      onClick={e => annotation && onClick(e.currentTarget as HTMLElement)}
      sx={{
        cursor: annotation ? 'pointer' : 'default',
        borderRadius: '3px',
        px: 0.25,
        transition: 'background-color 0.15s',
        bgcolor: active ? 'rgba(201,168,76,0.35)' : 'transparent',
        '&:hover': annotation ? { bgcolor: 'rgba(201,168,76,0.18)' } : {},
        // Content words: gold dotted underline. Particles: subtle grey dotted.
        borderBottom: annotation ? '1px dotted' : 'none',
        borderColor: isParticle ? 'text.disabled' : 'primary.main',
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
  const { lookup: dictLookup } = useDictionary()
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [activeAnnotation, setActiveAnnotation] = useState<AnyAnnotation | null>(null)

  // Build lookup map from exact form → annotation
  const lookup = new Map<string, WordAnnotation>()
  for (const w of sentence.words ?? []) {
    lookup.set(stripPunct(w.w), w)
  }

  function resolveAnnotation(rawToken: string): AnyAnnotation | null {
    const wordAnn = lookup.get(rawToken)
    if (wordAnn) return { kind: 'word', ann: wordAnn }
    const particle = lookupParticle(rawToken)
    if (particle) return { kind: 'particle', entry: particle, w: rawToken }
    return null
  }

  const handleClick = (el: HTMLElement, rawToken: string, resolved: AnyAnnotation) => {
    if (activeWord === rawToken) {
      setActiveWord(null)
      setAnchor(null)
      setActiveAnnotation(null)
    } else {
      setActiveWord(rawToken)
      setAnchor(el)
      setActiveAnnotation(resolved)
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
          const resolved = resolveAnnotation(rawToken)
          const isActive = activeWord === rawToken && resolved !== null
          return (
            <span key={i}>
              <WordChip
                token={token}
                annotation={resolved}
                active={isActive}
                onClick={el => resolved && handleClick(el, rawToken, resolved)}
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
          setActiveAnnotation(null)
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
        {activeAnnotation?.kind === 'word' && (() => {
          const ann = activeAnnotation.ann
          const dictEntry = ann.lemma ? dictLookup(ann.lemma) : null
          const bs = dictEntry?.bs ?? ''
          const en = dictEntry?.en ?? ''
          const root = dictEntry?.root
          return (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontFamily: '"Amiri", serif', fontSize: '1.6rem', direction: 'rtl', textAlign: 'right', lineHeight: 1.6, color: 'primary.main', fontWeight: 700 }}
                    dir="rtl"
                  >
                    {ann.lemma ?? ann.w}
                  </Typography>
                  {ann.lemma && ann.lemma !== ann.w && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', direction: 'rtl' }} dir="rtl">
                      {t.savedWords.seenInText}: {ann.w}
                    </Typography>
                  )}
                  {root && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', direction: 'rtl', mb: 0.5 }} dir="rtl">
                      {root}
                    </Typography>
                  )}
                </Box>
                {onToggleSave && (
                  <Tooltip title={isSaved?.(ann) ? t.savedWords.unsaveWord : t.savedWords.saveWord}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSave(ann)}
                      color={isSaved?.(ann) ? 'primary' : 'default'}
                      sx={{ mt: 0.5, flexShrink: 0 }}
                    >
                      {isSaved?.(ann) ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Divider sx={{ my: 0.75 }} />
              {(bs || en) ? (
                <>
                  <Typography variant="body2" fontWeight={600}>
                    {lang === 'en' ? en : bs}
                  </Typography>
                  {lang === 'bs' && en && en !== bs && (
                    <Typography variant="caption" color="text.secondary">{en}</Typography>
                  )}
                </>
              ) : (
                <Typography variant="caption" color="text.disabled">{ann.lemma ?? ann.w}</Typography>
              )}
            </Box>
          )
        })()}

        {activeAnnotation?.kind === 'particle' && (
          <Box>
            <Typography
              sx={{ fontFamily: '"Amiri", serif', fontSize: '1.6rem', direction: 'rtl', textAlign: 'right', lineHeight: 1.6, color: 'text.secondary', fontWeight: 700 }}
              dir="rtl"
            >
              {activeAnnotation.w}
            </Typography>
            <Divider sx={{ my: 0.75 }} />
            <Typography variant="body2" fontWeight={600}>
              {lang === 'en' ? activeAnnotation.entry.en : activeAnnotation.entry.bs}
            </Typography>
            {lang === 'bs' && activeAnnotation.entry.en !== activeAnnotation.entry.bs && (
              <Typography variant="caption" color="text.secondary">{activeAnnotation.entry.en}</Typography>
            )}
          </Box>
        )}
      </Popover>
    </>
  )
}
