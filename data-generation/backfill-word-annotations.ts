/**
 * Backfill word annotations for B2/C1/C2 content files.
 *
 * VALIDATION RULE (strict):
 *   For every sentence, count "content tokens" = Arabic space-separated tokens
 *   whose bare form is non-empty AND whose bare form is NOT in FUNC_BARE.
 *   words[] must have exactly that many entries (where bare(w) is non-empty).
 *   Any mismatch → re-annotate that sentence (up to MAX_RETRIES times).
 *
 *   bare(s) = s.replace(/[^\u0621-\u063A\u0641-\u064A]/g, '')
 *   Strips diacritics (064B-0652), tatweel (0640), punctuation — keeps Arabic base letters only.
 *
 * Run: pnpm backfill-annotations [--test=N] [--levels=B2,C1,C2]
 *   --test=N       process only first N files (for testing/validation)
 *   --levels=...   comma-separated level list (default: B2,C1,C2)
 */

import { config } from 'dotenv'
import { join } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.reading'), override: false })

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
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
const MODEL = process.env['READING_MODEL'] ?? 'gemini-2.0-flash'
const SENTENCES_PER_BATCH = 4
const MAX_RETRIES = 2
const MAX_SPLITS = 2 // stop splitting after this many halving attempts

const testArg = process.argv.find(a => a.startsWith('--test='))
const TEST_LIMIT = testArg ? parseInt(testArg.split('=')[1], 10) : Infinity

const levelsArg = process.argv.find(a => a.startsWith('--levels='))
const LEVELS = (levelsArg?.split('=')[1] ?? process.env['BACKFILL_LEVELS'] ?? 'B2,C1,C2').split(',')

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
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
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

// ── bare() and content-word counting ─────────────────────────────────────────
//
// bare(s): strips everything except Arabic base letters
//   U+0621-U+063A  (ء to غ)
//   U+0641-U+064A  (ف to ي)
// This removes: diacritics (064B-0652), tatweel (0640), hamza modifiers,
// punctuation, digits, spaces, Latin characters — everything non-letter.

function bare(s: string): string {
  return s.replace(/[^\u0621-\u063A\u0641-\u064A]/g, '')
}

// Function words: their bare forms should not be counted as content words.
// Includes standalone prepositions, conjunctions, pronouns, particles,
// demonstratives, relative pronouns, and their common pronoun-suffix forms.
// Derived from the comprehensive SKIP list + pronoun-suffix variants.
const FUNC_WORDS_DIACRITIZED = [
  // Prepositions (standalone)
  'فِي','عَلَى','مِنْ','مِنَ','إِلَى','عَنْ','عَنِ','مَعَ','بَيْنَ',
  'بَعْدَ','قَبْلَ','حَتَّى','مُنْذُ','خِلَالَ','رَغْمَ','عَبْرَ',
  'فَوْقَ','دُونَ','لَدَى','لَدَيْهِ','لَدَيْهَا',
  // Single-letter prepositions/conjunctions (fused) — bare form is a single letter
  'وَ','فَ','بِ','لِ','كَ',
  // Subordinating conjunctions & particles
  'أَنْ','إِنَّ','أَنَّ','إِنَّهُ','إِنَّهَا','إِنَّهُمْ',
  'أَنَّهُ','أَنَّهَا','أَنَّهُمْ','أَنَّهُمَا',
  'إِذَا','لَوْ','لَوْلَا','إِذْ','حَيْثُ','كَمَا',
  'إِلَّا','أَمَّا','لِذَلِكَ','لَكِنَّ','لَكِنْ','بَلْ',
  'أَوْ','ثُمَّ','إِنْ',
  // Personal pronouns
  'هُوَ','هِيَ','هُمْ','هُنَّ','هُمَا',
  'أَنَا','نَحْنُ','أَنْتَ','أَنْتِ','أَنْتُمْ','أَنْتُنَّ','أَنْتُمَا',
  // Demonstratives
  'هَذَا','هَذِهِ','هَذَيْنِ','هَاتَيْنِ',
  'ذَلِكَ','تِلْكَ','ذَيْنِكَ','أُولَئِكَ',
  // Relative pronouns
  'الَّذِي','الَّتِي','الَّذِينَ','الَّاتِي','اللَّوَاتِي',
  // Negation & modal particles
  'لَا','لَمْ','لَنْ','قَدْ','سَوْفَ','مَا','لَيْتَ','لَعَلَّ',
  // Question words (function)
  'هَلْ','أَيْنَ','كَيْفَ','مَتَى','لِمَاذَا','لِمَ','مَنْ',
  // Preposition + pronoun suffix forms (never content)
  'لَهُ','لَهَا','لَهُمْ','لَهُنَّ','لَنَا','لِي','لَكَ','لَكِ','لَكُمْ',
  'بِهِ','بِهَا','بِهِمْ','بِهِنَّ','بِنَا','بِكَ','بِكِ',
  'مِنْهُ','مِنْهَا','مِنْهُمْ','مِنْهُنَّ','مِنَّا','مِنْكَ',
  'فِيهِ','فِيهَا','فِيهِمْ','فِيهِنَّ','فِينَا','فِيكَ','فِيكِ',
  'عَلَيْهِ','عَلَيْهَا','عَلَيْهِمْ','عَلَيْهِنَّ','عَلَيْنَا','عَلَيْكَ',
  'إِلَيْهِ','إِلَيْهَا','إِلَيْهِمْ','إِلَيْنَا','إِلَيْكَ',
  'عَنْهُ','عَنْهَا','عَنْهُمْ','عَنَّا','عَنْكَ',
  'مَعَهُ','مَعَهَا','مَعَهُمْ','مَعَهُنَّ','مَعَنَا','مَعَكَ',
  // Fused conjunction + function word forms
  'وَهُوَ','وَهِيَ','وَهُمْ','وَلَمْ','وَلَا','فَلَا','فَلَمْ',
  'وَمَا','فَمَا','وَإِنْ','فَإِنَّ','وَإِنَّ','وَأَنَّ','فَأَنَّ',
  'لَكِنَّهُ','لَكِنَّهَا','لَكِنَّهُمْ',
  'لِأَنَّهُ','لِأَنَّهَا','لِأَنَّهُمْ',
  'وَمِنْهُ','وَمِنْهَا','وَبِهِ','وَبِهَا','وَفِيهِ','وَفِيهَا',
  'وَعَلَيْهِ','وَإِلَيْهِ',
  // Vocative & address particles
  'يَا','أَيُّهَا','أَيَّتُهَا',
  // Other common function entries
  'هَلْ','لِلَّهِ','بِأَنْ','بِهَذَا','بِهَذِهِ','عَلَيْنَا',
]

const FUNC_BARE = new Set(FUNC_WORDS_DIACRITIZED.map(bare))

/**
 * Count content words in an Arabic sentence.
 * Content words = tokens whose bare form is non-empty AND not in FUNC_BARE.
 */
function contentWordCount(arabic: string): number {
  return arabic
    .split(/\s+/)
    .map(t => bare(t))
    .filter(b => b.length > 0 && !FUNC_BARE.has(b))
    .length
}

/**
 * Count annotated words in a words[] array.
 * An entry counts if its bare w field is non-empty.
 */
function annotatedCount(words: WordAnnotation[]): number {
  return words.filter(w => bare(w.w).length > 0).length
}

/**
 * Returns true if a sentence needs (re-)annotation.
 * Strict rule: annotatedCount must equal contentWordCount exactly.
 */
function needsAnnotation(s: Sentence): boolean {
  const expected = contentWordCount(s.arabic)
  if (expected === 0) return false // no content words (degenerate case)
  if (!s.words || s.words.length === 0) return true
  return annotatedCount(s.words) !== expected
}

/**
 * Try to fix a sentence without calling Gemini.
 * If words[] has surplus entries whose bare w is a function word, remove them.
 * Returns true if the sentence now passes validation (no API call needed).
 */
function tryLocalCleanup(s: Sentence): boolean {
  if (!s.words) return false
  const expected = contentWordCount(s.arabic)
  const before = annotatedCount(s.words)
  if (before === expected) return true // already correct
  if (before < expected) return false  // missing words — need Gemini

  // Surplus: remove words whose bare form is a function word
  s.words = s.words.filter(w => {
    const b = bare(w.w)
    return b.length > 0 && !FUNC_BARE.has(b)
  })

  return annotatedCount(s.words) === expected
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildAnnotationPrompt(
  sentences: Array<{ idx: number; arabic: string; expectedCount: number }>
): string {
  const sentenceList = sentences
    .map(s => `${s.idx}. [expected: ${s.expectedCount} words] "${s.arabic}"`)
    .join('\n')

  return `You are an expert Arabic linguist annotating sentences for language learners.

For each sentence below, extract ALL content words and return them as a JSON array.

SENTENCES TO ANNOTATE:
${sentenceList}

══════════════════════════════════════════════════════════════════
CRITICAL RULES — READ CAREFULLY
══════════════════════════════════════════════════════════════════

[1] WHAT TO INCLUDE (content words):
  ✓ All nouns (including verbal nouns / masdar)
  ✓ All verbs (all forms, tenses, persons)
  ✓ All adjectives
  ✓ All adverbs (جِدًّا، أَيْضًا، فَقَطْ، مَعًا، سَنَوِيًّا, etc.)
  ✓ ALL proper nouns — cities, countries, months, festivals, cultural terms, names
    Examples: رَمَضَانُ، الْأَرْدُنُّ، جَرَشُ، مَكَّةُ، الشَّامُ، أَفْرِيقِيَا، إِسْبَانِيَا، الْقَاهِرَةُ
  ✓ Quantifiers used as content (كَوْن forms: كَانَ، يَكُونُ; بَعْض، كُلّ when bearing content)
  ✓ Negation copula: لَيْسَ، لَيْسَتْ

[2] WHAT TO SKIP (function/grammar words — no content, never annotate):
  Prepositions:    فِي، عَلَى، مِنْ، إِلَى، عَنْ، مَعَ، بَيْنَ، بَعْدَ، قَبْلَ، خِلَالَ، حَتَّى، رَغْمَ، عَبْرَ
  Conjunctions:    وَ، فَ، ثُمَّ، أَوْ، لَكِنَّ، لَكِنْ، بَلْ، أَمَّا، كَمَا، إِذَا، لَوْ
  Subordinators:   أَنَّ، إِنَّ، أَنْ، إِنْ، حَيْثُ، إِذْ، إِلَّا
  Pronouns:        هُوَ، هِيَ، هُمْ، أَنَا، نَحْنُ، أَنْتَ (all forms)
  Demonstratives:  هَذَا، هَذِهِ، ذَلِكَ، تِلْكَ
  Relative:        الَّذِي، الَّتِي، الَّذِينَ
  Particles:       لَا (negation), لَمْ، لَنْ، قَدْ، سَوْفَ، هَلْ
  Prep+pronoun:    فِيهِ، عَلَيْهَا، مِنْهُمْ، إِلَيْهِ, etc. (all prep+suffix forms)

[3] THE "w" FIELD — CRITICAL:
  Copy the word EXACTLY as it appears in the sentence, character by character.
  Include ALL fused prefixes that are part of the token:
    • If sentence has "وَالتَّوَابِلِ" → w="وَالتَّوَابِلِ"  (NOT "التَّوَابِلِ")
    • If sentence has "وَيَجْمَعُ"    → w="وَيَجْمَعُ"     (NOT "يَجْمَعُ")
    • If sentence has "بِامْتِيَازٍ"  → w="بِامْتِيَازٍ"   (NOT "امْتِيَازٍ")
    • If sentence has "وَأَدَبَاءَ"   → w="وَأَدَبَاءَ"    (NOT "أَدَبَاءَ")
  The w value MUST be an exact token from the sentence (split by spaces).

[4] LEMMA FORMATS:
  • Verb:       past + present form     → "ذَهَبَ يَذْهَبُ"
  • Noun:       singular / plural       → "مَدِينَةٌ / مُدُنٌ" (use "-" if no plural)
  • Adjective:  masc. sg. indefinite    → "كَبِيرٌ"
  • Proper noun: canonical bare form    → "رَمَضَانُ" or "الْأُرْدُنُّ"
  • Adverb:     as-is                   → "سَنَوِيًّا"
  • Verbal noun (masdar): sg / pl       → "تَشْكِيلٌ / -"

[5] COUNT REQUIREMENT:
  Each sentence has [expected: N] content words marked above.
  Your words[] array for that sentence MUST contain EXACTLY N entries.
  Count carefully before responding. If unsure, recount.

══════════════════════════════════════════════════════════════════
EXAMPLE OUTPUT FORMAT
══════════════════════════════════════════════════════════════════

Input: 2. [expected: 4 words] "تَسْكُنُ الْعَائِلَةُ فِي بَيْتٍ كَبِيرٍ"
Output for sentence 2:
  words: [
    { "w": "تَسْكُنُ",    "lemma": "سَكَنَ يَسْكُنُ" },
    { "w": "الْعَائِلَةُ", "lemma": "عَائِلَةٌ / عَائِلَاتٌ" },
    { "w": "بَيْتٍ",      "lemma": "بَيْتٌ / بُيُوتٌ" },
    { "w": "كَبِيرٍ",     "lemma": "كَبِيرٌ" }
  ]
  → "فِي" is a preposition → skipped. Count = 4 ✓

══════════════════════════════════════════════════════════════════

Return ONLY a valid JSON array, one object per sentence, in order:
[
  {
    "idx": 1,
    "words": [
      { "w": "...", "lemma": "..." }
    ]
  }
]`
}

// ── Parse Gemini response ─────────────────────────────────────────────────────

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
      return [
        {
          w: wv['w'] as string,
          ...(typeof wv['lemma'] === 'string' ? { lemma: wv['lemma'] } : {}),
        },
      ]
    })

    return [{ idx, words }]
  })
}

// ── Collect files ─────────────────────────────────────────────────────────────

function collectFiles(): string[] {
  const results: string[] = []
  const categories = readdirSync(DATA_DIR).filter(d => {
    try {
      return statSync(join(DATA_DIR, d)).isDirectory()
    } catch {
      return false
    }
  })
  for (const level of LEVELS) {
    for (const cat of categories) {
      const dir = join(DATA_DIR, cat, level)
      if (!existsSync(dir)) continue
      readdirSync(dir)
        .filter(f => f.endsWith('.json') && f !== 'index.json')
        .forEach(f => results.push(join(dir, f)))
    }
  }
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

const isTest = TEST_LIMIT < Infinity
console.log(`\n📚 FushaLab Word Annotation Backfill`)
console.log(`   Model    : ${MODEL}`)
console.log(`   Keys     : ${apiKeys.length}`)
console.log(`   Levels   : ${LEVELS.join(', ')}`)
console.log(`   Batch    : ${SENTENCES_PER_BATCH} sentences per API call`)
if (isTest) console.log(`   TEST MODE: first ${TEST_LIMIT} files only`)
console.log(`   FUNC_BARE: ${FUNC_BARE.size} function word bare forms\n`)

const allFiles = collectFiles()
const filesToCheck = isTest ? allFiles.slice(0, TEST_LIMIT) : allFiles

// ── Validate all files, collect sentences that need annotation ────────────────

type SentenceRef = { file: string; sentIdx: number; arabic: string; expectedCount: number; splitDepth?: number }
const pendingRefs: SentenceRef[] = []
const fileItems = new Map<string, ContentItem>()

let alreadyOk = 0
let needsWork = 0

console.log(`Scanning ${filesToCheck.length} files for annotation gaps...`)

for (const f of filesToCheck) {
  let item: ContentItem
  try {
    item = JSON.parse(readFileSync(f, 'utf-8')) as ContentItem
  } catch {
    continue
  }
  fileItems.set(f, item)

  let fileNeedsWork = false
  let fileCleanedUp = false
  for (let i = 0; i < item.sentences.length; i++) {
    const s = item.sentences[i]
    const expected = contentWordCount(s.arabic)
    const actual = s.words ? annotatedCount(s.words) : 0

    if (!needsAnnotation(s)) continue

    // Try local cleanup first (removes spurious function-word entries)
    if (actual > expected && tryLocalCleanup(s)) {
      fileCleanedUp = true
      if (isTest) {
        console.log(`  CLEANED UP: ${item.id} sentence ${i + 1}`)
        console.log(`    removed surplus function words, now: ${annotatedCount(s.words!)} / ${expected}`)
      }
      continue
    }

    pendingRefs.push({ file: f, sentIdx: i, arabic: s.arabic, expectedCount: expected })
    fileNeedsWork = true
    if (isTest) {
      console.log(`  NEEDS ANNOTATION: ${item.id} sentence ${i + 1}`)
      console.log(`    arabic  : ${s.arabic}`)
      console.log(`    expected: ${expected}, actual: ${actual}`)
      if (s.words?.length) {
        console.log(`    current words: ${s.words.map(w => w.w).join(', ')}`)
      }
    }
  }

  // Write the file if cleanup fixed things locally
  if (fileCleanedUp && !fileNeedsWork) {
    writeFileSync(f, JSON.stringify(item, null, 2))
  }

  if (fileNeedsWork) {
    needsWork++
  } else {
    alreadyOk++
  }
}

console.log(`\nScan results:`)
console.log(`  Files fully annotated : ${alreadyOk}`)
console.log(`  Files with gaps       : ${needsWork}`)
console.log(`  Sentences to annotate : ${pendingRefs.length}`)
console.log(`  Estimated API calls   : ${Math.ceil(pendingRefs.length / SENTENCES_PER_BATCH)}\n`)

if (pendingRefs.length === 0) {
  console.log('✅ All sentences are fully annotated — nothing to do!')
  process.exit(0)
}

// ── Process batches with retry ────────────────────────────────────────────────

let processedSentences = 0
let failedSentences = 0
let retriedSentences = 0
let filesWritten = 0

const queue = [...pendingRefs]

while (queue.length > 0) {
  const batch = queue.splice(0, SENTENCES_PER_BATCH)

  let annotations: Array<{ idx: number; words: WordAnnotation[] }> = []
  let success = false

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const prompt = buildAnnotationPrompt(
      batch.map((r, i) => ({ idx: i + 1, arabic: r.arabic, expectedCount: r.expectedCount }))
    )

    let raw: string
    try {
      raw = await callGemini(prompt)
    } catch (err) {
      if (err instanceof Error && err.message === 'ALL_KEYS_EXHAUSTED') {
        console.log(`\n⛔ All API keys exhausted. Progress saved. Re-run tomorrow.`)
        // Write any partial progress before exiting
        for (const [f, item] of fileItems) {
          const hasAny = item.sentences.some(s => s.words && s.words.length > 0)
          if (hasAny) writeFileSync(f, JSON.stringify(item, null, 2))
        }
        process.exit(0)
      }
      if (err instanceof Error && err.message === 'MAX_TOKENS') {
        const depth = batch[0]?.splitDepth ?? 0
        if (batch.length > 1 && depth < MAX_SPLITS) {
          const mid = Math.ceil(batch.length / 2)
          const withDepth = (refs: SentenceRef[]) => refs.map(r => ({ ...r, splitDepth: depth + 1 }))
          queue.unshift(...withDepth(batch.slice(mid)))
          queue.unshift(...withDepth(batch.slice(0, mid)))
          console.log(`\n  ⚠️  MAX_TOKENS on batch of ${batch.length} — re-queued as two halves (depth ${depth + 1}/${MAX_SPLITS})`)
          success = true
          break
        }
        // Reached split limit or already single-sentence — give up on this batch
        console.log(`\n  ⚠️  MAX_TOKENS (split limit reached) — skipping ${batch.length} sentence(s)`)
        failedSentences += batch.length
        success = true
        break
      }
      console.log(`  ⚠️  API error (${err instanceof Error ? err.message : String(err)}) — skipping batch`)
      failedSentences += batch.length
      success = true
      break
    }

    let parsed: Array<{ idx: number; words: WordAnnotation[] }>
    try {
      parsed = parseAnnotations(raw)
    } catch {
      if (attempt < MAX_RETRIES) {
        console.log(`  ⚠️  Parse error on attempt ${attempt + 1} — retrying...`)
        retriedSentences += batch.length
        continue
      }
      console.log(`  ⚠️  Parse error after ${MAX_RETRIES} retries — skipping batch`)
      failedSentences += batch.length
      success = true
      break
    }

    // Validate each sentence's count
    let allCountsOk = true
    const countMismatches: number[] = []

    for (const ann of parsed) {
      const ref = batch[ann.idx - 1]
      if (!ref) continue
      const actual = annotatedCount(ann.words)
      if (actual !== ref.expectedCount) {
        allCountsOk = false
        countMismatches.push(ann.idx)
      }
    }

    if (!allCountsOk && attempt < MAX_RETRIES) {
      console.log(
        `  ⚠️  Count mismatch on attempt ${attempt + 1} (sentences: ${countMismatches.join(', ')}) — retrying...`
      )
      if (isTest) {
        for (const idx of countMismatches) {
          const ref = batch[idx - 1]
          const ann = parsed.find(a => a.idx === idx)
          if (ref && ann) {
            console.log(`    sentence ${idx}: expected ${ref.expectedCount}, got ${annotatedCount(ann.words)}`)
            console.log(`    arabic: ${ref.arabic}`)
            console.log(`    returned: ${ann.words.map(w => w.w).join(', ')}`)
          }
        }
      }
      retriedSentences += batch.length
      continue
    }

    // Apply whatever we got (best effort if still mismatched after retries)
    for (const ann of parsed) {
      const ref = batch[ann.idx - 1]
      if (!ref || ann.words.length === 0) continue
      const item = fileItems.get(ref.file)
      if (!item) continue

      const actual = annotatedCount(ann.words)
      if (actual !== ref.expectedCount && isTest) {
        console.log(
          `  ⚠️  FINAL count mismatch: ${item.id} s${ref.sentIdx + 1}: expected ${ref.expectedCount}, got ${actual}`
        )
        console.log(`    arabic: ${ref.arabic}`)
        console.log(`    words : ${ann.words.map(w => w.w).join(', ')}`)
      }

      item.sentences[ref.sentIdx].words = ann.words
      processedSentences++
    }

    annotations = parsed
    success = true
    break
  }

  if (!success) {
    failedSentences += batch.length
  }

  // Write files that are now fully validated
  const filesInBatch = new Set(batch.map(r => r.file))
  for (const f of filesInBatch) {
    const item = fileItems.get(f)
    if (!item) continue
    // Write if any sentence has been annotated (partial writes are fine)
    const hasChanges = item.sentences.some(s => s.words && s.words.length > 0)
    if (hasChanges) {
      writeFileSync(f, JSON.stringify(item, null, 2))
      filesWritten++
    }
  }

  process.stdout.write(
    `\r  ✓ ${processedSentences} annotated, ${failedSentences} failed, ${retriedSentences} retried | files written: ${filesWritten}`
  )

  if (queue.length > 0) await new Promise(r => setTimeout(r, 800))
}

// Final write — ensure all modified files are saved
for (const [f, item] of fileItems) {
  const hasAny = item.sentences.some(s => s.words && s.words.length > 0)
  if (hasAny) writeFileSync(f, JSON.stringify(item, null, 2))
}

console.log(`\n\n✅ Backfill complete!`)
console.log(`   Sentences annotated : ${processedSentences}`)
console.log(`   Sentences failed    : ${failedSentences}`)
console.log(`   Retries triggered   : ${retriedSentences}`)
console.log(`   Files written       : ${filesWritten}`)

if (failedSentences > 0) {
  console.log(`\n⚠️  ${failedSentences} sentences were not annotated — re-run to retry.`)
}
