/**
 * Automated exercise pack generator for FushaLab.
 *
 * Generates reading-based exercise packs by sampling real texts from
 * public/data/{category}/{level}/ and asking Gemini to create exercises
 * testing vocabulary and grammar from those texts.
 *
 * Config via .env (shared) + .env.exercises (section-specific):
 *   GEMINI_API_KEYS       — space-separated list of API keys
 *   EXERCISES_MODEL       — Gemini model (default: gemini-flash-latest)
 *   EXERCISES_SAMPLE_SIZE — reading texts to sample per pack (default: 5)
 */

import { config } from 'dotenv'
import { join, resolve } from 'path'

config()
config({ path: join(import.meta.dirname, '.env.exercises'), override: false })

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from '@google/generative-ai'
import { readIndex, getDataDir } from './shared.ts'
import type { Category, Level, ContentItem } from './shared.ts'

// ── Types ────────────────────────────────────────────────────────────────────

type ExerciseType = 'word-meaning' | 'fill-blank' | 'sentence-order' | 'odd-one-out'

interface WordMeaningExercise {
  id: string
  type: 'word-meaning'
  arabic: string
  options: string[]
  correctIndex: number
}

interface FillBlankExercise {
  id: string
  type: 'fill-blank'
  sentence: string
  sentenceBs: string
  options: string[]
  correctIndex: number
}

interface SentenceOrderExercise {
  id: string
  type: 'sentence-order'
  translation: string
  words: string[]
  correct: string[]
}

interface OddOneOutExercise {
  id: string
  type: 'odd-one-out'
  words: string[]
  translations: string[]
  oddIndex: number
  reason: string
}

type Exercise = WordMeaningExercise | FillBlankExercise | SentenceOrderExercise | OddOneOutExercise

interface ExercisePack {
  id: string
  level: string
  topic: string
  title: string
  titleAr: string
  titleBs: string
  estimatedMinutes: number
  exercises: Exercise[]
}

interface ExercisesIndex {
  packs: Array<{
    id: string
    level: string
    topic: string
    title: string
    titleAr: string
    titleBs: string
    exerciseCount: number
    estimatedMinutes: number
    types: ExerciseType[]
  }>
}

// ── Queue — packs to generate ─────────────────────────────────────────────────

interface PackSpec {
  packId: string
  category: Category
  level: Level
  title: string
  titleAr: string
  titleBs: string
  types: ExerciseType[]
  estimatedMinutes: number
}

const QUEUE: PackSpec[] = [
  {
    packId: 'b1-travel-reading',
    category: 'travel',
    level: 'B1',
    title: 'Travel — Reading Pack',
    titleAr: 'السَّفَرُ — مِنَ النُّصُوصِ',
    titleBs: 'Putovanje — iz tekstova',
    types: ['word-meaning', 'fill-blank', 'sentence-order'],
    estimatedMinutes: 8,
  },
  {
    packId: 'b1-culture-reading',
    category: 'culture',
    level: 'B1',
    title: 'Culture — Reading Pack',
    titleAr: 'الثَّقَافَةُ — مِنَ النُّصُوصِ',
    titleBs: 'Kultura — iz tekstova',
    types: ['word-meaning', 'fill-blank', 'sentence-order'],
    estimatedMinutes: 8,
  },
  {
    packId: 'b1-news-reading',
    category: 'news',
    level: 'B1',
    title: 'News — Reading Pack',
    titleAr: 'الأَخْبَارُ — مِنَ النُّصُوصِ',
    titleBs: 'Vijesti — iz tekstova',
    types: ['word-meaning', 'fill-blank', 'sentence-order'],
    estimatedMinutes: 8,
  },
  {
    packId: 'b1-literature-reading',
    category: 'literature',
    level: 'B1',
    title: 'Literature — Reading Pack',
    titleAr: 'الأَدَبُ — مِنَ النُّصُوصِ',
    titleBs: 'Književnost — iz tekstova',
    types: ['word-meaning', 'fill-blank', 'sentence-order'],
    estimatedMinutes: 8,
  },
  {
    packId: 'b2-travel-reading',
    category: 'travel',
    level: 'B2',
    title: 'Travel — Reading Pack B2',
    titleAr: 'السَّفَرُ — نُصُوصٌ مُتَقَدِّمَةٌ',
    titleBs: 'Putovanje — napredni tekstovi',
    types: ['word-meaning', 'fill-blank', 'sentence-order', 'odd-one-out'],
    estimatedMinutes: 10,
  },
  {
    packId: 'b2-culture-reading',
    category: 'culture',
    level: 'B2',
    title: 'Culture — Reading Pack B2',
    titleAr: 'الثَّقَافَةُ — نُصُوصٌ مُتَقَدِّمَةٌ',
    titleBs: 'Kultura — napredni tekstovi',
    types: ['word-meaning', 'fill-blank', 'sentence-order', 'odd-one-out'],
    estimatedMinutes: 10,
  },
  {
    packId: 'b2-news-reading',
    category: 'news',
    level: 'B2',
    title: 'News — Reading Pack B2',
    titleAr: 'الأَخْبَارُ — نُصُوصٌ مُتَقَدِّمَةٌ',
    titleBs: 'Vijesti — napredni tekstovi',
    types: ['word-meaning', 'fill-blank', 'sentence-order', 'odd-one-out'],
    estimatedMinutes: 10,
  },
  {
    packId: 'b2-literature-reading',
    category: 'literature',
    level: 'B2',
    title: 'Literature — Reading Pack B2',
    titleAr: 'الأَدَبُ — نُصُوصٌ مُتَقَدِّمَةٌ',
    titleBs: 'Književnost — napredni tekstovi',
    types: ['word-meaning', 'fill-blank', 'sentence-order', 'odd-one-out'],
    estimatedMinutes: 10,
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

const MODEL = process.env['EXERCISES_MODEL'] ?? 'gemini-flash-latest'
const SAMPLE_SIZE = parseInt(process.env['EXERCISES_SAMPLE_SIZE'] ?? '5', 10)
const DATA_DIR = resolve(import.meta.dirname, '../public/data')
const EXERCISES_DIR = join(DATA_DIR, 'exercises')
const PACKS_DIR = join(EXERCISES_DIR, 'packs')
const INDEX_PATH = join(EXERCISES_DIR, 'index.json')

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

// ── Index helpers ─────────────────────────────────────────────────────────────

function readExercisesIndex(): ExercisesIndex {
  if (!existsSync(INDEX_PATH)) return { packs: [] }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8')) as ExercisesIndex
}

function packExists(packId: string): boolean {
  const index = readExercisesIndex()
  return index.packs.some(p => p.id === packId)
}

function addPackToIndex(spec: PackSpec, pack: ExercisePack) {
  const index = readExercisesIndex()
  index.packs.push({
    id: spec.packId,
    level: spec.level,
    topic: spec.packId.replace(`${spec.level.toLowerCase()}-`, ''),
    title: spec.title,
    titleAr: spec.titleAr,
    titleBs: spec.titleBs,
    exerciseCount: pack.exercises.length,
    estimatedMinutes: spec.estimatedMinutes,
    types: spec.types,
  })
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2))
}

// ── Reading text sampler ──────────────────────────────────────────────────────

function sampleReadingTexts(category: Category, level: Level, count: number): ContentItem[] {
  const index = readIndex(category, level)
  if (index.items.length === 0) return []

  // shuffle and take up to `count`
  const shuffled = [...index.items].sort(() => Math.random() - 0.5).slice(0, count)
  const items: ContentItem[] = []

  for (const meta of shuffled) {
    const filePath = join(getDataDir(category, level), `${meta.id}.json`)
    if (!existsSync(filePath)) continue
    try {
      items.push(JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem)
    } catch {
      // skip malformed files
    }
  }
  return items
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildExercisePrompt(spec: PackSpec, sourceTexts: ContentItem[]): string {
  const hasOddOneOut = spec.types.includes('odd-one-out')

  const textsBlock = sourceTexts
    .map(
      (item, i) =>
        `Text ${i + 1}:\n` +
        item.sentences
          .map(s => `  Arabic: ${s.arabic}\n  Bosnian: ${s.translation}`)
          .join('\n')
    )
    .join('\n\n')

  const typeCounts = hasOddOneOut
    ? '3 word-meaning, 3 fill-blank, 2 sentence-order, 2 odd-one-out'
    : '4 word-meaning, 3 fill-blank, 3 sentence-order'

  return `You are an expert Modern Standard Arabic educator creating exercises for a language learning app.

The exercises are for ${spec.level} level, topic: ${spec.category}.
They must be based on vocabulary and grammar from these actual reading texts:

${textsBlock}

Generate exactly 10 exercises (${typeCounts}).
All Arabic must have complete harakat (tashkeel — فَتْحَة، كَسْرَة، ضَمَّة، سُكُون، شَدَّة، تَنْوِين).
All Bosnian translations must be natural, fluent, ijekavica.

Exercise types and their exact JSON format:

word-meaning — show Arabic word/phrase, user picks Bosnian meaning:
{ "type": "word-meaning", "arabic": "كَلِمَةٌ", "options": ["tačan odgovor", "pogrešan1", "pogrešan2", "pogrešan3"], "correctIndex": 0 }

fill-blank — Arabic sentence with ___ gap, user picks the missing Arabic word:
{ "type": "fill-blank", "sentence": "جُمْلَةٌ ___ هُنَا", "sentenceBs": "Rečenica ___ ovdje", "options": ["tačna_ar", "pogrešna1", "pogrešna2", "pogrešna3"], "correctIndex": 0 }

sentence-order — user arranges scrambled Arabic words into the correct sentence:
{ "type": "sentence-order", "translation": "Bosnian prijevod cijele rečenice", "words": ["مُبَعْثَرَةٌ", "كَلِمَاتٌ", "هُنَا"], "correct": ["كَلِمَاتٌ", "مُبَعْثَرَةٌ", "هُنَا"] }
— words array must be the SAME words as correct but in a different order. Use 4–6 words.
${
  hasOddOneOut
    ? `
odd-one-out — 4 Arabic words, 3 belong to one category, 1 is the odd one out:
{ "type": "odd-one-out", "words": ["كَلِمَةٌ١", "كَلِمَةٌ٢", "كَلِمَةٌ٣", "كَلِمَةٌ٤"], "translations": ["prir1", "prir2", "prir3", "prir4"], "oddIndex": 3, "reason": "Objašnjenje na bosanskom zašto je ta riječ drugačija." }
`
    : ''
}

Return ONLY a valid JSON array of 10 exercises — no explanation, no markdown, no code blocks.
Do NOT include an "id" field — it will be added automatically.
`
}

// ── Parse exercises ───────────────────────────────────────────────────────────

function parseExercises(raw: string, packId: string): Exercise[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as unknown
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array')

  return parsed.map((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) throw new Error(`Item ${i} not an object`)
    const o = item as Record<string, unknown>
    const type = o['type'] as string
    const id = `${packId}-${String(i + 1).padStart(2, '0')}`

    if (type === 'word-meaning') {
      return { id, type, arabic: o['arabic'], options: o['options'], correctIndex: o['correctIndex'] } as WordMeaningExercise
    }
    if (type === 'fill-blank') {
      return { id, type, sentence: o['sentence'], sentenceBs: o['sentenceBs'], options: o['options'], correctIndex: o['correctIndex'] } as FillBlankExercise
    }
    if (type === 'sentence-order') {
      return { id, type, translation: o['translation'], words: o['words'], correct: o['correct'] } as SentenceOrderExercise
    }
    if (type === 'odd-one-out') {
      return { id, type, words: o['words'], translations: o['translations'], oddIndex: o['oddIndex'], reason: o['reason'] } as OddOneOutExercise
    }
    throw new Error(`Unknown exercise type: ${type}`)
  })
}

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

async function callGemini(prompt: string): Promise<string> {
  let consecutiveRateLimits = 0

  while (true) {
    const keyIdx = nextAvailableKey()
    if (keyIdx === null) throw new Error('ALL_KEYS_EXHAUSTED')
    currentKeyIndex = keyIdx

    const gemini = new GoogleGenerativeAI(apiKeys[keyIdx]).getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
    })

    try {
      const result = await gemini.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (err instanceof GoogleGenerativeAIResponseError) throw err
      if (!(err instanceof GoogleGenerativeAIFetchError)) throw err

      if (err.status === 429) {
        const violations = (err.errorDetails as Array<Record<string, unknown>> | undefined) ?? []
        const dailyExhausted = violations.some(
          v => typeof v['quotaId'] === 'string' && v['quotaId'].includes('PerDay') && v['limit'] === 0
        )
        if (dailyExhausted) {
          exhaustedKeys.add(keyIdx)
          const next = nextAvailableKey()
          if (next === null) throw new Error('ALL_KEYS_EXHAUSTED')
          console.log(`  🔑 Daily quota on key ${keyIdx + 1} — switching to key ${next + 1}...`)
          currentKeyIndex = next
          consecutiveRateLimits = 0
          continue
        }
        consecutiveRateLimits++
        if (consecutiveRateLimits >= apiKeys.length - exhaustedKeys.size) {
          console.log(`  ⏳ All keys rate-limited — waiting 60s...`)
          await new Promise(r => setTimeout(r, 60_000))
          consecutiveRateLimits = 0
        } else {
          currentKeyIndex = (keyIdx + 1) % apiKeys.length
          console.log(`  🔑 Rate limited — switching to key ${currentKeyIndex + 1}...`)
        }
        continue
      }

      if (err.status === 503) {
        console.log(`  ⏳ Service unavailable — waiting 30s...`)
        await new Promise(r => setTimeout(r, 30_000))
        continue
      }

      throw err
    }
  }
}

// ── Commit ────────────────────────────────────────────────────────────────────

function commitExercises(packIds: string[]) {
  const root = resolve(import.meta.dirname, '..')
  try {
    execSync('git add public/data/exercises/', { cwd: root, stdio: 'inherit' })
    const staged = execSync('git diff --cached --name-only', { cwd: root }).toString().trim()
    if (!staged) {
      console.log('\n📦 Nothing new to commit.')
      return
    }
    const summary = packIds.join(', ')
    console.log('\n📦 Committing exercise packs...')
    execSync(`git commit -m "content(exercises): ${summary}"`, { cwd: root, stdio: 'inherit' })
    console.log('  ✓ Committed locally')
    notify('Exercise packs committed')
  } catch (err) {
    console.error('  ✗ Git commit failed:', err)
    notify('Warning: exercises generated but git commit failed')
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

mkdirSync(PACKS_DIR, { recursive: true })

console.log(`\n📚 FushaLab Exercise Generator`)
console.log(`   Model       : ${MODEL}`)
console.log(`   Sample size : ${SAMPLE_SIZE} texts per pack`)
console.log(`   Keys        : ${apiKeys.length}\n`)

const generatedPackIds: string[] = []

for (const spec of QUEUE) {
  if (packExists(spec.packId)) {
    console.log(`✅ ${spec.packId} — already exists, skipping`)
    continue
  }

  const sourceTexts = sampleReadingTexts(spec.category, spec.level, SAMPLE_SIZE)
  if (sourceTexts.length === 0) {
    console.log(`⚠️  ${spec.packId} — no source texts found for ${spec.category}/${spec.level}, skipping`)
    continue
  }

  console.log(`\n📝 ${spec.packId} — sampling ${sourceTexts.length} ${spec.category}/${spec.level} texts...`)

  let raw: string
  try {
    raw = await callGemini(buildExercisePrompt(spec, sourceTexts))
  } catch (err) {
    if (err instanceof Error && err.message === 'ALL_KEYS_EXHAUSTED') {
      console.log(`\n⛔ All API keys exhausted.`)
      if (generatedPackIds.length > 0) commitExercises(generatedPackIds)
      process.exit(0)
    }
    console.error(`\nUnexpected error on ${spec.packId}:`, err)
    notify(`Error generating ${spec.packId}`)
    process.exit(1)
  }

  let exercises: Exercise[]
  try {
    exercises = parseExercises(raw!, spec.packId)
  } catch (err) {
    console.error(`  ✗ Failed to parse exercises for ${spec.packId}:`, err)
    console.error('  Raw response:', raw!.slice(0, 500))
    continue
  }

  const pack: ExercisePack = {
    id: spec.packId,
    level: spec.level,
    topic: spec.packId.replace(`${spec.level.toLowerCase()}-`, ''),
    title: spec.title,
    titleAr: spec.titleAr,
    titleBs: spec.titleBs,
    estimatedMinutes: spec.estimatedMinutes,
    exercises,
  }

  const packPath = join(PACKS_DIR, `${spec.packId}.json`)
  writeFileSync(packPath, JSON.stringify(pack, null, 2))
  addPackToIndex(spec, pack)
  generatedPackIds.push(spec.packId)
  console.log(`  ✓ ${spec.packId} — ${exercises.length} exercises written`)

  await new Promise(r => setTimeout(r, 5000))
}

if (generatedPackIds.length === 0) {
  console.log('\n🎉 All exercise packs already exist — nothing to generate.')
  notify('Exercises: all packs complete!')
} else {
  commitExercises(generatedPackIds)
}
