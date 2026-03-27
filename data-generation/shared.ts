import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export type Category = 'travel' | 'culture' | 'news' | 'literature' | 'religion'
export type Level = 'B1' | 'B2' | 'C1' | 'C2'

export interface GeneratedItem {
  arabic: string
  translation: string // Bosnian
  translationEn: string // English
  tags: string[]
}

export interface ContentItem extends GeneratedItem {
  id: string
  category: Category
  level: Level
  metadata: { difficulty: 1 | 2 | 3; tags: string[] }
}

export interface LevelIndex {
  items: Array<{
    id: string
    arabic: string
    metadata: { difficulty: number; tags: string[] }
  }>
}

// ── Config ───────────────────────────────────────────────────────────────────

export const DIFFICULTY: Record<Level, 1 | 2 | 3> = {
  B1: 1,
  B2: 2,
  C1: 2,
  C2: 3,
}

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  B1: 'Simple sentences, present and past tense, everyday vocabulary. Length: a short paragraph of 4–6 sentences covering one clear idea.',
  B2: 'Compound and complex sentences, richer vocabulary, idiomatic expressions, subordinate clauses. Length: a solid paragraph of 6–9 sentences developing a topic with some nuance.',
  C1: 'Complex multi-clause sentences, formal register, advanced grammar (conditional, passive, nominal sentences). Length: two paragraphs (10–14 sentences) with introduction, development, and a conclusion.',
  C2: 'Sophisticated literary, journalistic, or scholarly prose. Rare vocabulary, complex structures, rhetorical devices (metaphor, parallel structure). Length: two to three paragraphs (14–20 sentences) on a substantive theme.',
}

export const CATEGORY_TOPICS: Record<Category, string> = {
  travel:
    'travel, tourism, transportation, accommodation, airports, cities, sightseeing, maps, booking',
  culture:
    'Arab culture, traditions, food, music, art, history, customs, festivals, family life, hospitality',
  news: 'current events, politics, economy, technology, environment, international relations, society',
  literature:
    'poetry, storytelling, classical Arabic literature, prose, metaphor, imagery, Quran-inspired language',
  religion:
    'Islamic practice, prayer, Quran (with ayah references), authentic hadiths from Sahih Bukhari or Sahih Muslim, the lives and rulings of the Companions, aqeedah (creed), fiqh (jurisprudence), ethics, seerah (Prophetic biography), and scholarly explanations from Ibn Uthaymeen, Ibn Baz, al-Albani, Ibn Taymiyyah, Ibn al-Qayyim, or Imam al-Bukhari — Sunni mainstream only, no Sufi mysticism, no Shia content',
}

// ── Paths ────────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(import.meta.dirname, '../public/data')

export function getDataDir(category: Category, level: Level) {
  return join(DATA_DIR, category, level)
}

// ── Index helpers ─────────────────────────────────────────────────────────────

export function readIndex(category: Category, level: Level): LevelIndex {
  const indexPath = join(getDataDir(category, level), 'index.json')
  if (!existsSync(indexPath)) return { items: [] }
  return JSON.parse(readFileSync(indexPath, 'utf-8')) as LevelIndex
}

export function nextItemNumber(category: Category, level: Level): number {
  const index = readIndex(category, level)
  return index.items.length + 1
}

export function makeId(category: Category, level: Level, n: number): string {
  return `${category}-${level.toLowerCase()}-${String(n).padStart(3, '0')}`
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export function writeItems(
  category: Category,
  level: Level,
  generated: GeneratedItem[]
): ContentItem[] {
  const dir = getDataDir(category, level)
  mkdirSync(dir, { recursive: true })

  const startN = nextItemNumber(category, level)
  const difficulty = DIFFICULTY[level]
  const written: ContentItem[] = []

  for (let i = 0; i < generated.length; i++) {
    const n = startN + i
    const id = makeId(category, level, n)
    const item: ContentItem = {
      id,
      category,
      level,
      arabic: generated[i].arabic,
      translation: generated[i].translation,
      translationEn: generated[i].translationEn,
      metadata: { difficulty, tags: generated[i].tags },
    }

    const filePath = join(dir, `${id}.json`)
    const serialized = JSON.stringify(item, null, 2)
    writeFileSync(filePath, serialized)
    // Validate the written file parses correctly — catch any FS or encoding edge cases
    try {
      JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch {
      unlinkSync(filePath)
      console.error(`  ✗ ${id}: written file failed JSON validation — deleted, skipping`)
      continue
    }
    console.log(`  ✓ ${filePath.replace(DATA_DIR + '/', '')}`)
    written.push(item)
  }

  // Update index.json
  const index = readIndex(category, level)
  for (const item of written) {
    index.items.push({ id: item.id, arabic: item.arabic, metadata: item.metadata })
  }
  const indexPath = join(dir, 'index.json')
  writeFileSync(indexPath, JSON.stringify(index, null, 2))
  console.log(`  ✓ index.json updated (${index.items.length} total items)`)

  return written
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const RELIGION_EXTRA = `
RELIGION-SPECIFIC REQUIREMENTS:
- DO NOT include any Quranic ayat — there is zero tolerance for mistakes in Quranic text
- Base each text ONLY on: authentic hadiths from Sahih Bukhari or Sahih Muslim (cite collection + book + hadith number), stories of the Companions (seerah of Sahabah), or explanatory scholarly commentary by Ibn Uthaymeen, Ibn Baz, al-Albani, Ibn Taymiyyah, or Ibn al-Qayyim
- Stick to mainstream Sunni Islam — no Sufi tariqa content, no Shia content, no fabricated (mawdu') or weak (da'if) hadiths
- DO NOT quote hadith text verbatim — paraphrase the meaning in your own original MSA prose instead, then cite the source in brackets, e.g.: [أخرجه البخاري في كتاب الإيمان]
- Each text should be a coherent educational passage: introduce the hadith or story, explain its meaning, and draw a practical moral lesson
- Topics to rotate across items: aqeedah (tawhid, sifat Allah), salah, zakah, sawm, hajj, seerah of the Prophet, stories of Companions, adab (manners), dhikr, fiqh rulings, tawbah, ikhlas, tawakkul, birr al-walidayn, halal/haram, signs of qiyamah`

export function buildPrompt(category: Category, level: Level, count: number): string {
  const religionSection = category === 'religion' ? RELIGION_EXTRA : ''

  return `You are an expert Modern Standard Arabic (MSA / الفصحى) educator and linguist.

Generate ${count} unique learning texts for the following specification:
- Category: ${category} (topics: ${CATEGORY_TOPICS[category]})
- Level: ${level}
- Level description: ${LEVEL_DESCRIPTIONS[level]}

STRICT REQUIREMENTS:
1. Arabic MUST be Modern Standard Arabic (فصحى), never colloquial or dialect
2. Every single Arabic word MUST have complete and correct harakat (تشكيل / diacritics)
   — this means shadda (ّ), sukun (ْ), tanwin (ً ٍ ٌ), fatha (َ), kasra (ِ), damma (ُ) where applicable
3. The Arabic must be grammatically perfect and natural-sounding
4. Each text must be a full, self-contained passage — follow the length specified in the level description above
5. Translations must be fluent and natural — not word-for-word
6. Bosnian translation should use correct Bosnian grammar and vocabulary
7. Each text must be on a different specific topic within the category
8. Tags: 2–4 short English descriptors relevant to the text content
${religionSection}
Return ONLY a valid JSON array — no explanation, no markdown, no code blocks.
Format:
[
  {
    "arabic": "النص العربي مع الشكل الكامل.",
    "translation": "Bosanski prijevod.",
    "translationEn": "English translation.",
    "tags": ["tag1", "tag2"]
  }
]

Generate exactly ${count} items.`
}

// ── Parse response ────────────────────────────────────────────────────────────

export function parseResponse(raw: string): GeneratedItem[] {
  // Strip possible markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as unknown

  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array')

  return parsed.map((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) throw new Error(`Item ${i} is not an object`)
    const o = item as Record<string, unknown>
    if (typeof o['arabic'] !== 'string') throw new Error(`Item ${i} missing "arabic"`)
    if (typeof o['translation'] !== 'string') throw new Error(`Item ${i} missing "translation"`)
    if (typeof o['translationEn'] !== 'string') throw new Error(`Item ${i} missing "translationEn"`)
    return {
      arabic: o['arabic'],
      translation: o['translation'],
      translationEn: o['translationEn'],
      tags: Array.isArray(o['tags']) ? (o['tags'] as string[]) : [String(category)],
    }
  })
}

// ── Args parser ───────────────────────────────────────────────────────────────

export interface Args {
  category: Category
  level: Level
  count: number
  model: string
}

const VALID_CATEGORIES: Category[] = ['travel', 'culture', 'news', 'literature', 'religion']
const VALID_LEVELS: Level[] = ['B1', 'B2', 'C1', 'C2']

export function parseArgs(defaults: { model: string }): Args {
  const argv = process.argv.slice(2)
  const get = (flag: string) => {
    const i = argv.indexOf(flag)
    return i !== -1 ? argv[i + 1] : undefined
  }

  const category = (get('--category') ?? '') as Category
  const level = (get('--level') ?? '') as Level
  const count = parseInt(get('--count') ?? '10', 10)
  const model = get('--model') ?? defaults.model

  const errors: string[] = []
  if (!VALID_CATEGORIES.includes(category))
    errors.push(`--category must be one of: ${VALID_CATEGORIES.join(', ')}`)
  if (!VALID_LEVELS.includes(level))
    errors.push(`--level must be one of: ${VALID_LEVELS.join(', ')}`)
  if (isNaN(count) || count < 1 || count > 50)
    errors.push('--count must be a number between 1 and 50')

  if (errors.length > 0) {
    console.error('Usage errors:\n  ' + errors.join('\n  '))
    console.error(
      '\nExample:\n  pnpm generate --category travel --level B1 --count 10 --model claude-opus-4-6'
    )
    process.exit(1)
  }

  return { category, level, count, model }
}
