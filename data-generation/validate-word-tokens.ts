/**
 * Validates that every word annotation's `w` field appears verbatim as a
 * space-separated token in its parent sentence.
 *
 * Flags mismatches (e.g. "وَدَّعَتْ" annotated but sentence has "وَوَدَّعَتْ").
 *
 * Run: pnpm validate-tokens
 * Output: list of files + sentences with mismatched w fields
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../public/data')

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

const LEVELS = (process.argv[2] ?? 'B1').split(',')
console.log(`\n🔍 Validating word tokens for levels: ${LEVELS.join(', ')}\n`)

const files = collectFiles(LEVELS)
let totalMismatches = 0

for (const filePath of files) {
  let item: ContentItem
  try {
    item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem
  } catch {
    continue
  }

  for (let si = 0; si < item.sentences.length; si++) {
    const sentence = item.sentences[si]
    if (!sentence.words || sentence.words.length === 0) continue

    // Strip trailing punctuation from arabic tokens for matching
    const tokens = new Set(
      sentence.arabic.split(/\s+/).map(t => t.replace(/[.،؟!:]+$/, ''))
    )

    for (const word of sentence.words) {
      if (!tokens.has(word.w)) {
        // Check if stripped base (without وَ/فَ prefix) matches a token — that's the bug
        const strippedPrefix = word.w.replace(/^[وَفَ]+/, '')
        const possibleToken = [...tokens].find(t => t.endsWith(strippedPrefix) || t.includes(word.w))
        console.log(`MISMATCH  ${item.id} sentence[${si}]`)
        console.log(`  arabic : ${sentence.arabic}`)
        console.log(`  w      : "${word.w}"  →  token in sentence: "${possibleToken ?? '?'}"`)
        console.log()
        totalMismatches++
      }
    }
  }
}

if (totalMismatches === 0) {
  console.log('✅ No mismatches found — all w fields match sentence tokens.')
} else {
  console.log(`⚠️  Total mismatches: ${totalMismatches}`)
}
