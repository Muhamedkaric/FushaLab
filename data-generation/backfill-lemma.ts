/**
 * Dictionary builder + B1 lemma backfill
 *
 * 1. Collects all unique word forms across all B1 JSON files (~6000)
 * 2. Deduplicates and batches them (BATCH_SIZE per Gemini call → ~80 calls total)
 * 3. Writes public/data/dictionary.json (the central word database)
 * 4. Applies `lemma` field back to every word annotation in every B1 file
 *
 * Usage:
 *   pnpm build-dictionary
 */

import { config } from 'dotenv'
import { join, resolve } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.reading'), override: false })

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Config ────────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(import.meta.dirname, '..')
const DATA_DIR = join(REPO_ROOT, 'public/data')
const DICT_PATH = join(DATA_DIR, 'dictionary.json')
const BATCH_SIZE = 80
const RETRY_DELAY_MS = 60_000  // wait 1 min if all keys exhausted

const CATEGORIES = [
  'travel', 'culture', 'news', 'literature', 'religion', 'health', 'work',
  'technology', 'social', 'food', 'education', 'finance', 'mysteries',
  'history', 'psychology', 'conversations', 'idioms', 'stories', 'opinions',
]

const RAW_KEYS = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (RAW_KEYS.length === 0) {
  console.error('No GEMINI_API_KEYS in .env')
  process.exit(1)
}

const MODEL_NAME = process.env['READING_MODEL'] ?? 'gemini-flash-latest'
let keyIndex = 0

function getModel() {
  const client = new GoogleGenerativeAI(RAW_KEYS[keyIndex % RAW_KEYS.length])
  return client.getGenerativeModel({ model: MODEL_NAME })
}

function rotateKey() {
  keyIndex = (keyIndex + 1) % RAW_KEYS.length
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WordForm {
  w: string
  root?: string
  bs: string
  en: string
}

export interface DictionaryEntry {
  lemma: string
  root?: string
  bs: string
  en: string
}

export type Dictionary = Record<string, DictionaryEntry>

interface WordAnnotation {
  w: string
  lemma?: string
  root?: string
  bs: string
  en: string
}

interface Sentence {
  arabic: string
  translation: string
  translationEn: string
  words?: WordAnnotation[]
}

interface ContentItem {
  id: string
  sentences: Sentence[]
  metadata: { difficulty: number; tags: string[] }
}

interface LemmaResult {
  w: string
  lemma: string
  root?: string
  bs: string
  en: string
}

// ── Gemini call with key rotation ─────────────────────────────────────────────

async function lemmatizeBatch(words: WordForm[]): Promise<LemmaResult[]> {
  const prompt = `You are an Arabic morphology expert. For each word annotation, determine the canonical dictionary (lemma) form and provide clean dictionary meanings.

Lemma format rules:
- Verb: past 3rd masc sg + present 3rd masc sg, full harakat — e.g. "ذَهَبَ يَذْهَبُ", "كَتَبَ يَكْتُبُ"
- Noun: indefinite nominative singular + broken/sound plural, full harakat — e.g. "مَطَارٌ / مَطَارَاتٌ", "كِتَابٌ / كُتُبٌ"
- Adjective: indefinite nominative singular masc, full harakat — e.g. "كَبِيرٌ", "جَمِيلٌ"
- Other: simplest base form with full harakat

For bs: clean Bosnian dictionary meaning in ijekavica (not context-specific).
For en: clean English dictionary meaning.

Return ONLY a valid JSON array, no markdown:
[{"w":"...","lemma":"...","root":"...","bs":"...","en":"..."}]

Input:
${JSON.stringify(words)}`

  for (let attempt = 0; attempt < RAW_KEYS.length + 2; attempt++) {
    try {
      const model = getModel()
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      return JSON.parse(clean) as LemmaResult[]
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const isRateLimit = msg.includes('429') || msg.includes('503') || msg.includes('quota')
      if (isRateLimit && attempt < RAW_KEYS.length - 1) {
        process.stdout.write(` [key${keyIndex + 1}→]`)
        rotateKey()
        await new Promise(r => setTimeout(r, 1000))
      } else if (isRateLimit) {
        console.log(`\n  All keys rate-limited — waiting ${RETRY_DELAY_MS / 1000}s…`)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
        rotateKey()
      } else {
        throw e
      }
    }
  }
  throw new Error('Failed after all retries')
}

// ── Step 1: Collect unique word forms ─────────────────────────────────────────

console.log('🔤 FushaLab Dictionary Builder\n')
console.log('Step 1: Collecting word forms from B1 files…')

const forms = new Map<string, WordForm>()
const allFiles: string[] = []

for (const category of CATEGORIES) {
  const dir = join(DATA_DIR, category, 'B1')
  let entries: string[]
  try {
    entries = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json')
  } catch { continue }

  for (const file of entries) {
    const filePath = join(dir, file)
    allFiles.push(filePath)
    try {
      const item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem
      for (const s of item.sentences) {
        for (const w of s.words ?? []) {
          if (!forms.has(w.w)) {
            forms.set(w.w, { w: w.w, root: w.root, bs: w.bs, en: w.en })
          }
        }
      }
    } catch { /* skip */ }
  }
}

console.log(`  ${forms.size} unique forms across ${allFiles.length} files`)

// ── Step 2: Load existing dictionary, skip already-known forms ────────────────

const existingDict: Dictionary = existsSync(DICT_PATH)
  ? (JSON.parse(readFileSync(DICT_PATH, 'utf-8')) as Dictionary)
  : {}

// Build reverse map: w → lemma from existing dict entries (not perfect but helps skip)
// We re-process everything to ensure coverage — dict is merged, not replaced
const wordsToProcess = Array.from(forms.values())

const batches: WordForm[][] = []
for (let i = 0; i < wordsToProcess.length; i += BATCH_SIZE) {
  batches.push(wordsToProcess.slice(i, i + BATCH_SIZE))
}

// ── Step 3: Lemmatize ─────────────────────────────────────────────────────────

console.log(`\nStep 2: Lemmatizing via Gemini (${batches.length} batches × ${BATCH_SIZE})…`)

const wToLemma = new Map<string, string>()
const dict: Dictionary = { ...existingDict }
let batchNum = 0
let errorCount = 0

for (const batch of batches) {
  batchNum++
  process.stdout.write(`  Batch ${batchNum}/${batches.length}… `)
  try {
    const results = await lemmatizeBatch(batch)
    for (const r of results) {
      if (!r.lemma) continue
      wToLemma.set(r.w, r.lemma)
      if (!dict[r.lemma]) {
        dict[r.lemma] = { lemma: r.lemma, root: r.root || undefined, bs: r.bs, en: r.en }
      }
    }
    console.log(`✓ (${results.length})`)
  } catch (e) {
    console.log(`✗`)
    console.error('  ', e)
    errorCount++
  }

  // Save progress after each batch in case of interruption
  writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n', 'utf-8')

  if (batchNum < batches.length) await new Promise(r => setTimeout(r, 400))
}

// ── Step 4: Apply lemmas to B1 files ──────────────────────────────────────────

console.log(`\nStep 3: Applying lemmas to B1 files…`)
let updatedFiles = 0

for (const filePath of allFiles) {
  let item: ContentItem
  try {
    item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem
  } catch { continue }

  let changed = false
  for (const s of item.sentences) {
    for (const w of s.words ?? []) {
      if (!w.lemma && wToLemma.has(w.w)) {
        w.lemma = wToLemma.get(w.w)!
        changed = true
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(item, null, 2) + '\n', 'utf-8')
    updatedFiles++
  }
}

console.log(`  Updated ${updatedFiles}/${allFiles.length} files`)
console.log(`\n✅ Dictionary: ${Object.keys(dict).length} entries saved to public/data/dictionary.json`)
if (errorCount) console.log(`⚠️  ${errorCount} batch errors — re-run to fill gaps`)
