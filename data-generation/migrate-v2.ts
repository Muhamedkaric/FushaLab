/**
 * Migrate existing flat item JSONs → new sentences-array format.
 *
 * Reads from:  ../public/data/{category}/{level}/{id}.json
 * Writes to:   ../public/dataV2/{category}/{level}/{id}.json   (migrated — 86%)
 *              ../public/data-pending/{category}/{level}/{id}.json (mismatch — 14%)
 *
 * Items where Arabic / Bosnian / English sentence counts all match get full
 * per-sentence translations.  Items where counts differ are written to
 * data-pending with the original fields intact plus a _pending block explaining
 * the mismatch, so they can be enriched later (AI or manual).
 *
 * Existing data is NEVER modified — this script only creates new files.
 *
 * Usage:
 *   pnpm migrate-v2
 *   pnpm migrate-v2 --dry-run     (print stats, write nothing)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..')
const DATA_DIR = join(ROOT, 'public', 'data')
const V2_DIR = join(ROOT, 'public', 'dataV2')
const PENDING_DIR = join(ROOT, 'public', 'data-pending')

const DRY_RUN = process.argv.includes('--dry-run')

// ── Types ─────────────────────────────────────────────────────────────────────

interface OriginalItem {
  id: string
  category: string
  level: string
  arabic: string
  translation: string
  translationEn: string
  metadata: { difficulty: number; tags: string[] }
}

interface Sentence {
  arabic: string
  translation: string
  translationEn: string
}

interface MigratedItem {
  id: string
  category: string
  level: string
  sentences: Sentence[]
  metadata: { difficulty: number; tags: string[] }
}

interface PendingItem {
  id: string
  category: string
  level: string
  arabic: string
  translation: string
  translationEn: string
  metadata: { difficulty: number; tags: string[] }
  _pending: {
    reason: 'sentence-count-mismatch'
    arabicCount: number
    bosnianCount: number
    englishCount: number
    arabicSentences: string[]
  }
}

interface V2Index {
  items: Array<{
    id: string
    arabic: string // first sentence only — used as list preview
    metadata: { difficulty: number; tags: string[] }
  }>
}

// ── Sentence splitter ─────────────────────────────────────────────────────────

/**
 * Split a text into sentences by punctuation.
 * Keeps the punctuation mark attached to its sentence.
 * Handles Arabic (. ؟ ! ۔) and Latin (. ? !) scripts.
 */
function splitSentences(text: string): string[] {
  // Split AFTER a sentence-ending punctuation mark followed by whitespace.
  // The lookbehind keeps the punctuation with the preceding sentence.
  const parts = text
    .trim()
    .split(/(?<=[.؟!۔?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return parts
}

// ── Migration logic ───────────────────────────────────────────────────────────

function migrateItem(item: OriginalItem): { status: 'ok'; result: MigratedItem } | { status: 'pending'; result: PendingItem } {
  const arSentences = splitSentences(item.arabic)
  const bsSentences = splitSentences(item.translation)
  const enSentences = splitSentences(item.translationEn)

  const arCount = arSentences.length
  const bsCount = bsSentences.length
  const enCount = enSentences.length

  const countsMatch = arCount === bsCount && arCount === enCount

  if (countsMatch) {
    const sentences: Sentence[] = arSentences.map((arabic, i) => ({
      arabic,
      translation: bsSentences[i],
      translationEn: enSentences[i],
    }))

    return {
      status: 'ok',
      result: {
        id: item.id,
        category: item.category,
        level: item.level,
        sentences,
        metadata: item.metadata,
      },
    }
  }

  // Counts don't match — write to pending with diagnostic info
  return {
    status: 'pending',
    result: {
      id: item.id,
      category: item.category,
      level: item.level,
      arabic: item.arabic,
      translation: item.translation,
      translationEn: item.translationEn,
      metadata: item.metadata,
      _pending: {
        reason: 'sentence-count-mismatch',
        arabicCount: arCount,
        bosnianCount: bsCount,
        englishCount: enCount,
        arabicSentences: arSentences,
      },
    },
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

let totalOk = 0
let totalPending = 0
let totalSkipped = 0

const v2IndexMap = new Map<string, V2Index>() // key = "category/level"

const categories = readdirSync(DATA_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)

for (const category of categories) {
  const catDir = join(DATA_DIR, category)
  const levels = readdirSync(catDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)

  for (const level of levels) {
    const levelDir = join(catDir, level)
    const files = readdirSync(levelDir).filter(f => f.endsWith('.json') && f !== 'index.json')

    if (files.length === 0) continue

    let levelOk = 0
    let levelPending = 0

    for (const file of files) {
      const raw = readFileSync(join(levelDir, file), 'utf-8')
      let item: OriginalItem

      try {
        item = JSON.parse(raw) as OriginalItem
      } catch {
        console.warn(`  ⚠  Skipping ${category}/${level}/${file} — invalid JSON`)
        totalSkipped++
        continue
      }

      // Skip files that don't have the expected flat structure
      if (!item.arabic || !item.translation || !item.translationEn) {
        console.warn(`  ⚠  Skipping ${category}/${level}/${file} — missing required fields`)
        totalSkipped++
        continue
      }

      const { status, result } = migrateItem(item)

      if (DRY_RUN) {
        if (status === 'ok') levelOk++
        else levelPending++
        continue
      }

      if (status === 'ok') {
        const outDir = join(V2_DIR, category, level)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(join(outDir, file), JSON.stringify(result, null, 2))
        levelOk++

        // Accumulate index entry
        const key = `${category}/${level}`
        if (!v2IndexMap.has(key)) v2IndexMap.set(key, { items: [] })
        v2IndexMap.get(key)!.items.push({
          id: result.id,
          arabic: result.sentences[0].arabic,
          metadata: result.metadata,
        })
      } else {
        const outDir = join(PENDING_DIR, category, level)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(join(outDir, file), JSON.stringify(result, null, 2))
        levelPending++
      }
    }

    const tag = DRY_RUN ? '(dry)' : ''
    console.log(
      `  ${category}/${level}: ✓ ${levelOk} migrated  ⏳ ${levelPending} pending ${tag}`
    )
    totalOk += levelOk
    totalPending += levelPending
  }
}

// Write index.json files for dataV2
if (!DRY_RUN) {
  for (const [key, index] of v2IndexMap.entries()) {
    const [category, level] = key.split('/')
    const indexPath = join(V2_DIR, category, level, 'index.json')
    writeFileSync(indexPath, JSON.stringify(index, null, 2))
  }
  console.log(`\n✅ index.json files written for ${v2IndexMap.size} category/level pairs`)
}

console.log(`
📊 Summary${DRY_RUN ? ' (dry run — nothing written)' : ''}:
   ✓ Migrated to dataV2    : ${totalOk}
   ⏳ Pending (mismatch)    : ${totalPending}
   ⚠  Skipped (bad data)   : ${totalSkipped}
   📦 Total                 : ${totalOk + totalPending + totalSkipped}
`)
