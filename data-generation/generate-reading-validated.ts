/**
 * Validated reading content generator for FushaLab.
 *
 * Drop-in replacement for generate-reading.ts — same queue, same key rotation,
 * same output format — but with strict word-annotation validation built in.
 *
 * VALIDATION RULE (same as backfill-word-annotations.ts):
 *   For every sentence: strip all non-Arabic-base-letters from each space-separated
 *   token AND from each words[].w field (bare() function). Count tokens whose bare
 *   form is non-empty AND not in FUNC_BARE. words[] must have exactly that many
 *   entries. Any mismatch → the entire item is REJECTED and not written to disk.
 *
 * FAILURE POLICY:
 *   - Single item fails validation → log it, drop it, move on.
 *   - MAX_CONSECUTIVE_FAILURES items in a row fail → SCREAM and stop the job.
 *     This catches a broken model / prompt / API response that would otherwise
 *     fill disk with empty or garbage annotations.
 *
 * STATUS: ready but not wired into the daily LaunchAgent yet.
 *   Use after backfill of all B2/C1/C2 files is complete.
 *
 * Run:
 *   READING_TARGET=100 npx tsx generate-reading-validated.ts
 *   BACKFILL_LEVELS=B2 npx tsx generate-reading-validated.ts  (subset)
 */

import { config } from 'dotenv'
import { join } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.reading'), override: false })

import { execSync } from 'child_process'
import { resolve } from 'path'
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from '@google/generative-ai'
import { parseResponse, writeItems, readIndex } from './shared.ts'
import type { Category, Level, ContentItem, GeneratedItem } from './shared.ts'

// ── Config ────────────────────────────────────────────────────────────────────

const QUEUE: Array<{ category: Category; level: Level }> = [
  { category: 'religion', level: 'B2' },
  { category: 'religion', level: 'C1' },
  { category: 'religion', level: 'C2' },
  { category: 'travel', level: 'B2' },
  { category: 'travel', level: 'C1' },
  { category: 'travel', level: 'C2' },
  { category: 'culture', level: 'B2' },
  { category: 'culture', level: 'C1' },
  { category: 'culture', level: 'C2' },
  { category: 'news', level: 'B2' },
  { category: 'news', level: 'C1' },
  { category: 'news', level: 'C2' },
  { category: 'literature', level: 'B2' },
  { category: 'literature', level: 'C1' },
  { category: 'literature', level: 'C2' },
  { category: 'health', level: 'B2' },
  { category: 'health', level: 'C1' },
  { category: 'health', level: 'C2' },
  { category: 'work', level: 'B2' },
  { category: 'work', level: 'C1' },
  { category: 'work', level: 'C2' },
  { category: 'technology', level: 'B2' },
  { category: 'technology', level: 'C1' },
  { category: 'technology', level: 'C2' },
  { category: 'social', level: 'B2' },
  { category: 'social', level: 'C1' },
  { category: 'social', level: 'C2' },
  { category: 'food', level: 'B2' },
  { category: 'food', level: 'C1' },
  { category: 'food', level: 'C2' },
  { category: 'education', level: 'B2' },
  { category: 'education', level: 'C1' },
  { category: 'education', level: 'C2' },
  { category: 'finance', level: 'B2' },
  { category: 'finance', level: 'C1' },
  { category: 'finance', level: 'C2' },
  { category: 'mysteries', level: 'B2' },
  { category: 'mysteries', level: 'C1' },
  { category: 'mysteries', level: 'C2' },
  { category: 'history', level: 'B2' },
  { category: 'history', level: 'C1' },
  { category: 'history', level: 'C2' },
  { category: 'psychology', level: 'B2' },
  { category: 'psychology', level: 'C1' },
  { category: 'psychology', level: 'C2' },
  { category: 'conversations', level: 'B2' },
  { category: 'conversations', level: 'C1' },
  { category: 'conversations', level: 'C2' },
  { category: 'idioms', level: 'B2' },
  { category: 'idioms', level: 'C1' },
  { category: 'idioms', level: 'C2' },
  { category: 'stories', level: 'B2' },
  { category: 'stories', level: 'C1' },
  { category: 'stories', level: 'C2' },
  { category: 'opinions', level: 'B2' },
  { category: 'opinions', level: 'C1' },
  { category: 'opinions', level: 'C2' },
]

const TARGET = parseInt(process.env['READING_TARGET'] ?? '100', 10)
const MODEL = process.env['READING_MODEL'] ?? 'gemini-flash-latest'
const BATCH: Record<Level, number> = {
  B1: parseInt(process.env['READING_BATCH_B1'] ?? '5', 10),
  B2: parseInt(process.env['READING_BATCH_B2'] ?? '5', 10),
  C1: parseInt(process.env['READING_BATCH_C1'] ?? '3', 10),
  C2: parseInt(process.env['READING_BATCH_C2'] ?? '2', 10),
}

// How many consecutive fully-invalid batches before we stop and scream
const MAX_CONSECUTIVE_FAILURES = 5

// ── Word-annotation validation ────────────────────────────────────────────────
//
// Identical logic to backfill-word-annotations.ts — keep in sync if either changes.

function bare(s: string): string {
  return s.replace(/[^\u0621-\u063A\u0641-\u064A]/g, '')
}

const FUNC_WORDS_DIACRITIZED = [
  'فِي','عَلَى','مِنْ','مِنَ','إِلَى','عَنْ','عَنِ','مَعَ','بَيْنَ',
  'بَعْدَ','قَبْلَ','حَتَّى','مُنْذُ','خِلَالَ','رَغْمَ','عَبْرَ',
  'فَوْقَ','دُونَ','لَدَى','لَدَيْهِ','لَدَيْهَا',
  'وَ','فَ','بِ','لِ','كَ',
  'أَنْ','إِنَّ','أَنَّ','إِنَّهُ','إِنَّهَا','إِنَّهُمْ',
  'أَنَّهُ','أَنَّهَا','أَنَّهُمْ','أَنَّهُمَا',
  'إِذَا','لَوْ','لَوْلَا','إِذْ','حَيْثُ','كَمَا',
  'إِلَّا','أَمَّا','لِذَلِكَ','لَكِنَّ','لَكِنْ','بَلْ',
  'أَوْ','ثُمَّ','إِنْ',
  'هُوَ','هِيَ','هُمْ','هُنَّ','هُمَا',
  'أَنَا','نَحْنُ','أَنْتَ','أَنْتِ','أَنْتُمْ','أَنْتُنَّ','أَنْتُمَا',
  'هَذَا','هَذِهِ','هَذَيْنِ','هَاتَيْنِ',
  'ذَلِكَ','تِلْكَ','ذَيْنِكَ','أُولَئِكَ',
  'الَّذِي','الَّتِي','الَّذِينَ','الَّاتِي','اللَّوَاتِي',
  'لَا','لَمْ','لَنْ','قَدْ','سَوْفَ','مَا','لَيْتَ','لَعَلَّ',
  'هَلْ','أَيْنَ','كَيْفَ','مَتَى','لِمَاذَا','لِمَ','مَنْ',
  'لَهُ','لَهَا','لَهُمْ','لَهُنَّ','لَنَا','لِي','لَكَ','لَكِ','لَكُمْ',
  'بِهِ','بِهَا','بِهِمْ','بِهِنَّ','بِنَا','بِكَ','بِكِ',
  'مِنْهُ','مِنْهَا','مِنْهُمْ','مِنْهُنَّ','مِنَّا','مِنْكَ',
  'فِيهِ','فِيهَا','فِيهِمْ','فِيهِنَّ','فِينَا','فِيكَ','فِيكِ',
  'عَلَيْهِ','عَلَيْهَا','عَلَيْهِمْ','عَلَيْهِنَّ','عَلَيْنَا','عَلَيْكَ',
  'إِلَيْهِ','إِلَيْهَا','إِلَيْهِمْ','إِلَيْنَا','إِلَيْكَ',
  'عَنْهُ','عَنْهَا','عَنْهُمْ','عَنَّا','عَنْكَ',
  'مَعَهُ','مَعَهَا','مَعَهُمْ','مَعَهُنَّ','مَعَنَا','مَعَكَ',
  'وَهُوَ','وَهِيَ','وَهُمْ','وَلَمْ','وَلَا','فَلَا','فَلَمْ',
  'وَمَا','فَمَا','وَإِنْ','فَإِنَّ','وَإِنَّ','وَأَنَّ','فَأَنَّ',
  'لَكِنَّهُ','لَكِنَّهَا','لَكِنَّهُمْ',
  'لِأَنَّهُ','لِأَنَّهَا','لِأَنَّهُمْ',
  'وَمِنْهُ','وَمِنْهَا','وَبِهِ','وَبِهَا','وَفِيهِ','وَفِيهَا',
  'وَعَلَيْهِ','وَإِلَيْهِ',
  'يَا','أَيُّهَا','أَيَّتُهَا',
  'هَلْ','لِلَّهِ','بِأَنْ','بِهَذَا','بِهَذِهِ','عَلَيْنَا',
]

const FUNC_BARE = new Set(FUNC_WORDS_DIACRITIZED.map(bare))

function contentWordCount(arabic: string): number {
  return arabic
    .split(/\s+/)
    .map(t => bare(t))
    .filter(b => b.length > 0 && !FUNC_BARE.has(b))
    .length
}

function annotatedCount(words: Array<{ w: string }>): number {
  return words.filter(w => bare(w.w).length > 0).length
}

// ── Validation ────────────────────────────────────────────────────────────────

interface AnnotationIssue {
  sentenceIdx: number
  arabic: string
  expected: number
  actual: number
}

/**
 * Validate word annotations for a generated item.
 * Returns an array of issues — empty array means the item is valid.
 */
function validateWordAnnotations(item: GeneratedItem): AnnotationIssue[] {
  const issues: AnnotationIssue[] = []

  for (let i = 0; i < item.sentences.length; i++) {
    const s = item.sentences[i]
    const expected = contentWordCount(s.arabic)
    if (expected === 0) continue // degenerate sentence, skip

    const actual = s.words ? annotatedCount(s.words) : 0
    if (actual !== expected) {
      issues.push({ sentenceIdx: i, arabic: s.arabic, expected, actual })
    }
  }

  return issues
}

function logValidationFailure(
  category: Category,
  level: Level,
  itemIndex: number,
  issues: AnnotationIssue[]
) {
  console.log(`\n  ❌ ${category}/${level} item ${itemIndex}: word annotation mismatch — DROPPED`)
  for (const issue of issues) {
    console.log(`    sentence ${issue.sentenceIdx + 1}: expected ${issue.expected} words, got ${issue.actual}`)
    console.log(`    arabic: ${issue.arabic.slice(0, 80)}${issue.arabic.length > 80 ? '...' : ''}`)
  }
}

function screamAndStop(reason: string, consecutiveFailures: number): never {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║   ⛔  GENERATION STOPPED — TOO MANY CONSECUTIVE VALIDATION FAILURES          ║
║                                                                              ║
║   ${reason.padEnd(76)}║
║   Consecutive failures: ${String(consecutiveFailures).padEnd(53)}║
║                                                                              ║
║   Possible causes:                                                           ║
║     • Gemini returning partial or empty words[] arrays                       ║
║     • Model not following word annotation instructions                       ║
║     • Prompt change broke the format                                         ║
║                                                                              ║
║   Action required: review the prompt in generate-reading-validated.ts        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)
  process.exit(2)
}

// ── Prompt ────────────────────────────────────────────────────────────────────

import { LEVEL_DESCRIPTIONS, CATEGORY_TOPICS } from './shared.ts'

const HALAL_FILTER = `
HALAL CONTENT FILTER (mandatory):
- Never mention alcohol, wine, beer, or any intoxicant
- Never mention pork or pork-derived ingredients
- Never include sexual content, romantic immodesty, or immoral relationships
- Never include gambling, lotteries, or interest-based (riba) financial schemes
- Never reference non-Islamic religious celebrations
- Never include idol worship, polytheism, superstition, or occult themes`

const RELIGION_EXTRA = `
RELIGION-SPECIFIC REQUIREMENTS:
- DO NOT include any Quranic ayat — zero tolerance for Quranic text errors
- Base each text ONLY on: authentic hadiths from Sahih Bukhari or Sahih Muslim (cite source in brackets), stories of the Companions, or scholarly commentary by Ibn Uthaymeen, Ibn Baz, al-Albani, Ibn Taymiyyah, or Ibn al-Qayyim
- Mainstream Sunni Islam only — no Sufi tariqa, no Shia content, no fabricated hadiths
- DO NOT quote hadith text verbatim — paraphrase meaning then cite, e.g. [أخرجه البخاري في كتاب الإيمان]`

function buildValidatedPrompt(category: Category, level: Level, count: number): string {
  const religionSection = category === 'religion' ? RELIGION_EXTRA : ''

  return `You are an expert Modern Standard Arabic (MSA / الفصحى) educator and linguist.

Generate ${count} unique learning texts for:
- Category: ${category} (topics: ${CATEGORY_TOPICS[category]})
- Level: ${level} — ${LEVEL_DESCRIPTIONS[level]}
${HALAL_FILTER}
${religionSection}
══════════════════════════════════════════════════════════════════
STRICT REQUIREMENTS
══════════════════════════════════════════════════════════════════

1. Arabic MUST be Modern Standard Arabic (فصحى), never colloquial
2. Every Arabic word MUST have complete harakat (diacritics: shadda, sukun, tanwin, fatha, kasra, damma)
3. Grammatically perfect and natural-sounding
4. Each text is a self-contained passage (sentence count per level description above)
5. Split into individual sentence objects: arabic + Bosnian translation + English translation
6. Translations must be fluent (not word-for-word), Bosnian uses ijekavica
7. Each text on a different specific topic within the category
8. Tags: 2–4 short English descriptors

══════════════════════════════════════════════════════════════════
WORD ANNOTATIONS — MANDATORY AND STRICT
══════════════════════════════════════════════════════════════════

Every sentence MUST include a "words" array. This is validated by an automated script.
If the word count does not match, the entire item is rejected and regenerated.

[INCLUDE in words[]] — every single one, no exceptions:
  ✓ All nouns (singular, plural, definite, indefinite, all case endings)
  ✓ All verbs (all forms, all tenses, all persons, passive and active)
  ✓ All adjectives and participles
  ✓ All adverbs (سَنَوِيًّا، جِدًّا، أَيْضًا، فَقَطْ، مَعًا، etc.)
  ✓ ALL proper nouns: country names, city names, months, cultural terms, names of people
    Examples: رَمَضَانُ، الْأَرْدُنُّ، مَكَّةُ، أَفْرِيقِيَا، إِسْبَانِيَا، الشَّامُ، الْقَاهِرَةُ
  ✓ Negation copula: لَيْسَ، لَيْسَتْ، لَسْتُ (all forms)
  ✓ Quantifiers with content: كُلٌّ، بَعْضٌ (all inflected forms)
  ✓ كَانَ / يَكُونُ and all their inflected forms

[SKIP from words[]] — only these:
  Prepositions:   فِي، عَلَى، مِنْ، إِلَى، عَنْ، مَعَ، بَيْنَ، بَعْدَ، قَبْلَ، خِلَالَ، حَتَّى، رَغْمَ، عَبْرَ
  Conjunctions:   وَ، فَ، ثُمَّ، أَوْ، لَكِنَّ، لَكِنْ، بَلْ، أَمَّا، كَمَا، إِذَا، لَوْ، أَنَّ، إِنَّ، أَنْ، إِنْ
  Pronouns:       هُوَ، هِيَ، هُمْ، أَنَا، نَحْنُ، أَنْتَ (all pronoun forms)
  Demonstratives: هَذَا، هَذِهِ، ذَلِكَ، تِلْكَ
  Relative:       الَّذِي، الَّتِي، الَّذِينَ
  Particles:      لَا (negation)، لَمْ، لَنْ، قَدْ، سَوْفَ، هَلْ
  Prep+pronoun:   فِيهِ، عَلَيْهَا، مِنْهُمْ، إِلَيْهِ (all preposition+suffix combinations)

"w" FIELD RULE — CRITICAL:
  Copy the word EXACTLY as it appears in the sentence, including fused prefixes:
  • Sentence has "وَيَجْمَعُ" → w="وَيَجْمَعُ" (NOT "يَجْمَعُ")
  • Sentence has "وَالتَّوَابِلِ" → w="وَالتَّوَابِلِ" (NOT "التَّوَابِلِ")
  • Sentence has "بِامْتِيَازٍ" → w="بِامْتِيَازٍ" (NOT "امْتِيَازٍ")
  The w value MUST be an exact space-separated token from the sentence.

LEMMA FORMATS:
  • Verb:         past + present     → "ذَهَبَ يَذْهَبُ"
  • Noun:         singular / plural  → "مَدِينَةٌ / مُدُنٌ"  (use "-" if no standard plural)
  • Adjective:    masc. sg. indef.   → "كَبِيرٌ"
  • Proper noun:  canonical form     → "رَمَضَانُ"
  • Adverb:       as-is              → "سَنَوِيًّا"

ADDITIONAL WORD FIELDS (bs, en, root):
  • bs: Bosnian meaning of this specific word
  • en: English meaning of this specific word
  • root: trilateral root with spaces (e.g. "ذ ه ب") — omit if no clear root

══════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════

Return ONLY a valid JSON array — no explanation, no markdown, no code blocks:
[
  {
    "sentences": [
      {
        "arabic": "ذَهَبَتِ الْعَائِلَةُ إِلَى الْمَطَارِ صَبَاحًا.",
        "translation": "Porodica je otišla na aerodrom ujutro.",
        "translationEn": "The family went to the airport in the morning.",
        "words": [
          { "w": "ذَهَبَتِ", "lemma": "ذَهَبَ يَذْهَبُ", "root": "ذ ه ب", "bs": "otišla je", "en": "went" },
          { "w": "الْعَائِلَةُ", "lemma": "عَائِلَةٌ / عَائِلَاتٌ", "root": "ع و ل", "bs": "porodica", "en": "family" },
          { "w": "الْمَطَارِ", "lemma": "مَطَارٌ / مَطَارَاتٌ", "root": "ط ي ر", "bs": "aerodrom", "en": "airport" },
          { "w": "صَبَاحًا", "lemma": "صَبَاحٌ / أَصْبَاحٌ", "root": "ص ب ح", "bs": "jutro", "en": "morning" }
        ]
      }
    ],
    "tags": ["travel", "family"]
  }
]

Generate exactly ${count} items. Each item must have between ${sentenceRange(level)} sentences.`
}

function sentenceRange(level: Level): string {
  return { B1: '3 and 4', B2: '4 and 6', C1: '5 and 7', C2: '6 and 8' }[level]
}

// ── Notification ──────────────────────────────────────────────────────────────

function notify(message: string) {
  try {
    execSync(`osascript -e 'display notification "${message}" with title "FushaLab"'`, {
      stdio: 'ignore',
    })
  } catch {
    // non-critical
  }
}

// ── Commit ────────────────────────────────────────────────────────────────────

function commitContent(perLevel: Map<string, number>) {
  const root = resolve(import.meta.dirname, '..')
  try {
    execSync('git add public/data/', { cwd: root, stdio: 'inherit' })
    const staged = execSync('git diff --cached --name-only', { cwd: root }).toString().trim()
    if (!staged) {
      console.log('\n📦 Nothing new to commit.')
      return
    }
    const breakdown =
      perLevel.size > 0
        ? [...perLevel.entries()].map(([k, n]) => `${k} +${n}`).join(', ')
        : 'sync data files'
    console.log('\n📦 Committing new content...')
    execSync(`git commit -m "content(reading): ${breakdown}"`, { cwd: root, stdio: 'inherit' })
    console.log('  ✓ Committed locally')
    notify('Reading content committed')
  } catch (err) {
    console.error('  ✗ Git commit failed:', err)
    notify('Warning: content generated but git commit failed')
  }
}

// ── Key rotation ──────────────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (apiKeys.length === 0) {
  console.error('Error: GEMINI_API_KEYS not set in data-generation/.env')
  notify('Error: GEMINI_API_KEYS not configured')
  process.exit(1)
}

let currentKeyIndex = 0
const exhaustedKeys = new Set<number>()
let consecutiveWaits = 0
const MAX_CONSECUTIVE_WAITS = 1

function nextAvailableKey(): number | null {
  for (let i = 0; i < apiKeys.length; i++) {
    const idx = (currentKeyIndex + i) % apiKeys.length
    if (!exhaustedKeys.has(idx)) return idx
  }
  return null
}

// ── Gemini call ───────────────────────────────────────────────────────────────

async function generateWithRetry(prompt: string): Promise<string> {
  let recitationAttempts = 0
  const maxRecitationAttempts = 3
  let consecutiveRateLimits = 0

  while (true) {
    const keyIdx = nextAvailableKey()
    if (keyIdx === null) throw new Error('ALL_KEYS_EXHAUSTED')
    currentKeyIndex = keyIdx

    const gemini = new GoogleGenerativeAI(apiKeys[keyIdx]).getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    })

    try {
      const result = await gemini.generateContent(prompt)
      consecutiveRateLimits = 0
      consecutiveWaits = 0
      return result.response.text()
    } catch (err) {
      if (err instanceof GoogleGenerativeAIResponseError) {
        const reason = err.response?.candidates?.[0]?.finishReason
        if (reason === 'RECITATION') {
          recitationAttempts++
          if (recitationAttempts >= maxRecitationAttempts) throw new Error('RECITATION_SKIP')
          console.log(`  ⚠️  RECITATION — retrying (${recitationAttempts}/${maxRecitationAttempts})...`)
          continue
        }
        throw err
      }

      if (!(err instanceof GoogleGenerativeAIFetchError)) throw err

      if (err.status === 503) {
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        const availableKeys = apiKeys.length - exhaustedKeys.size
        if (consecutiveRateLimits >= availableKeys) {
          consecutiveWaits++
          if (consecutiveWaits > MAX_CONSECUTIVE_WAITS) throw new Error('ALL_KEYS_EXHAUSTED')
          console.log(`  ⏳ All keys 503 — waiting 30s...`)
          await new Promise(r => setTimeout(r, 30_000))
          consecutiveRateLimits = 0
        } else {
          console.log(`  ⚠️  503 on key ${keyIdx + 1} — switching...`)
        }
        continue
      }

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
          console.log(`  🔑 Switching to key ${next + 1}/${apiKeys.length}...`)
          consecutiveRateLimits = 0
          continue
        }
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        const availableKeys = apiKeys.length - exhaustedKeys.size
        if (consecutiveRateLimits >= availableKeys) {
          consecutiveWaits++
          if (consecutiveWaits > MAX_CONSECUTIVE_WAITS) throw new Error('ALL_KEYS_EXHAUSTED')
          console.log(`  ⏳ All keys rate-limited — waiting 60s (${consecutiveWaits}/${MAX_CONSECUTIVE_WAITS})...`)
          await new Promise(r => setTimeout(r, 60_000))
          consecutiveRateLimits = 0
          continue
        }
        console.log(`  🔑 Rate limited on key ${keyIdx + 1} — switching...`)
        continue
      }

      throw err
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🕌 FushaLab Reading Generator (Validated)`)
console.log(`   Model  : ${MODEL}`)
console.log(`   Target : ${TARGET} items per level`)
console.log(`   Keys   : ${apiKeys.length}`)
console.log(`   Validation: STRICT — items rejected if word counts don't match\n`)

let totalGenerated = 0
let totalRejected = 0
const generatedPerLevel = new Map<string, number>()

for (const { category, level } of QUEUE) {
  const current = readIndex(category, level).items.length

  if (current >= TARGET) {
    console.log(`✅ ${category}/${level}: ${current}/${TARGET} — complete, skipping`)
    continue
  }

  const needed = TARGET - current
  console.log(`\n📝 ${category}/${level}: ${current}/${TARGET} — generating ${needed} more...`)

  let generated = 0
  let parseFailures = 0
  const maxParseFailures = 3
  let consecutiveInvalidBatches = 0

  while (generated < needed) {
    const batchSize = Math.min(BATCH[level], needed - generated)

    let raw: string
    try {
      raw = await generateWithRetry(buildValidatedPrompt(category, level, batchSize))
    } catch (err) {
      if (err instanceof Error && err.message === 'ALL_KEYS_EXHAUSTED') {
        console.log(`\n⛔ All API keys exhausted after ${totalGenerated} items total.`)
        commitContent(generatedPerLevel)
        process.exit(0)
      }
      if (err instanceof Error && err.message === 'RECITATION_SKIP') {
        console.log(`  ⏭  Skipping batch — RECITATION persisted`)
        consecutiveInvalidBatches++
        if (consecutiveInvalidBatches >= MAX_CONSECUTIVE_FAILURES) {
          screamAndStop('Repeated RECITATION errors — model refusing to generate', consecutiveInvalidBatches)
        }
        break
      }
      console.error(`\nUnexpected error:`, err)
      notify(`Error generating ${category}/${level}`)
      process.exit(1)
    }

    let items: GeneratedItem[]
    try {
      items = parseResponse(raw!)
      parseFailures = 0
    } catch {
      parseFailures++
      if (parseFailures >= maxParseFailures) {
        console.log(`  ⏭  Skipping batch — malformed JSON persisted`)
        consecutiveInvalidBatches++
        if (consecutiveInvalidBatches >= MAX_CONSECUTIVE_FAILURES) {
          screamAndStop('Repeated malformed JSON responses from Gemini', consecutiveInvalidBatches)
        }
        break
      }
      console.log(`  ⚠️  Malformed JSON — retrying (${parseFailures}/${maxParseFailures})...`)
      continue
    }

    // ── Validate word annotations for each item ────────────────────────────────
    const validItems: GeneratedItem[] = []
    let batchHadInvalid = false

    for (let i = 0; i < items.length; i++) {
      const issues = validateWordAnnotations(items[i])
      if (issues.length === 0) {
        validItems.push(items[i])
      } else {
        logValidationFailure(category, level, i + 1, issues)
        totalRejected++
        batchHadInvalid = true
      }
    }

    if (validItems.length === 0) {
      // Entire batch was rejected
      consecutiveInvalidBatches++
      console.log(`  ⚠️  Entire batch rejected (${consecutiveInvalidBatches}/${MAX_CONSECUTIVE_FAILURES} consecutive failures)`)
      if (consecutiveInvalidBatches >= MAX_CONSECUTIVE_FAILURES) {
        screamAndStop(
          `All items in ${consecutiveInvalidBatches} consecutive batches failed word-count validation`,
          consecutiveInvalidBatches
        )
      }
      await new Promise(r => setTimeout(r, 3000))
      continue
    }

    if (!batchHadInvalid) {
      consecutiveInvalidBatches = 0 // reset on a clean batch
    }

    // ── Write valid items ──────────────────────────────────────────────────────
    writeItems(category, level, validItems)
    generated += validItems.length
    totalGenerated += validItems.length
    generatedPerLevel.set(
      `${category}/${level}`,
      (generatedPerLevel.get(`${category}/${level}`) ?? 0) + validItems.length
    )

    const rejectedThisBatch = items.length - validItems.length
    const statusSuffix = rejectedThisBatch > 0 ? ` (${rejectedThisBatch} rejected)` : ''
    console.log(`  ✓ ${validItems.length} items written (${current + generated}/${TARGET})${statusSuffix}`)

    if (generated < needed) await new Promise(r => setTimeout(r, 5000))
  }
}

if (totalGenerated === 0) {
  console.log('\n🎉 All reading levels at target — nothing to generate.')
  notify('Reading: all levels complete!')
} else {
  console.log(`\n📊 Session summary: ${totalGenerated} items written, ${totalRejected} items rejected`)
  commitContent(generatedPerLevel)
}
