/**
 * Fixes word annotation `w` fields that don't exactly match their sentence tokens.
 *
 * The backfill script produced annotations where Gemini stripped attached prefixes
 * (وَ، فَ، لِ، بِ، كَ) from content words. E.g. sentence has "وَيَشْرَبُ" but
 * w field says "يَشْرَبُ". This script finds the correct token and updates w.
 *
 * Auto-fixes cases with a single unambiguous match.
 * Reports ambiguous cases for manual review.
 *
 * Run: pnpm fix-tokens
 * Dry run: pnpm fix-tokens --dry-run
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../public/data')
const DRY_RUN = process.argv.includes('--dry-run')
const LEVELS = (process.argv.find(a => a.startsWith('--levels='))?.split('=')[1] ?? 'B1').split(',')

interface WordAnnotation {
  w: string
  lemma?: string
}

interface Sentence {
  arabic: string
  words?: WordAnnotation[]
}

interface ContentItem {
  id: string
  sentences: Sentence[]
}

function collectFiles(levels: string[]): string[] {
  const results: string[] = []
  const categories = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(join(DATA_DIR, d)).isDirectory() } catch { return false }
  })
  for (const level of levels) {
    for (const cat of categories) {
      const dir = join(DATA_DIR, cat, level)
      if (!existsSync(dir)) continue
      const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json')
      for (const f of files) results.push(join(dir, f))
    }
  }
  return results
}

// Strip leading/trailing punctuation from a token (guillemets, brackets, periods, etc.)
function stripPunct(token: string): string {
  return token.replace(/^[«»"'([\]{}\-–—،.؟!:]+/, '').replace(/[«»"')\]{}،.؟!:]+$/, '')
}

console.log(`\n🔧 FushaLab Word Token Fix (levels: ${LEVELS.join(', ')})`)
if (DRY_RUN) console.log('   DRY RUN — no files will be modified')
console.log()

const files = collectFiles(LEVELS)
let totalFixed = 0
let totalAmbiguous = 0
let totalAlreadyOk = 0
let filesModified = 0

for (const filePath of files) {
  let item: ContentItem
  try {
    item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem
  } catch {
    continue
  }

  let fileModified = false

  for (let si = 0; si < item.sentences.length; si++) {
    const sentence = item.sentences[si]
    if (!sentence.words || sentence.words.length === 0) continue

    // Build token set — both raw and stripped of punctuation
    const rawTokens = sentence.arabic.split(/\s+/)
    const strippedTokens = rawTokens.map(stripPunct)

    for (let wi = 0; wi < sentence.words.length; wi++) {
      const word = sentence.words[wi]
      const w = word.w

      // Check if w matches any stripped token exactly
      if (strippedTokens.includes(w)) {
        totalAlreadyOk++
        continue
      }

      // Find tokens where stripping punctuation gives us a word that ENDS WITH w
      // (meaning w is missing a prefix like وَ، فَ، لِ، بِ، كَ)
      let matchingRaw = rawTokens.filter(t => {
        const s = stripPunct(t)
        return s.endsWith(w) && s !== w
      })

      // If no match and w starts with ال, also try stripping ال from w and matching
      // the suffix (handles لِلـ contractions where ال is absorbed: لِلْجَمِيعِ vs الجَمِيعِ)
      if (matchingRaw.length === 0 && (w.startsWith('ال') || w.startsWith('الْ'))) {
        const withoutAl = w.replace(/^ال(?:ْ)?/, '')
        if (withoutAl.length > 1) {
          matchingRaw = rawTokens.filter(t => {
            const s = stripPunct(t)
            return s.endsWith(withoutAl) && s !== w
          })
        }
      }

      if (matchingRaw.length === 1) {
        const corrected = stripPunct(matchingRaw[0])
        if (!DRY_RUN) {
          sentence.words[wi] = { ...word, w: corrected }
          fileModified = true
        }
        console.log(`  FIX  ${item.id}[${si}]: "${w}" → "${corrected}"`)
        totalFixed++
      } else if (matchingRaw.length > 1) {
        console.log(`  AMBIGUOUS  ${item.id}[${si}]: "${w}" could match: ${matchingRaw.map(stripPunct).join(', ')}`)
        console.log(`    arabic: ${sentence.arabic}`)
        totalAmbiguous++
      } else {
        // w not found at all and no prefix match — genuine mismatch or missing word
        // Only report if it's not a common function word (those are intentionally omitted)
        console.log(`  MISSING  ${item.id}[${si}]: "${w}" not found in sentence`)
        console.log(`    arabic: ${sentence.arabic}`)
        totalAmbiguous++
      }
    }
  }

  if (fileModified) {
    writeFileSync(filePath, JSON.stringify(item, null, 2))
    filesModified++
  }
}

console.log(`\n${'─'.repeat(60)}`)
console.log(`Already correct  : ${totalAlreadyOk}`)
console.log(`Fixed            : ${totalFixed}`)
console.log(`Needs review     : ${totalAmbiguous}`)
console.log(`Files modified   : ${filesModified}`)
if (DRY_RUN) console.log('\n(Dry run — run without --dry-run to apply fixes)')
