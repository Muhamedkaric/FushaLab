import 'dotenv/config'

/**
 * Automated daily content generator for FushaLab.
 *
 * Works through a priority queue of category/level pairs, generating batches
 * until each reaches TARGET items or the Gemini daily quota is exhausted.
 * Designed to be called once per day via a macOS LaunchAgent.
 *
 * Usage:
 *   pnpm auto-generate
 *   pnpm auto-generate --target 50        # different target per level
 *   pnpm auto-generate --model gemini-2.5-flash
 */

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

// Order to fill: religion first (currently empty), then original categories, then new ones
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
  // New categories
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

const BATCH: Record<Level, number> = { B1: 5, B2: 5, C1: 3, C2: 2 }

// ── Args ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const getArg = (flag: string) => {
  const i = argv.indexOf(flag)
  return i !== -1 ? argv[i + 1] : undefined
}

const TARGET = parseInt(getArg('--target') ?? '100', 10)
const MODEL = getArg('--model') ?? 'gemini-flash-latest'

// ── Notification ──────────────────────────────────────────────────────────────

function notify(message: string) {
  try {
    execSync(`osascript -e 'display notification "${message}" with title "FushaLab"'`, {
      stdio: 'ignore',
    })
  } catch {
    // non-critical — ignore if osascript unavailable
  }
}

// ── Commit & push ─────────────────────────────────────────────────────────────

function commitAndPush(perLevel: Map<string, number>) {
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
    execSync(`git commit -m "content: ${breakdown}"`, { cwd: root, stdio: 'inherit' })
    console.log('  ✓ Committed locally')
    notify('Content committed locally')
  } catch (err) {
    console.error('  ✗ Git commit failed:', err)
    notify('Warning: content generated but git commit failed')
  }
}

// ── Key rotation state ────────────────────────────────────────────────────────

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
          console.log(
            `  ⚠️  RECITATION block — retrying batch (attempt ${recitationAttempts}/${maxRecitationAttempts})...`
          )
          continue
        }
        throw err
      }

      if (!(err instanceof GoogleGenerativeAIFetchError)) throw err

      if (err.status === 503) {
        // Transient service error — try next key, or wait and retry if all tried
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        const availableKeys = apiKeys.length - exhaustedKeys.size
        if (consecutiveRateLimits >= availableKeys) {
          consecutiveWaits++
          if (consecutiveWaits > MAX_CONSECUTIVE_WAITS) {
            throw new Error('ALL_KEYS_EXHAUSTED')
          }
          console.log(`  ⏳ All keys returning 503 — waiting 30s before retry...`)
          await new Promise(r => setTimeout(r, 30_000))
          consecutiveRateLimits = 0
        } else {
          const nextIdx = nextAvailableKey()!
          console.log(`  ⚠️  503 on key ${keyIdx + 1} — switching to key ${nextIdx + 1}...`)
          currentKeyIndex = nextIdx
        }
        continue
      }

      if (err.status === 429) {
        const violations = (err.errorDetails as Array<Record<string, unknown>> | undefined) ?? []

        const dailyExhausted = violations.some(
          v =>
            typeof v['quotaId'] === 'string' && v['quotaId'].includes('PerDay') && v['limit'] === 0
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

        // Per-minute rate limit — rotate to next available key
        consecutiveRateLimits++
        currentKeyIndex = (keyIdx + 1) % apiKeys.length
        const availableKeys = apiKeys.length - exhaustedKeys.size
        if (consecutiveRateLimits >= availableKeys) {
          consecutiveWaits++
          if (consecutiveWaits > MAX_CONSECUTIVE_WAITS) {
            console.log(
              `  ⛔ Keys keep rate-limiting after ${MAX_CONSECUTIVE_WAITS} waits — treating as daily exhausted`
            )
            throw new Error('ALL_KEYS_EXHAUSTED')
          }
          console.log(
            `  ⏳ All ${availableKeys} keys rate-limited — waiting 60s before retry (${consecutiveWaits}/${MAX_CONSECUTIVE_WAITS})...`
          )
          await new Promise(r => setTimeout(r, 60_000))
          consecutiveRateLimits = 0
          continue
        }
        const nextIdx = nextAvailableKey()!
        console.log(`  🔑 Rate limited on key ${keyIdx + 1} — switching to key ${nextIdx + 1}...`)
        currentKeyIndex = nextIdx
        continue
      }

      throw err
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🕌 FushaLab Auto-Generator`)
console.log(`   Model  : ${MODEL}`)
console.log(`   Target : ${TARGET} items per level`)
console.log(`   Keys   : ${apiKeys.length}\n`)

let totalGenerated = 0
const generatedPerLevel = new Map<string, number>()

for (const { category, level } of QUEUE) {
  const current = readIndex(category, level).items.length

  if (current >= TARGET) {
    console.log(`✅ ${category}/${level}: ${current}/${TARGET} — already complete, skipping`)
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
        commitAndPush(generatedPerLevel)
        process.exit(0)
      }
      if (err instanceof Error && err.message === 'RECITATION_SKIP') {
        console.log(`  ⏭  Skipping batch — RECITATION block persisted after retries`)
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
        console.log(
          `  ⏭  Skipping batch — malformed JSON persisted after ${maxParseFailures} retries`
        )
        break
      }
      console.log(
        `  ⚠️  Malformed JSON response — retrying batch (attempt ${parseFailures}/${maxParseFailures})...`
      )
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
  console.log('\n🎉 All levels at target — nothing left to generate.')
  notify('All levels complete!')
} else {
  commitAndPush(generatedPerLevel)
}
