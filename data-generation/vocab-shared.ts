import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export type VocabLevel = 'B1' | 'B2' | 'C1' | 'C2'

export type VocabTopic =
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
  | 'history'
  | 'psychology'
  | 'general'

export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'particle'
  | 'phrase'

export type GenerationType = 'words' | 'roots'

// ── Word set types ────────────────────────────────────────────────────────────

export interface VocabWord {
  arabic: string // with full harakat
  root: string // "ك ت ب" (space-separated letters)
  type: WordType
  bs: string // Bosnian translation
  en: string // English translation
  exampleArabic: string // full example sentence with harakat
  exampleBs: string
  exampleEn: string
}

export interface VocabSet {
  id: string // "b1-travel"
  title: string // "Travel Essentials"
  titleAr: string // "مُفْرَدَاتُ السَّفَرِ"
  level: VocabLevel
  topic: VocabTopic
  words: VocabWord[]
}

// ── Root entry types ──────────────────────────────────────────────────────────

export type RootFormType =
  | 'verb-past'
  | 'verb-present'
  | 'verbal-noun'
  | 'noun'
  | 'active-participle'
  | 'passive-participle'
  | 'noun-place'
  | 'adjective'
  | 'elative' // أفعل التفضيل

export interface RootForm {
  arabic: string
  type: RootFormType
  bs: string
  en: string
}

export interface VocabRoot {
  id: string // "k-t-b"
  root: string // "ك ت ب"
  rootMeaning: string // "writing, inscription"
  level: VocabLevel // primary level where this root is introduced
  forms: RootForm[]
  exampleSentence: {
    arabic: string
    bs: string
    en: string
  }
  tags: string[]
}

// ── Index ─────────────────────────────────────────────────────────────────────

export interface VocabSetMeta {
  id: string
  title: string
  titleAr: string
  level: VocabLevel
  topic: VocabTopic
  wordCount: number
}

export interface VocabRootMeta {
  id: string
  root: string
  rootMeaning: string
  level: VocabLevel
  formCount: number
}

export interface VocabIndex {
  sets: VocabSetMeta[]
  roots: VocabRootMeta[]
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(import.meta.dirname, '../public/data/vocabulary')
const SETS_DIR = join(DATA_DIR, 'sets')
const ROOTS_DIR = join(DATA_DIR, 'roots')
const INDEX_PATH = join(DATA_DIR, 'index.json')

export function ensureDirs() {
  mkdirSync(SETS_DIR, { recursive: true })
  mkdirSync(ROOTS_DIR, { recursive: true })
}

// ── Index helpers ─────────────────────────────────────────────────────────────

export function readVocabIndex(): VocabIndex {
  if (!existsSync(INDEX_PATH)) return { sets: [], roots: [] }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8')) as VocabIndex
}

function writeVocabIndex(index: VocabIndex) {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2))
}

// ── Set ID ────────────────────────────────────────────────────────────────────

export function makeSetId(level: VocabLevel, topic: VocabTopic): string {
  return `${level.toLowerCase()}-${topic}`
}

// ── Root ID ───────────────────────────────────────────────────────────────────

export function makeRootSlug(root: string): string {
  // "ك ت ب" → "k-t-b" using transliteration map
  const map: Record<string, string> = {
    ا: 'a',
    أ: 'a',
    إ: 'i',
    آ: 'aa',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'j',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'dh',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    و: 'w',
    ي: 'y',
    ى: 'a',
  }
  return root
    .split(' ')
    .map(letter => map[letter] ?? letter)
    .join('-')
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export function writeWordSet(set: VocabSet): void {
  ensureDirs()
  const filePath = join(SETS_DIR, `${set.id}.json`)
  writeFileSync(filePath, JSON.stringify(set, null, 2))
  console.log(`  ✓ ${filePath.replace(DATA_DIR + '/', 'vocabulary/')}`)

  // Update index
  const index = readVocabIndex()
  const existing = index.sets.findIndex(s => s.id === set.id)
  const meta: VocabSetMeta = {
    id: set.id,
    title: set.title,
    titleAr: set.titleAr,
    level: set.level,
    topic: set.topic,
    wordCount: set.words.length,
  }
  if (existing >= 0) {
    index.sets[existing] = meta
  } else {
    index.sets.push(meta)
  }
  writeVocabIndex(index)
  console.log(`  ✓ index.json updated (${index.sets.length} sets, ${index.roots.length} roots)`)
}

export function writeRootEntry(root: VocabRoot): void {
  ensureDirs()
  const filePath = join(ROOTS_DIR, `${root.id}.json`)
  writeFileSync(filePath, JSON.stringify(root, null, 2))
  console.log(`  ✓ ${filePath.replace(DATA_DIR + '/', 'vocabulary/')}`)

  // Update index
  const index = readVocabIndex()
  const existing = index.roots.findIndex(r => r.id === root.id)
  const meta: VocabRootMeta = {
    id: root.id,
    root: root.root,
    rootMeaning: root.rootMeaning,
    level: root.level,
    formCount: root.forms.length,
  }
  if (existing >= 0) {
    index.roots[existing] = meta
  } else {
    index.roots.push(meta)
  }
  writeVocabIndex(index)
  console.log(`  ✓ index.json updated (${index.sets.length} sets, ${index.roots.length} roots)`)
}

// ── Topic labels ──────────────────────────────────────────────────────────────

export const TOPIC_LABELS: Record<VocabTopic, { title: string; titleAr: string; topics: string }> =
  {
    travel: {
      title: 'Travel Essentials',
      titleAr: 'مُفْرَدَاتُ السَّفَرِ',
      topics: 'travel, airports, hotels, transportation, tourism, directions, maps, booking',
    },
    culture: {
      title: 'Culture & Society',
      titleAr: 'الثَّقَافَةُ وَالْمُجْتَمَعُ',
      topics: 'Arab culture, traditions, customs, festivals, family, hospitality, art, music',
    },
    news: {
      title: 'News & Media',
      titleAr: 'الأَخْبَارُ وَالإِعْلَامُ',
      topics: 'politics, economy, environment, international relations, journalism, society',
    },
    literature: {
      title: 'Literature & Poetry',
      titleAr: 'الأَدَبُ وَالشِّعْرُ',
      topics: 'poetry, prose, literary devices, classical literature, storytelling, rhetoric',
    },
    religion: {
      title: 'Islamic Knowledge',
      titleAr: 'الْعِلْمُ الشَّرْعِيُّ',
      topics: 'Islamic practice, worship, Quran vocabulary, hadith terms, fiqh, aqeedah, ethics',
    },
    health: {
      title: 'Health & Wellbeing',
      titleAr: 'الصِّحَّةُ وَالْعَافِيَةُ',
      topics: 'health, medicine, hospital, pharmacy, nutrition, exercise, wellness, body parts',
    },
    work: {
      title: 'Work & Careers',
      titleAr: 'الْعَمَلُ وَالْمِهَنُ',
      topics: 'professions, workplace, job, interview, skills, productivity, entrepreneurship',
    },
    technology: {
      title: 'Technology',
      titleAr: 'التِّقْنِيَّةُ',
      topics:
        'computers, internet, AI, software, smartphones, digital tools, cybersecurity, programming',
    },
    social: {
      title: 'Social Media',
      titleAr: 'التَّوَاصُلُ الاجْتِمَاعِيُّ',
      topics: 'social platforms, online communication, content creation, privacy, digital culture',
    },
    food: {
      title: 'Food & Cooking',
      titleAr: 'الطَّعَامُ وَالطَّبْخُ',
      topics: 'halal food, cooking, recipes, Arab cuisine, markets, restaurants, ingredients',
    },
    education: {
      title: 'Education',
      titleAr: 'التَّعْلِيمُ وَالدِّرَاسَةُ',
      topics: 'school, university, study, learning, exams, teachers, libraries, scholarships',
    },
    finance: {
      title: 'Finance & Economy',
      titleAr: 'الاقْتِصَادُ وَالْمَالُ',
      topics: 'budgeting, business, trade, Islamic finance, saving, investment, banking',
    },
    history: {
      title: 'History',
      titleAr: 'التَّارِيخُ',
      topics:
        'world history, Islamic civilisation, Arab history, empires, archaeology, historical figures',
    },
    psychology: {
      title: 'Psychology',
      titleAr: 'عِلْمُ النَّفْسِ',
      topics:
        'behaviour, mental health, emotions, motivation, decision-making, personality, communication',
    },
    general: {
      title: 'Core Vocabulary',
      titleAr: 'الْمُفْرَدَاتُ الأَسَاسِيَّةُ',
      topics: 'everyday high-frequency words, basic nouns, common verbs, essential adjectives',
    },
  }

// ── Level descriptions ────────────────────────────────────────────────────────

export const LEVEL_VOCAB_DESCRIPTIONS: Record<VocabLevel, string> = {
  B1: 'High-frequency everyday words. Simple nouns, basic verbs in common forms (past/present), common adjectives. Avoid formal, literary, or technical vocabulary.',
  B2: 'Broader vocabulary including topic-specific terms, idiomatic expressions, and compound nouns. Mix of concrete and abstract words.',
  C1: 'Advanced formal vocabulary, technical and academic terms appropriate to the topic, derived forms (masdar, active/passive participle), sophisticated collocations.',
  C2: 'Rare and elevated vocabulary, classical terms, rhetorical and literary words, rare verb forms, specialised terminology. Words a native-level reader would know.',
}

// ── Harakat validation ────────────────────────────────────────────────────────

const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/

export function hasHarakat(text: string): boolean {
  return HARAKAT_REGEX.test(text)
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const HALAL_NOTE = `All vocabulary and example sentences must be halal-compliant: no alcohol, pork, sexual content, gambling, or non-Islamic religious references.`

export function buildWordsPrompt(level: VocabLevel, topic: VocabTopic, count: number): string {
  const { title, topics } = TOPIC_LABELS[topic]
  return `You are an expert Modern Standard Arabic (MSA / الفصحى) linguist and educator.

Generate a vocabulary word set for Arabic learners.

Specification:
- Topic: ${title} (${topics})
- Level: ${level}
- Level notes: ${LEVEL_VOCAB_DESCRIPTIONS[level]}
- Word count: exactly ${count} unique words

REQUIREMENTS:
1. Every Arabic word and example sentence MUST have complete, correct harakat (تشكيل / diacritics): fatha (َ), kasra (ِ), damma (ُ), sukun (ْ), shadda (ّ), tanwin (ً ٍ ٌ)
2. Arabic must be Modern Standard Arabic (فصحى) — never colloquial or dialect
3. Include a variety of word types: nouns, verbs, adjectives, and where natural, adverbs or phrases
4. Root: give the 3 base root letters separated by spaces (e.g. "ك ت ب"). Use bare letters with no harakat.
5. Example sentences must be complete, natural MSA sentences — not fragments
6. Bosnian uses ijekavica dialect and correct Bosnian grammar
7. No duplicates — each word must be distinct
8. Cover a range of sub-topics within "${title}" — variety is important
${HALAL_NOTE}

Return ONLY a valid JSON array with exactly ${count} objects. No explanation, no markdown.

Format:
[
  {
    "arabic": "الْمَطَارُ",
    "root": "ط و ر",
    "type": "noun",
    "bs": "aerodrom",
    "en": "airport",
    "exampleArabic": "وَصَلَ الرَّكَّابُ إِلَى الْمَطَارِ مُبَكِّرًا.",
    "exampleBs": "Putnici su stigli na aerodrom rano.",
    "exampleEn": "The passengers arrived at the airport early."
  }
]

Word types allowed: "noun" | "verb" | "adjective" | "adverb" | "preposition" | "particle" | "phrase"
Generate exactly ${count} items.`
}

export function buildRootsPrompt(level: VocabLevel, count: number): string {
  return `You are an expert Modern Standard Arabic (MSA / الفصحى) linguist and educator.

Generate root family entries for Arabic learners at ${level} level.

Each root entry shows the Arabic 3-letter root and its most important derived word forms — this teaches learners how Arabic word families work.

Specification:
- Level: ${level}
- Level notes: ${LEVEL_VOCAB_DESCRIPTIONS[level]}
- Root count: exactly ${count} roots
- Each root must have 4–7 word forms covering different derivation types

REQUIREMENTS:
1. Every Arabic word and example sentence MUST have complete, correct harakat (تشكيل / diacritics)
2. Arabic must be Modern Standard Arabic (فصحى)
3. Root: 3 bare Arabic letters separated by spaces (e.g. "ك ت ب") — no harakat on root letters
4. Root ID slug: transliterate the 3 root letters with hyphens (e.g. "k-t-b")
5. Include diverse roots — different semantic fields (not all verbs of motion)
6. Forms must be real, attested MSA words (not hypothetical derivations)
7. Example sentence: one complete sentence using the most common form
8. Bosnian uses ijekavica
${HALAL_NOTE}

Return ONLY a valid JSON array with exactly ${count} objects. No explanation, no markdown.

Form types allowed: "verb-past" | "verb-present" | "verbal-noun" | "noun" | "active-participle" | "passive-participle" | "noun-place" | "adjective" | "elative"

Format:
[
  {
    "id": "k-t-b",
    "root": "ك ت ب",
    "rootMeaning": "writing, inscription",
    "level": "${level}",
    "forms": [
      { "arabic": "كَتَبَ",     "type": "verb-past",          "bs": "napisao je",      "en": "he wrote" },
      { "arabic": "يَكْتُبُ",  "type": "verb-present",        "bs": "piše",            "en": "he writes" },
      { "arabic": "كِتَابَةٌ", "type": "verbal-noun",         "bs": "pisanje",         "en": "writing (act of)" },
      { "arabic": "الْكِتَابُ","type": "noun",                 "bs": "knjiga",          "en": "book" },
      { "arabic": "كَاتِبٌ",   "type": "active-participle",   "bs": "pisac",           "en": "writer, scribe" },
      { "arabic": "مَكْتُوبٌ", "type": "passive-participle",  "bs": "napisano",        "en": "written (thing)" },
      { "arabic": "مَكْتَبٌ",  "type": "noun-place",          "bs": "ured, kancelarija","en": "office, desk" }
    ],
    "exampleSentence": {
      "arabic": "كَتَبَ الطَّالِبُ رِسَالَةً طَوِيلَةً إِلَى أُسْتَاذِهِ.",
      "bs": "Student je napisao dugo pismo svom profesoru.",
      "en": "The student wrote a long letter to his professor."
    },
    "tags": ["B1", "education", "communication"]
  }
]

Generate exactly ${count} root entries.`
}

// ── Parse responses ───────────────────────────────────────────────────────────

export function parseWordsResponse(raw: string, level: VocabLevel, topic: VocabTopic): VocabWord[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as unknown[]
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array')

  return parsed.map((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) throw new Error(`Item ${i} is not an object`)
    const o = item as Record<string, unknown>

    const require = (key: string) => {
      if (typeof o[key] !== 'string' || !(o[key] as string).trim())
        throw new Error(`Item ${i} missing "${key}"`)
      return o[key] as string
    }

    const arabic = require('arabic')
    if (!hasHarakat(arabic)) {
      console.warn(`  ⚠️  Item ${i} (${arabic}): arabic has no harakat`)
    }

    return {
      arabic,
      root: require('root'),
      type: (o['type'] as WordType) ?? 'noun',
      bs: require('bs'),
      en: require('en'),
      exampleArabic: require('exampleArabic'),
      exampleBs: require('exampleBs'),
      exampleEn: require('exampleEn'),
    }
  })
}

export function parseRootsResponse(raw: string): VocabRoot[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as unknown[]
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array')

  return parsed.map((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) throw new Error(`Item ${i} is not an object`)
    const o = item as Record<string, unknown>

    const require = (key: string) => {
      if (typeof o[key] !== 'string' || !(o[key] as string).trim())
        throw new Error(`Item ${i} missing "${key}"`)
      return o[key] as string
    }

    const root = require('root')
    const id = makeRootSlug(root)

    if (!Array.isArray(o['forms']) || o['forms'].length === 0)
      throw new Error(`Root ${i} missing "forms"`)

    const exSentence = o['exampleSentence'] as Record<string, string> | undefined
    if (!exSentence?.arabic) throw new Error(`Root ${i} missing exampleSentence`)

    return {
      id,
      root,
      rootMeaning: require('rootMeaning'),
      level: (o['level'] as VocabLevel) ?? 'B1',
      forms: o['forms'] as RootForm[],
      exampleSentence: {
        arabic: exSentence['arabic'],
        bs: exSentence['bs'] ?? '',
        en: exSentence['en'] ?? '',
      },
      tags: Array.isArray(o['tags']) ? (o['tags'] as string[]) : [],
    }
  })
}

// ── Args parser ───────────────────────────────────────────────────────────────

export interface VocabArgs {
  type: GenerationType
  level: VocabLevel
  topic: VocabTopic
  count: number
  model: string
}

const VALID_LEVELS: VocabLevel[] = ['B1', 'B2', 'C1', 'C2']
const VALID_TOPICS: VocabTopic[] = [
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
  'history',
  'psychology',
  'general',
]

export function parseVocabArgs(defaults: { model: string }): VocabArgs {
  const argv = process.argv.slice(2)
  const get = (flag: string) => {
    const i = argv.indexOf(flag)
    return i !== -1 ? argv[i + 1] : undefined
  }

  const type = (get('--type') ?? 'words') as GenerationType
  const level = (get('--level') ?? '') as VocabLevel
  const topic = (get('--topic') ?? 'general') as VocabTopic
  const count = parseInt(get('--count') ?? '30', 10)
  const model = get('--model') ?? defaults.model

  const errors: string[] = []
  if (!['words', 'roots'].includes(type)) errors.push('--type must be "words" or "roots"')
  if (!VALID_LEVELS.includes(level))
    errors.push(`--level must be one of: ${VALID_LEVELS.join(', ')}`)
  if (type === 'words' && !VALID_TOPICS.includes(topic))
    errors.push(`--topic must be one of: ${VALID_TOPICS.join(', ')}`)
  if (isNaN(count) || count < 5 || count > 100) errors.push('--count must be between 5 and 100')

  if (errors.length > 0) {
    console.error('Usage errors:\n  ' + errors.join('\n  '))
    console.error('\nExamples:')
    console.error('  tsx generate-vocab.ts --type words --level B1 --topic travel --count 40')
    console.error('  tsx generate-vocab.ts --type roots --level B1 --count 20')
    process.exit(1)
  }

  return { type, level, topic, count, model }
}
