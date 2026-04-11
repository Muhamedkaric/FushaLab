/**
 * Backfill word annotations for B2/C1/C2 content files.
 * Each word entry: { w, lemma } only — translations come from dictionary lookup.
 *
 * Sends sentences to Gemini in batches. Saves progress — safe to interrupt and re-run.
 * Run from data-generation dir: pnpm backfill-annotations
 */

import { config } from 'dotenv'
import { join } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.reading'), override: false })

import { existsSync, readFileSync, writeFileSync } from 'fs'
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
const PROGRESS_FILE = resolve(import.meta.dirname, 'backfill-annotations-progress.json')
const MODEL = process.env['READING_MODEL'] ?? 'gemini-2.0-flash'
const SENTENCES_PER_BATCH = 4 // sentences per API call

const LEVELS = (process.env['BACKFILL_LEVELS'] ?? 'B2,C1,C2').split(',')

// ── Key rotation ──────────────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (apiKeys.length === 0) {
  console.error('Error: GEMINI_API_KEYS not set in data-generation/.env')
  process.exit(1)
}

let currentKeyIndex = 0
const exhaustedKeys = new Set<number>()
let allKeysRateLimitRetries = 0

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
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8192 },
    })

    try {
      const result = await gemini.generateContent(prompt)
      consecutiveRateLimits = 0
      const finishReason = result.response.candidates?.[0]?.finishReason
      if (finishReason === 'MAX_TOKENS') throw new Error('MAX_TOKENS')
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
          if (allKeysRateLimitRetries >= 1) throw new Error('ALL_KEYS_EXHAUSTED')
          allKeysRateLimitRetries++
          console.log(`  ⏳ All keys rate-limited — waiting 60s (${allKeysRateLimitRetries}/1)...`)
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
          if (allKeysRateLimitRetries >= 1) throw new Error('ALL_KEYS_EXHAUSTED')
          allKeysRateLimitRetries++
          console.log(`  ⏳ All keys 503 — waiting 30s (${allKeysRateLimitRetries}/1)...`)
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
- Include CONTENT words: nouns, verbs, adjectives, adverbs
- INCLUDE proper nouns: names of places, countries, cities, months, cultural terms (e.g. رَمَضَانُ، الْأَرْدُنُّ، جَرَشُ، مَكَّةُ، الشَّامُ، أَفْرِيقِيَا)
- SKIP standalone function/grammar words: فِي، عَلَى، مِنْ، إِلَى، عَنْ، مَعَ، حَوْلَ، عِنْدَ، عَبْرَ، فَوْقَ، دُونَ، قَبْلَ، لَدَى، بَيْنَ، وَ، فَ، أَنْ، إِنَّ، أَنَّ، هُوَ، هِيَ، هُمْ، هَذَا، هَذِهِ، ذَلِكَ، تِلْكَ، الَّذِي، الَّتِي، الَّذِينَ، لَا (negation), لَمْ، قَدْ، إِذْ، حَيْثُ، عِنْدَمَا، كَمَا، لِذَلِكَ، فَقَطْ، أَيْضًا، هُنَا، هُنَاكَ، هَكَذَا، مَعًا، حَتَّى (conj), أَمَّا، إِلَّا، رَغْمَ، بَعْدَ (temporal prep), بَعْضُ، كُلُّ (quantifiers), كَانَ/تَكُونُ (copula only), يُمْكِنُ، لَا تَزَالُ
- w: CRITICAL — copy the word character-for-character exactly as it appears in the sentence, including any fused prefixes (وَ، فَ، بِ، لِ، كَ). Example: if sentence has وَالتَّوَابِلِ then w="وَالتَّوَابِلِ", lemma="تَابِلٌ / تَوَابِلُ"
- lemma formats:
  * Verb: past + present — e.g. "ذَهَبَ يَذْهَبُ"
  * Noun: singular / plural — e.g. "مَدِينَةٌ / مُدُنٌ"
  * Adjective: masculine singular indefinite — e.g. "كَبِيرٌ"
  * Particle/conjunction (if included): bare particle without fused prefix — e.g. w="وَإِنْ" lemma="إِنْ"
- Annotate ALL content words — do NOT skip nouns, verbs, adjectives, adverbs, or proper nouns

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

// ── Collect files ─────────────────────────────────────────────────────────────

import { readdirSync, statSync } from 'fs'

function collectFilesSync(): string[] {
  const results: string[] = []
  for (const level of LEVELS) {
    const categories = readdirSync(DATA_DIR).filter(d => {
      try { return statSync(join(DATA_DIR, d)).isDirectory() } catch { return false }
    })
    for (const cat of categories) {
      const dir = join(DATA_DIR, cat, level)
      if (!existsSync(dir)) continue
      const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json')
      for (const f of files) results.push(join(dir, f))
    }
  }
  return results
}

console.log('\n📚 FushaLab Word Annotation Backfill (B2/C1/C2)')
console.log(`   Model  : ${MODEL}`)
console.log(`   Keys   : ${apiKeys.length}`)
console.log(`   Batch  : ${SENTENCES_PER_BATCH} sentences per API call\n`)

const done = loadProgress()
const allFiles = collectFilesSync()

// A sentence is "incomplete" if it has no words array, empty words array,
// or suspiciously few words (< 40% of Arabic token count, suggesting missed proper nouns/content words)
function sentenceNeedsAnnotation(s: Sentence): boolean {
  if (!s.words || s.words.length === 0) return true
  const arabicTokens = s.arabic.split(/\s+/).filter(t => t.replace(/[؛،.!؟]/g, '').length > 0).length
  return s.words.length < Math.max(3, arabicTokens * 0.4)
}

const toProcess = allFiles.filter(f => {
  if (done.has(f)) return false
  try {
    const item = JSON.parse(readFileSync(f, 'utf-8')) as ContentItem
    return item.sentences.some(sentenceNeedsAnnotation)
  } catch {
    return false
  }
})

console.log(`Files already done : ${done.size}`)
console.log(`Files to process   : ${toProcess.length}\n`)

if (toProcess.length === 0) {
  console.log('✅ All files already annotated!')
  process.exit(0)
}

let totalFiles = 0
let totalSentences = 0

// Process in batches of SENTENCES_PER_BATCH across multiple files
// Collect (file, sentence index) pairs that need annotation
type SentenceRef = { file: string; sentIdx: number; arabic: string }

let pendingRefs: SentenceRef[] = []
let fileItems = new Map<string, ContentItem>()

// Load all items into memory and collect unannotated sentences
for (const f of toProcess) {
  try {
    const item = JSON.parse(readFileSync(f, 'utf-8')) as ContentItem
    fileItems.set(f, item)
    for (let i = 0; i < item.sentences.length; i++) {
      const s = item.sentences[i]
      if (sentenceNeedsAnnotation(s)) {
        pendingRefs.push({ file: f, sentIdx: i, arabic: s.arabic })
      }
    }
  } catch {
    // skip unparseable
  }
}

console.log(`Total sentences to annotate: ${pendingRefs.length}`)
const estimatedCalls = Math.ceil(pendingRefs.length / SENTENCES_PER_BATCH)
console.log(`Estimated API calls: ${estimatedCalls}\n`)

let processedSentences = 0
let skippedSentences = 0

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
      console.log(`\n⛔ All API keys exhausted. Progress saved. Re-run tomorrow.`)
      saveProgress(done)
      process.exit(0)
    }
    if (err instanceof Error && err.message === 'MAX_TOKENS' && batch.length > 1) {
      // Re-queue split in half so they get processed at smaller size
      const mid = Math.ceil(batch.length / 2)
      pendingRefs.unshift(...batch.slice(mid))
      pendingRefs.unshift(...batch.slice(0, mid))
      console.log(`\n  ⚠️  MAX_TOKENS on batch of ${batch.length} — re-queued as ${mid} + ${batch.length - mid}`)
      continue
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
    processedSentences++
  }

  // Save files that are now fully annotated
  const filesInBatch = new Set(batch.map(r => r.file))
  for (const f of filesInBatch) {
    const item = fileItems.get(f)
    if (!item) continue
    const allAnnotated = item.sentences.every(s => s.words && s.words.length > 0)
    if (allAnnotated) {
      writeFileSync(f, JSON.stringify(item, null, 2))
      done.add(f)
      totalFiles++
    }
  }

  totalSentences += batch.length - skippedSentences
  process.stdout.write(`\r  ✓ ${processedSentences} sentences annotated, ${totalFiles} files done (${done.size}/${toProcess.length + done.size} total)`)

  // Save progress every 50 files
  if (totalFiles % 50 === 0) saveProgress(done)

  // Small delay to avoid hammering the API
  if (pendingRefs.length > 0) await new Promise(r => setTimeout(r, 1000))
}

// Final save — write any partially-annotated files too
for (const [f, item] of fileItems) {
  const hasAny = item.sentences.some(s => s.words && s.words.length > 0)
  if (hasAny && !done.has(f)) {
    writeFileSync(f, JSON.stringify(item, null, 2))
  }
}

saveProgress(done)
console.log(`\n\n✅ Backfill complete!`)
console.log(`   Files annotated   : ${totalFiles}`)
console.log(`   Sentences handled : ${processedSentences}`)
if (skippedSentences > 0) console.log(`   Sentences skipped : ${skippedSentences}`)
