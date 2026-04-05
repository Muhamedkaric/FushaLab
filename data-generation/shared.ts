import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export type Category =
  | 'travel'
  | 'culture'
  | 'news'
  | 'literature'
  | 'religion'
  | 'health'
  | 'work'
  | 'technology'
  | 'social'
  | 'food'
  | 'education'
  | 'finance'
  | 'mysteries'
  | 'history'
  | 'psychology'
  | 'conversations'
  | 'idioms'
  | 'stories'
  | 'opinions'
export type Level = 'B1' | 'B2' | 'C1' | 'C2'

export interface WordAnnotation {
  w: string // exact vocalized form as it appears in the sentence
  lemma?: string // dictionary form: verb = "فَعَلَ يَفْعَلُ", noun = "فَاعِلٌ / فَوَاعِلُ", adj = "فَاعِلٌ"
  root?: string // trilateral root with spaces, e.g. "د ر س"
  bs: string // Bosnian meaning
  en: string // English meaning
}

export interface Sentence {
  arabic: string
  translation: string // Bosnian
  translationEn: string // English
  words?: WordAnnotation[]
}

export interface GeneratedItem {
  sentences: Sentence[]
  tags: string[]
}

export interface ContentItem {
  id: string
  category: Category
  level: Level
  sentences: Sentence[]
  metadata: { difficulty: 1 | 2 | 3; tags: string[] }
}

export interface LevelIndex {
  items: Array<{
    id: string
    arabic: string // sentences[0].arabic — used as preview in the UI
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
  B1: 'Simple sentences, present and past tense, everyday vocabulary. Length: 3–4 short sentences covering one clear idea.',
  B2: 'Compound and complex sentences, richer vocabulary, idiomatic expressions, subordinate clauses. Length: 4–6 sentences developing a topic with some nuance.',
  C1: 'Complex multi-clause sentences, formal register, advanced grammar (conditional, passive, nominal sentences). Length: 5–7 sentences with introduction, development, and a conclusion.',
  C2: 'Sophisticated literary, journalistic, or scholarly prose. Rare vocabulary, complex structures, rhetorical devices (metaphor, parallel structure). Length: 6–8 sentences on a substantive theme.',
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
  health:
    'physical health, nutrition, exercise, medicine, hospitals, pharmacies, mental wellness, healthy habits, preventive care, first aid',
  work: 'careers, workplace, professions, job interviews, productivity, entrepreneurship, office life, teamwork, professional skills, work-life balance',
  technology:
    'computers, internet, artificial intelligence, smartphones, software, innovation, cybersecurity, digital tools, programming, modern tech in the Arab world',
  social:
    'social media platforms, online communication, digital communities, content creation, internet culture, privacy, screen time, online news, influencers',
  food: 'halal cuisine, cooking, recipes, Arab traditional food, markets, restaurants, ingredients, food culture, nutrition — only halal food and drink, no pork or alcohol',
  education:
    'schools, universities, learning, study habits, academic life, scholarships, teachers, curricula, libraries, lifelong learning',
  finance:
    'personal budgeting, business, trade, markets, economics, Islamic finance, saving, investment, banking, entrepreneurship, financial literacy',
  mysteries:
    'detective stories, historical mysteries, unsolved cases, investigative journalism, scientific puzzles, archaeological discoveries — rational and investigative only, no occult or superstition',
  history:
    'world history, Arab and Islamic civilisation, ancient civilisations, historical events, empires, archaeology, historical figures, the Islamic Golden Age',
  psychology:
    'human behaviour, mental health, cognitive science, emotions, motivation, decision-making, personality, communication, self-improvement, social psychology',
  conversations:
    'everyday dialogues, greetings, social interactions, formal discussions, phone calls, negotiations, debates, interviews, expressing opinions',
  idioms:
    'Arabic proverbs (أمثال), common idiomatic expressions, figurative language, cultural sayings, metaphors — explain meaning and origin',
  stories:
    'short narratives, folk tales, moral fables, anecdotes, parables, fictional vignettes — self-contained stories with a clear beginning, middle, and end',
  opinions:
    'editorials, viewpoints, argumentative essays, commentary on society, science, education, and environment — balanced, reasoned perspectives',
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

// ── Inline validation ─────────────────────────────────────────────────────────

const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/

export interface ValidationIssue {
  id: string
  type: 'error' | 'warning'
  message: string
}

export function validateItems(items: ContentItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const item of items) {
    if (!Array.isArray(item.sentences) || item.sentences.length === 0) {
      issues.push({ id: item.id, type: 'error', message: 'sentences array is empty or missing' })
      continue
    }

    for (let i = 0; i < item.sentences.length; i++) {
      const s = item.sentences[i]
      if (!s.arabic?.trim())
        issues.push({ id: item.id, type: 'error', message: `sentences[${i}].arabic is empty` })
      if (!s.translation?.trim())
        issues.push({ id: item.id, type: 'error', message: `sentences[${i}].translation is empty` })
      if (!s.translationEn?.trim())
        issues.push({
          id: item.id,
          type: 'error',
          message: `sentences[${i}].translationEn is empty`,
        })

      if (s.arabic && !HARAKAT_REGEX.test(s.arabic)) {
        issues.push({
          id: item.id,
          type: 'warning',
          message: `sentences[${i}].arabic has no harakat`,
        })
      }
    }
  }

  return issues
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
      sentences: generated[i].sentences,
      metadata: { difficulty, tags: generated[i].tags },
    }

    const filePath = join(dir, `${id}.json`)
    const serialized = JSON.stringify(item, null, 2)
    writeFileSync(filePath, serialized)
    // Verify the written file parses correctly
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

  // Inline validation — report issues immediately
  const issues = validateItems(written)
  if (issues.length > 0) {
    console.log(`\n  ⚠️  Validation issues in this batch:`)
    for (const issue of issues) {
      const icon = issue.type === 'error' ? '❌' : '⚠️ '
      console.log(`    ${icon} ${issue.id}: ${issue.message}`)
    }
    const errors = issues.filter(i => i.type === 'error')
    if (errors.length > 0) {
      console.log(`  ❌ ${errors.length} validation error(s) — review the generated content\n`)
    }
  }

  // Update index.json — arabic field = first 10 words of sentences[0].arabic (UI preview only)
  const index = readIndex(category, level)
  for (const item of written) {
    const firstArabic = item.sentences[0]?.arabic ?? ''
    const preview = firstArabic.split(' ').slice(0, 10).join(' ')
    index.items.push({ id: item.id, arabic: preview, metadata: item.metadata })
  }
  const indexPath = join(dir, 'index.json')
  writeFileSync(indexPath, JSON.stringify(index, null, 2))
  console.log(`  ✓ index.json updated (${index.items.length} total items)`)

  return written
}

// ── Prompt ────────────────────────────────────────────────────────────────────

// Applies to every category — content must be halal even when not explicitly Islamic
const HALAL_FILTER = `
HALAL CONTENT FILTER (mandatory for ALL categories):
- Never mention alcohol, wine, beer, or any intoxicant
- Never mention pork, lard, or any pork-derived ingredient
- Never include sexual content, romantic immodesty, or immoral relationships
- Never include gambling, lotteries, or interest-based (riba) financial schemes
- Never reference Christmas, Easter, Diwali, Hanukkah, or other non-Islamic religious celebrations
- Never include idol worship, polytheism, superstition, fortune-telling, or occult themes
- Texts do not need to be Islamic in subject — they just need to be free of haram content
  (e.g., "She enjoys cooking lentil soup" is fine; "He poured himself a glass of wine" is not)`

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
4. Each text must be a full, self-contained passage — follow the sentence count in the level description
5. Split the text into individual sentences. Each sentence object contains: its Arabic sentence, the Bosnian translation of that sentence, and the English translation of that sentence
6. Translations must be fluent and natural — not word-for-word
7. Bosnian translation should use correct Bosnian grammar and vocabulary (ijekavica)
8. Each text must be on a different specific topic within the category
9. Tags: 2–4 short English descriptors relevant to the text content
10. Each sentence MUST include a "words" array of annotated content words (see format below)
${HALAL_FILTER}
${religionSection}
WORD ANNOTATIONS ("words" array per sentence):
- Include only CONTENT words: nouns, verbs, adjectives, adverbs — skip function words
- Skip: فِي، عَلَى، مِنْ، إِلَى، وَ، فَ، بِ، لِ، أَنْ، إِنَّ، هُوَ، هِيَ، هَذَا، ذَلِكَ، لَا، لَمْ، قَدْ، كَانَ (as copula only), proper nouns
- Each word entry: w (exact form as in sentence with full harakat), lemma, root (if trilateral), bs, en
- lemma formats:
  * Verb: past + present separated by space — e.g. "ذَهَبَ يَذْهَبُ"
  * Noun: singular / plural — e.g. "مَطَارٌ / مَطَارَاتٌ"
  * Adjective: masculine singular indefinite — e.g. "جَمِيلٌ"
- root: three-letter root with spaces between letters — e.g. "ذ ه ب" — omit if no clear trilateral root
- bs: Bosnian meaning of this specific word (not the whole sentence)
- en: English meaning of this specific word
- Aim for 3–6 annotated words per sentence

Return ONLY a valid JSON array — no explanation, no markdown, no code blocks.
Format:
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
    "tags": ["tag1", "tag2"]
  }
]

Generate exactly ${count} items. Each item must have between ${sentenceRange(level)} sentences.`
}

function sentenceRange(level: Level): string {
  return { B1: '3 and 4', B2: '4 and 6', C1: '5 and 7', C2: '6 and 8' }[level]
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

    if (!Array.isArray(o['sentences']) || o['sentences'].length === 0)
      throw new Error(`Item ${i} missing "sentences" array`)

    const sentences: Sentence[] = (o['sentences'] as unknown[]).map((s: unknown, j: number) => {
      if (typeof s !== 'object' || s === null)
        throw new Error(`Item ${i} sentence ${j} is not an object`)
      const sv = s as Record<string, unknown>
      if (typeof sv['arabic'] !== 'string')
        throw new Error(`Item ${i} sentence ${j} missing "arabic"`)
      if (typeof sv['translation'] !== 'string')
        throw new Error(`Item ${i} sentence ${j} missing "translation"`)
      if (typeof sv['translationEn'] !== 'string')
        throw new Error(`Item ${i} sentence ${j} missing "translationEn"`)

      const words: WordAnnotation[] | undefined = Array.isArray(sv['words'])
        ? (sv['words'] as unknown[]).flatMap((w: unknown) => {
            if (typeof w !== 'object' || w === null) return []
            const wv = w as Record<string, unknown>
            if (typeof wv['w'] !== 'string' || typeof wv['bs'] !== 'string' || typeof wv['en'] !== 'string') return []
            return [{
              w: wv['w'] as string,
              ...(typeof wv['lemma'] === 'string' ? { lemma: wv['lemma'] } : {}),
              ...(typeof wv['root'] === 'string' ? { root: wv['root'] } : {}),
              bs: wv['bs'] as string,
              en: wv['en'] as string,
            }]
          })
        : undefined

      return {
        arabic: sv['arabic'] as string,
        translation: sv['translation'] as string,
        translationEn: sv['translationEn'] as string,
        ...(words && words.length > 0 ? { words } : {}),
      }
    })

    return {
      sentences,
      tags: Array.isArray(o['tags']) ? (o['tags'] as string[]) : [],
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

const VALID_CATEGORIES: Category[] = [
  'travel',
  'culture',
  'news',
  'literature',
  'religion',
  'health',
  'work',
  'technology',
  'social',
  'food',
  'education',
  'finance',
  'mysteries',
  'history',
  'psychology',
  'conversations',
  'idioms',
  'stories',
  'opinions',
]
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
      '\nExample:\n  pnpm generate --category travel --level B1 --count 10 --model gemini-2.0-flash'
    )
    process.exit(1)
  }

  return { category, level, count, model }
}
