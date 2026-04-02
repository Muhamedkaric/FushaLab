/**
 * Automated daily reading content generator for FushaLab.
 *
 * Works through a priority queue of category/level pairs, generating batches
 * until each reaches TARGET items or the Gemini daily quota is exhausted.
 * Designed to be called once per day via a macOS LaunchAgent.
 *
 * Config via .env (shared) + .env.reading (section-specific):
 *   GEMINI_API_KEYS  — space-separated list of API keys
 *   READING_TARGET   — items per level to reach (default: 100)
 *   READING_MODEL    — Gemini model to use (default: gemini-flash-latest)
 *   READING_BATCH_*  — batch size per level (default: 5/5/3/2)
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
import { buildPrompt, parseResponse, writeItems, readIndex } from './shared.ts'
import type { Category, Level } from './shared.ts'

// ── Config ────────────────────────────────────────────────────────────────────

const QUEUE: Array<{ category: Category; level: Level }> = [
  { category: 'religion', level: 'B1' },
  { category: 'religion', level: 'B2' },
  { category: 'religion', level: 'C1' },
  { category: 'religion', level: 'C2' },
  { category: 'travel', level: 'B1' },
  { category: 'travel', level: 'B2' },
  { category: 'travel', level: 'C1' },
  { category: 'travel', level: 'C2' },
  { category: 'culture', level: 'B1' },
  { category: 'culture', level: 'B2' },
  { category: 'culture', level: 'C1' },
  { category: 'culture', level: 'C2' },
  { category: 'news', level: 'B1' },
  { category: 'news', level: 'B2' },
  { category: 'news', level: 'C1' },
  { category: 'news', level: 'C2' },
  { category: 'literature', level: 'B1' },
  { category: 'literature', level: 'B2' },
  { category: 'literature', level: 'C1' },
  { category: 'literature', level: 'C2' },
  { category: 'health', level: 'B1' },
  { category: 'health', level: 'B2' },
  { category: 'health', level: 'C1' },
  { category: 'health', level: 'C2' },
  { category: 'work', level: 'B1' },
  { category: 'work', level: 'B2' },
  { category: 'work', level: 'C1' },
  { category: 'work', level: 'C2' },
  { category: 'technology', level: 'B1' },
  { category: 'technology', level: 'B2' },
  { category: 'technology', level: 'C1' },
  { category: 'technology', level: 'C2' },
  { category: 'social', level: 'B1' },
  { category: 'social', level: 'B2' },
  { category: 'social', level: 'C1' },
  { category: 'social', level: 'C2' },
  { category: 'food', level: 'B1' },
  { category: 'food', level: 'B2' },
  { category: 'food', level: 'C1' },
  { category: 'food', level: 'C2' },
  { category: 'education', level: 'B1' },
  { category: 'education', level: 'B2' },
  { category: 'education', level: 'C1' },
  { category: 'education', level: 'C2' },
  { category: 'finance', level: 'B1' },
  { category: 'finance', level: 'B2' },
  { category: 'finance', level: 'C1' },
  { category: 'finance', level: 'C2' },
  { category: 'mysteries', level: 'B1' },
  { category: 'mysteries', level: 'B2' },
  { category: 'mysteries', level: 'C1' },
  { category: 'mysteries', level: 'C2' },
  { category: 'history', level: 'B1' },
  { category: 'history', level: 'B2' },
  { category: 'history', level: 'C1' },
  { category: 'history', level: 'C2' },
  { category: 'psychology', level: 'B1' },
  { category: 'psychology', level: 'B2' },
  { category: 'psychology', level: 'C1' },
  { category: 'psychology', level: 'C2' },
  { category: 'conversations', level: 'B1' },
  { category: 'conversations', level: 'B2' },
  { category: 'conversations', level: 'C1' },
  { category: 'conversations', level: 'C2' },
  { category: 'idioms', level: 'B1' },
  { category: 'idioms', level: 'B2' },
  { category: 'idioms', level: 'C1' },
  { category: 'idioms', level: 'C2' },
  { category: 'stories', level: 'B1' },
  { category: 'stories', level: 'B2' },
  { category: 'stories', level: 'C1' },
  { category: 'stories', level: 'C2' },
  { category: 'opinions', level: 'B1' },
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

// ── Retry wrapper ─────────────────────────────────────────────────────────────

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
          console.log(`  ⚠️  503 on key ${keyIdx + 1} — switching to key ${nextAvailableKey()! + 1}...`)
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
        console.log(`  🔑 Rate limited on key ${keyIdx + 1} — switching to key ${nextAvailableKey()! + 1}...`)
        continue
      }

      throw err
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🕌 FushaLab Reading Generator`)
console.log(`   Model  : ${MODEL}`)
console.log(`   Target : ${TARGET} items per level`)
console.log(`   Keys   : ${apiKeys.length}\n`)

let totalGenerated = 0
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

  while (generated < needed) {
    const batchSize = Math.min(BATCH[level], needed - generated)

    let raw: string
    try {
      raw = await generateWithRetry(buildPrompt(category, level, batchSize))
    } catch (err) {
      if (err instanceof Error && err.message === 'ALL_KEYS_EXHAUSTED') {
        console.log(`\n⛔ All API keys exhausted after ${totalGenerated} items total.`)
        commitContent(generatedPerLevel)
        process.exit(0)
      }
      if (err instanceof Error && err.message === 'RECITATION_SKIP') {
        console.log(`  ⏭  Skipping batch — RECITATION persisted`)
        break
      }
      console.error(`\nUnexpected error:`, err)
      notify(`Error generating ${category}/${level}`)
      process.exit(1)
    }

    let items
    try {
      items = parseResponse(raw!)
      parseFailures = 0
    } catch {
      parseFailures++
      if (parseFailures >= maxParseFailures) {
        console.log(`  ⏭  Skipping batch — malformed JSON persisted`)
        break
      }
      console.log(`  ⚠️  Malformed JSON — retrying (${parseFailures}/${maxParseFailures})...`)
      continue
    }

    writeItems(category, level, items)
    generated += items.length
    totalGenerated += items.length
    generatedPerLevel.set(
      `${category}/${level}`,
      (generatedPerLevel.get(`${category}/${level}`) ?? 0) + items.length
    )
    console.log(`  ✓ ${items.length} items written (${current + generated}/${TARGET})`)

    if (generated < needed) await new Promise(r => setTimeout(r, 5000))
  }
}

if (totalGenerated === 0) {
  console.log('\n🎉 All reading levels at target — nothing to generate.')
  notify('Reading: all levels complete!')
} else {
  commitContent(generatedPerLevel)
}
