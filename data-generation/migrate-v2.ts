/**
 * Migrate existing flat item JSONs → new sentences-array format.
 *
 * Pass 1 — pure regex (no API cost):
 *   Split Arabic / Bosnian / English by sentence-ending punctuation.
 *   Handles: bracket citations [...], quote-period ('word.'), Bosnian abbreviations (br. N).
 *
 * Pass 2 — Gemini AI (only for items regex can't align):
 *   Sends stuck items to Gemini to produce matching sentence pairs.
 *   Expected to be ~10-20 items max.
 *
 * Output:
 *   public/dataV2/{category}/{level}/{id}.json   — all migrated items
 *   public/dataV2/{category}/{level}/index.json  — lightweight index (first sentence preview)
 *
 * Existing data is NEVER modified.
 *
 * Usage:
 *   pnpm migrate-v2                 — incremental: skips already-migrated items, regex + AI for new/stuck
 *   pnpm migrate-v2 --fresh         — wipe dataV2 and start from scratch
 *   pnpm migrate-v2 --dry-run       — print stats, write nothing
 *   pnpm migrate-v2 --regex-only    — skip AI pass (write regex matches only)
 */

import 'dotenv/config'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..')
const DATA_DIR = join(ROOT, 'public', 'data')
const V2_DIR = join(ROOT, 'public', 'dataV2')

const DRY_RUN = process.argv.includes('--dry-run')
const REGEX_ONLY = process.argv.includes('--regex-only')
const FRESH = process.argv.includes('--fresh')

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

interface V2Index {
  items: Array<{
    id: string
    arabic: string
    metadata: { difficulty: number; tags: string[] }
  }>
}

// ── Sentence splitter (v3) ────────────────────────────────────────────────────

/**
 * Split a text into sentences.
 *
 * Strategy:
 *   1. Mask content inside [...] so internal dots don't create false splits
 *      e.g. [رَوَاهُ الْبُخَارِيُّ] or [hadis br. 1]
 *   2. Mask common abbreviations followed by a digit or lowercase letter
 *      e.g. "br. 1", "dr. Smith" → won't split
 *   3. Split on sentence-ending punctuation followed by optional closing quote,
 *      then whitespace
 *   4. Restore masked content
 */
function splitSentences(text: string): string[] {
  let masked = text.trim()

  // 1. Mask bracket contents (citations, hadith numbers, e.g. [رَوَاهُ الْبُخَارِيُّ] or [hadis br. 1])
  masked = masked.replace(/\[([^\]]*)\]/g, (_, inner) => '[' + inner.replace(/\./g, '\u00B7') + ']')

  // 2. Mask abbreviations followed by digit or lowercase (not a new sentence)
  //    Covers: br. / dr. / mr. / str. / čl. / tzv. / sl. / npr. / No. / Fig.
  masked = masked.replace(
    /\b(br|dr|mr|str|čl|tzv|sl|npr|no|fig|vs|etc|prof|approx)\.\s+(?=[a-záčćžšđA-ZÁČĆŽŠĐ0-9\u0600-\u06FF])/gi,
    (_, abbr) => abbr + '\u00B7 '
  )

  // 3. Split on: punct + optional closing quote/guillemet + whitespace
  const parts = masked.split(/([.؟!۔?]['"»]?)\s+/)

  const raw: string[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const body = parts[i] ?? ''
    const punct = parts[i + 1] ?? ''
    const sentence = (body + punct).trim()
    if (sentence) raw.push(sentence)
  }
  if (raw.length === 0 && masked.trim()) raw.push(masked.trim())

  // 4. Restore masked dots
  const restored = raw.map(s => s.replace(/\u00B7/g, '.'))

  // 5. Merge citation-only segments (e.g. "[Bilježi Buhari...]." standing alone)
  //    back into the preceding sentence — they are not independent sentences
  const merged: string[] = []
  for (const s of restored) {
    if (/^\[.*\]\.?$/.test(s.trim()) && merged.length > 0) {
      merged[merged.length - 1] += ' ' + s
    } else {
      merged.push(s)
    }
  }

  return merged
}

// ── Try regex migration ───────────────────────────────────────────────────────

function tryRegexMigration(item: OriginalItem): Sentence[] | null {
  const ar = splitSentences(item.arabic)
  const bs = splitSentences(item.translation)
  const en = splitSentences(item.translationEn)

  if (ar.length === bs.length && ar.length === en.length) {
    return ar.map((arabic, i) => ({
      arabic,
      translation: bs[i],
      translationEn: en[i],
    }))
  }
  return null
}

// ── Gemini AI migration ───────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
let keyIndex = 0

function buildAiPrompt(item: OriginalItem): string {
  return `You are given an Arabic text and its Bosnian and English translations.
Split them into matching sentence-by-sentence pairs. Every Arabic sentence must have exactly one Bosnian and one English translation.

Arabic:
${item.arabic}

Bosnian translation:
${item.translation}

English translation:
${item.translationEn}

Return ONLY a valid JSON array — no explanation, no markdown, no code blocks.
Format:
[
  { "arabic": "...", "translation": "...(Bosnian)", "translationEn": "...(English)" }
]`
}

async function migrateWithAI(item: OriginalItem): Promise<Sentence[]> {
  if (apiKeys.length === 0) throw new Error('GEMINI_API_KEYS not set')

  const prompt = buildAiPrompt(item)

  for (let attempt = 0; attempt < apiKeys.length * 2; attempt++) {
    const key = apiKeys[keyIndex % apiKeys.length]
    keyIndex++

    const gemini = new GoogleGenerativeAI(key).getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    })

    try {
      const result = await gemini.generateContent(prompt)
      const raw = result.response.text().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const parsed = JSON.parse(raw) as Sentence[]
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty response')
      return parsed
    } catch (err) {
      if (err instanceof GoogleGenerativeAIFetchError && err.status === 429) {
        console.log(`    🔑 Rate limited — rotating key...`)
        await new Promise(r => setTimeout(r, 5000))
        continue
      }
      throw err
    }
  }

  throw new Error('All API keys exhausted')
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🕌 FushaLab — Migrate to dataV2`)
console.log(`   Mode: ${DRY_RUN ? 'dry run' : REGEX_ONLY ? 'regex only' : 'regex + AI for stuck'}`)
if (FRESH) console.log(`   --fresh: wiping existing dataV2`)

if (!DRY_RUN) {
  if (FRESH) rmSync(V2_DIR, { recursive: true, force: true })
  mkdirSync(V2_DIR, { recursive: true })
}

let totalRegex = 0
let totalAI = 0
let totalSkipped = 0

const v2IndexMap = new Map<string, V2Index>()
const stuck: OriginalItem[] = []

// ── Pass 1: regex ─────────────────────────────────────────────────────────────

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

    let levelRegex = 0
    let levelStuck = 0

    for (const file of files) {
      let item: OriginalItem
      try {
        item = JSON.parse(readFileSync(join(levelDir, file), 'utf-8')) as OriginalItem
      } catch {
        totalSkipped++
        continue
      }

      if (!item.arabic || !item.translation || !item.translationEn) {
        totalSkipped++
        continue
      }

      // Skip if already migrated in a previous run
      if (!FRESH && !DRY_RUN && existsSync(join(V2_DIR, item.category, item.level, file))) {
        totalRegex++
        continue
      }

      const sentences = tryRegexMigration(item)
      if (sentences) {
        if (!DRY_RUN) writeV2Item(item, sentences, file)
        levelRegex++
        totalRegex++
      } else {
        stuck.push(item)
        levelStuck++
      }
    }

    console.log(`  ${category}/${level}: ✓ ${levelRegex} regex  ⏳ ${levelStuck} stuck`)
  }
}

console.log(`\n📊 Pass 1 (regex): ${totalRegex} migrated, ${stuck.length} stuck`)

// ── Pass 2: AI for stuck items ────────────────────────────────────────────────

if (!DRY_RUN && !REGEX_ONLY && stuck.length > 0) {
  console.log(`\n🤖 Pass 2: AI migration for ${stuck.length} stuck items...\n`)

  for (const item of stuck) {
    process.stdout.write(`  ${item.id} ... `)
    try {
      const sentences = await migrateWithAI(item)
      const file = `${item.id}.json`
      writeV2Item(item, sentences, file)
      console.log(`✓ ${sentences.length} sentences (AI)`)
      totalAI++
      await new Promise(r => setTimeout(r, 2000))
    } catch (err) {
      console.log(`✗ failed: ${err instanceof Error ? err.message : err}`)
      totalSkipped++
    }
  }
} else if (REGEX_ONLY && stuck.length > 0) {
  console.log(`\n⏭  Skipping AI pass (--regex-only). ${stuck.length} items not migrated.`)
  console.log('   Stuck item IDs:')
  stuck.forEach(i => console.log(`     ${i.id}`))
}

// ── Write index files ─────────────────────────────────────────────────────────

if (!DRY_RUN) {
  for (const [key, index] of v2IndexMap.entries()) {
    const [category, level] = key.split('/')
    writeFileSync(join(V2_DIR, category, level, 'index.json'), JSON.stringify(index, null, 2))
  }
  // Clean up old data-pending — no longer needed
  rmSync(join(ROOT, 'public', 'data-pending'), { recursive: true, force: true })
  console.log(`\n✅ index.json written for ${v2IndexMap.size} pairs. data-pending removed.`)
}

console.log(`
📊 Final summary${DRY_RUN ? ' (dry run)' : ''}:
   ✓ Regex-migrated  : ${totalRegex}
   🤖 AI-migrated    : ${totalAI}
   ✗ Skipped         : ${totalSkipped}
   ⏳ Still stuck     : ${DRY_RUN || REGEX_ONLY ? stuck.length : 0}
   📦 Total processed : ${totalRegex + totalAI + totalSkipped + (DRY_RUN || REGEX_ONLY ? stuck.length : 0)}
`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function writeV2Item(item: OriginalItem, sentences: Sentence[], file: string) {
  const outDir = join(V2_DIR, item.category, item.level)
  mkdirSync(outDir, { recursive: true })

  const migrated: MigratedItem = {
    id: item.id,
    category: item.category,
    level: item.level,
    sentences,
    metadata: item.metadata,
  }
  writeFileSync(join(outDir, file), JSON.stringify(migrated, null, 2))

  const key = `${item.category}/${item.level}`
  if (!v2IndexMap.has(key)) v2IndexMap.set(key, { items: [] })
  v2IndexMap.get(key)!.items.push({
    id: migrated.id,
    arabic: migrated.sentences[0].arabic,
    metadata: migrated.metadata,
  })
}
