/**
 * Rebuild public/data/dictionary.json from all annotated content files.
 *
 * Reads every content JSON file across all levels, collects all unique lemmas
 * from the words[] arrays, and writes dictionary.json.
 * No API calls needed — data comes directly from annotated files.
 *
 * Run after backfill-annotations is complete:
 *   pnpm rebuild-dictionary
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../public/data')
const DICT_PATH = resolve(import.meta.dirname, '../public/data/dictionary.json')

interface WordAnnotation {
  w: string
  lemma?: string
  root?: string
  bs: string
  en: string
}

interface DictionaryEntry {
  lemma: string
  root?: string
  bs: string
  en: string
}

// ── Collect all annotated files ───────────────────────────────────────────────

function collectFiles(): string[] {
  const results: string[] = []
  for (const cat of readdirSync(DATA_DIR)) {
    const catDir = join(DATA_DIR, cat)
    try { if (!statSync(catDir).isDirectory()) continue } catch { continue }
    if (cat === 'grammar') continue
    for (const level of readdirSync(catDir)) {
      const levelDir = join(catDir, level)
      try { if (!statSync(levelDir).isDirectory()) continue } catch { continue }
      for (const file of readdirSync(levelDir)) {
        if (!file.endsWith('.json') || file === 'index.json') continue
        results.push(join(levelDir, file))
      }
    }
  }
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n📖 Rebuilding dictionary.json from annotated content files...\n')

const files = collectFiles()
console.log(`Found ${files.length} content files`)

// Load existing dictionary to preserve any manual edits
const existing: Record<string, DictionaryEntry> = existsSync(DICT_PATH)
  ? (JSON.parse(readFileSync(DICT_PATH, 'utf-8')) as Record<string, DictionaryEntry>)
  : {}

const dictionary: Record<string, DictionaryEntry> = { ...existing }
let newEntries = 0
let updatedEntries = 0
let filesWithWords = 0

for (const f of files) {
  let item: { sentences?: Array<{ words?: WordAnnotation[] }> }
  try {
    item = JSON.parse(readFileSync(f, 'utf-8'))
  } catch {
    continue
  }
  if (!Array.isArray(item.sentences)) continue

  let hasWords = false
  for (const sentence of item.sentences) {
    for (const word of sentence.words ?? []) {
      if (!word.lemma) continue
      hasWords = true
      const key = word.lemma

      if (!dictionary[key]) {
        dictionary[key] = {
          lemma: word.lemma,
          ...(word.root ? { root: word.root } : {}),
          bs: word.bs,
          en: word.en,
        }
        newEntries++
      } else if (!existing[key]) {
        // Already seen in this run — update if we get a root we didn't have
        if (word.root && !dictionary[key].root) {
          dictionary[key].root = word.root
          updatedEntries++
        }
      }
    }
  }
  if (hasWords) filesWithWords++
}

// Sort by lemma for stable diffs
const sorted = Object.fromEntries(
  Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b, 'ar'))
)

writeFileSync(DICT_PATH, JSON.stringify(sorted, null, 2))

console.log(`\n✅ Done!`)
console.log(`   Files with annotations : ${filesWithWords} / ${files.length}`)
console.log(`   Dictionary entries     : ${Object.keys(sorted).length}`)
console.log(`   New entries added      : ${newEntries}`)
console.log(`   Existing entries kept  : ${Object.keys(existing).length}`)
console.log(`\n   Written to: public/data/dictionary.json`)
