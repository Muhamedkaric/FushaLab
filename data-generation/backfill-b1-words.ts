/**
 * Re-annotate B1 content files with complete word-level annotations.
 *
 * B1 files were originally annotated with a 3–6 word cap per sentence,
 * leaving many content words missing. This script re-annotates all B1
 * sentences replacing the incomplete words[] with a full annotation.
 *
 * Uses smaller batches (3 sentences/call) to be conservative with quota.
 * Safe to interrupt and re-run — saves progress per-file.
 *
 * Run from data-generation dir: pnpm backfill-b1-words
 */

import { config } from 'dotenv'
import { join } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.reading'), override: false })

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { resolve } from 'path'
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from '@google/generative-ai'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WordAnnotation {
  w: string
  lemma?: string
}

interface Sentence {
  arabic: string
  translation: string
  translationEn: string
  words?: WordAnnotation[]
}

interface ContentItem {
  id: string
  category: string
  level: string
  sentences: Sentence[]
  metadata: { difficulty: number; tags: string[] }
}

// ── Config ────────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(import.meta.dirname, '../public/data')
const PROGRESS_FILE = resolve(import.meta.dirname, 'backfill-b1-words-progress.json')
const MODEL = process.env['READING_MODEL'] ?? 'gemini-2.0-flash'
const SENTENCES_PER_BATCH = 3 // smaller batches for conservative quota use

// ── Key rotation ──────────────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (apiKeys.length === 0) {
  console.error('Error: GEMINI_API_KEYS not set in data-generation/.env')
  process.exit(1)
}

let currentKeyIndex = 0
const exhaustedKeys = new Set<number>()

function nextAvailableKey(): number | null {
  for (let i = 0; i < apiKeys.length; i++) {
    const idx = (currentKeyIndex + i) % apiKeys.length
    if (!exhaustedKeys.has(idx)) return idx
  }
  return null
}

// ── Gemini call ───────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  let consecutiveRateLimits = 0

  while (true) {
    const keyIdx = nextAvailableKey()
    if (keyIdx === null) throw new Error('ALL_KEYS_EXHAUSTED')
    currentKeyIndex = keyIdx

    const gemini = new GoogleGenerativeAI(apiKeys[keyIdx]).getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 4096 },
    })

    try {
      const result = await gemini.generateContent(prompt)
      consecutiveRateLimits = 0
      return result.response.text()
    } catch (err) {
      if (err instanceof GoogleGenerativeAIResponseError) {
        const reason = err.response?.candidates?.[0]?.finishReason
        if (reason === 'RECITATION') throw new Error('RECITATION')
        throw err
      }

      if (!(err instanceof GoogleGenerativeAIFetchError)) throw err

      if (err.status === 429) {
        const violations = (err.errorDetails as Array<Record<string, unknown>> | undefined) ?? []
        const dailyExhausted = violations.some(
          v => typeof v['quotaId'] === 'string' && v['quotaId'].includes('PerDay') && v['limit'] === 0
        )
        if (dailyExhausted) {
          console.log(`  🔑 Daily quota exhausted on key ${keyIdx + 1}/${apiKeys.length}`)
          exhaustedKeys.add(keyIdx)
          const next = nextAvailableKey()
          if (next === null) throw new Error('ALL_KEYS_EXHAUSTED')
          currentKeyIndex = next
          consecutiveRateLimits = 0
          continue
        }
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        if (consecutiveRateLimits >= apiKeys.length - exhaustedKeys.size) {
          console.log(`  ⏳ All keys rate-limited — waiting 60s...`)
          await new Promise(r => setTimeout(r, 60_000))
          consecutiveRateLimits = 0
        } else {
          console.log(`  🔑 Rate limited on key ${keyIdx + 1} — switching...`)
        }
        continue
      }

      if (err.status === 503) {
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        if (consecutiveRateLimits >= apiKeys.length - exhaustedKeys.size) {
          console.log(`  ⏳ All keys 503 — waiting 30s...`)
          await new Promise(r => setTimeout(r, 30_000))
          consecutiveRateLimits = 0
        }
        continue
      }

      throw err
    }
  }
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildAnnotationPrompt(sentences: Array<{ idx: number; arabic: string }>): string {
  const sentenceList = sentences
    .map(s => `${s.idx}. "${s.arabic}"`)
    .join('\n')

  return `You are an expert Arabic linguist. For each sentence below, identify the CONTENT words and provide word-level annotations.

SENTENCES:
${sentenceList}

RULES:
- Include only CONTENT words: nouns, verbs, adjectives, adverbs
- SKIP standalone function words: فِي، عَلَى، مِنْ، إِلَى، وَ، فَ، بِ، لِ، أَنْ، إِنَّ، هُوَ، هِيَ، هَذَا، ذَلِكَ، لَا، لَمْ، قَدْ
- ALWAYS annotate كَانَ / كَانَتْ / كَانُوا and all كَوْن forms — even as copula
- DO NOT SKIP compound adverbs like عِنْدَمَا، بَيْنَمَا، حَيْثُمَا — these are content words learners need to know
- SKIP proper nouns (names of people, places, specific books)
- w: CRITICAL — copy the word character-for-character exactly as it appears in the sentence, including any attached prefixes. If a conjunction (وَ or فَ) is fused to the front of a content word in the sentence (e.g. وَوَدَّعَتْ، وَذَهَبَ، فَقَالَ), the w field MUST include the prefix: w="وَوَدَّعَتْ" NOT w="وَدَّعَتْ"
- lemma formats:
  * Verb: past + present — e.g. "ذَهَبَ يَذْهَبُ"
  * Noun: singular / plural — e.g. "مَدِينَةٌ / مُدُنٌ"
  * Adjective: masculine singular indefinite — e.g. "كَبِيرٌ"
- Annotate ALL content words in the sentence — do NOT skip any nouns, verbs, adjectives, or adverbs

Return ONLY a valid JSON array with one object per sentence, in order:
[
  {
    "idx": 1,
    "words": [
      { "w": "ذَهَبَتِ", "lemma": "ذَهَبَ يَذْهَبُ" },
      { "w": "الْعَائِلَةُ", "lemma": "عَائِلَةٌ / عَائِلَاتٌ" }
    ]
  }
]`
}

// ── Parse annotation response ─────────────────────────────────────────────────

function parseAnnotations(raw: string): Array<{ idx: number; words: WordAnnotation[] }> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as unknown
  if (!Array.isArray(parsed)) throw new Error('Not an array')

  return parsed.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return []
    const o = item as Record<string, unknown>
    const idx = typeof o['idx'] === 'number' ? o['idx'] : -1
    if (idx < 0) return []
    if (!Array.isArray(o['words'])) return [{ idx, words: [] }]

    const words: WordAnnotation[] = (o['words'] as unknown[]).flatMap((w: unknown) => {
      if (typeof w !== 'object' || w === null) return []
      const wv = w as Record<string, unknown>
      if (typeof wv['w'] !== 'string') return []
      return [{
        w: wv['w'] as string,
        ...(typeof wv['lemma'] === 'string' ? { lemma: wv['lemma'] } : {}),
      }]
    })

    return [{ idx, words }]
  })
}

// ── Progress tracking ─────────────────────────────────────────────────────────

function loadProgress(): Set<string> {
  if (!existsSync(PROGRESS_FILE)) return new Set()
  try {
    const data = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8')) as string[]
    return new Set(data)
  } catch {
    return new Set()
  }
}

function saveProgress(done: Set<string>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...done], null, 2))
}

// ── Collect B1 files ──────────────────────────────────────────────────────────

function collectB1Files(): string[] {
  const results: string[] = []
  const categories = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(join(DATA_DIR, d)).isDirectory() } catch { return false }
  })
  for (const cat of categories) {
    const dir = join(DATA_DIR, cat, 'B1')
    if (!existsSync(dir)) continue
    const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json')
    for (const f of files) results.push(join(dir, f))
  }
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n📚 FushaLab B1 Word Annotation Re-fill')
console.log(`   Model  : ${MODEL}`)
console.log(`   Keys   : ${apiKeys.length}`)
console.log(`   Batch  : ${SENTENCES_PER_BATCH} sentences per API call\n`)

const done = loadProgress()
const allFiles = collectB1Files()

// Skip files already fully re-annotated by this script
const toProcess = allFiles.filter(f => !done.has(f))

console.log(`Total B1 files     : ${allFiles.length}`)
console.log(`Already done       : ${done.size}`)
console.log(`Files to process   : ${toProcess.length}\n`)

if (toProcess.length === 0) {
  console.log('✅ All B1 files already re-annotated!')
  process.exit(0)
}

type SentenceRef = { file: string; sentIdx: number; arabic: string }

const pendingRefs: SentenceRef[] = []
const fileItems = new Map<string, ContentItem>()

// Load all items and collect ALL sentences (re-annotate everything, not just missing)
for (const f of toProcess) {
  try {
    const item = JSON.parse(readFileSync(f, 'utf-8')) as ContentItem
    fileItems.set(f, item)
    for (let i = 0; i < item.sentences.length; i++) {
      pendingRefs.push({ file: f, sentIdx: i, arabic: item.sentences[i].arabic })
    }
  } catch {
    // skip unparseable
  }
}

console.log(`Total sentences to re-annotate: ${pendingRefs.length}`)
const estimatedCalls = Math.ceil(pendingRefs.length / SENTENCES_PER_BATCH)
console.log(`Estimated API calls: ${estimatedCalls}\n`)

let processedSentences = 0
let skippedSentences = 0
let totalFiles = 0

// Track which sentences in each file have been updated
const sentencesDone = new Map<string, Set<number>>()

while (pendingRefs.length > 0) {
  const batch = pendingRefs.splice(0, SENTENCES_PER_BATCH)
  const prompt = buildAnnotationPrompt(
    batch.map((r, i) => ({ idx: i + 1, arabic: r.arabic }))
  )

  let annotations: Array<{ idx: number; words: WordAnnotation[] }>
  try {
    const raw = await callGemini(prompt)
    annotations = parseAnnotations(raw)
  } catch (err) {
    if (err instanceof Error && err.message === 'ALL_KEYS_EXHAUSTED') {
      console.log(`\n⛔ All API keys exhausted. Progress saved. Re-run when quota resets.`)
      saveProgress(done)
      process.exit(0)
    }
    console.log(`  ⚠️  Batch failed (${err instanceof Error ? err.message : String(err)}) — skipping`)
    skippedSentences += batch.length
    continue
  }

  // Apply annotations back to file items
  for (const ann of annotations) {
    const ref = batch[ann.idx - 1]
    if (!ref || ann.words.length === 0) continue
    const item = fileItems.get(ref.file)
    if (!item) continue
    item.sentences[ref.sentIdx].words = ann.words

    if (!sentencesDone.has(ref.file)) sentencesDone.set(ref.file, new Set())
    sentencesDone.get(ref.file)!.add(ref.sentIdx)
    processedSentences++
  }

  // Save files where all sentences have been re-annotated
  const filesInBatch = new Set(batch.map(r => r.file))
  for (const f of filesInBatch) {
    const item = fileItems.get(f)
    if (!item || done.has(f)) continue
    const fileDone = sentencesDone.get(f)
    if (!fileDone) continue
    const allDone = item.sentences.every((_, i) => fileDone.has(i))
    if (allDone) {
      writeFileSync(f, JSON.stringify(item, null, 2))
      done.add(f)
      totalFiles++
    }
  }

  process.stdout.write(`\r  ✓ ${processedSentences} sentences done, ${totalFiles} files saved (${done.size}/${toProcess.length + done.size} total)`)

  // Save progress every 30 files
  if (totalFiles % 30 === 0 && totalFiles > 0) saveProgress(done)

  // Small delay to avoid hammering the API
  if (pendingRefs.length > 0) await new Promise(r => setTimeout(r, 500))
}

// Write any partially-processed files (in case of interruption mid-file)
for (const [f, item] of fileItems) {
  if (done.has(f)) continue
  const fileDone = sentencesDone.get(f)
  if (fileDone && fileDone.size > 0) {
    writeFileSync(f, JSON.stringify(item, null, 2))
  }
}

saveProgress(done)
console.log(`\n\n✅ B1 re-annotation complete!`)
console.log(`   Files saved       : ${totalFiles}`)
console.log(`   Sentences handled : ${processedSentences}`)
if (skippedSentences > 0) console.log(`   Sentences skipped : ${skippedSentences}`)
