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

// Order to fill: religion first (currently empty), then rest alphabetically by level
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

// ── Key rotation state ────────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (apiKeys.length === 0) {
  console.error('Error: GEMINI_API_KEYS not set in data-generation/.env')
  notify('Error: GEMINI_API_KEYS not configured')
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

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function generateWithRetry(prompt: string): Promise<string> {
  let waitAttempts = 0
  const maxWaitAttempts = 3
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
        if (waitAttempts >= maxWaitAttempts) throw err
        waitAttempts++
        const delaySec = 30 * waitAttempts
        console.log(
          `  ⏳ Service unavailable — waiting ${delaySec}s (attempt ${waitAttempts}/${maxWaitAttempts})...`
        )
        await new Promise(r => setTimeout(r, delaySec * 1000))
        continue
      }

      if (err.status === 429) {
        const violations =
          (err.errorDetails as Array<Record<string, unknown>> | undefined) ?? []

        const dailyExhausted = violations.some(
          v =>
            typeof v['quotaId'] === 'string' &&
            v['quotaId'].includes('PerDay') &&
            v['limit'] === 0
        )

        if (dailyExhausted) {
          console.log(`  🔑 Daily quota exhausted on key ${keyIdx + 1}/${apiKeys.length}`)
          exhaustedKeys.add(keyIdx)
          const next = nextAvailableKey()
          if (next === null) throw new Error('ALL_KEYS_EXHAUSTED')
          currentKeyIndex = next
          console.log(`  🔑 Switching to key ${next + 1}/${apiKeys.length}...`)
          continue
        }

        // Per-minute rate limit — try next key, but wait once all keys have been tried
        consecutiveRateLimits++
        const nextIdx = (keyIdx + 1) % apiKeys.length
        if (!exhaustedKeys.has(nextIdx) && nextIdx !== keyIdx) {
          console.log(
            `  🔑 Rate limited on key ${keyIdx + 1} — switching to key ${nextIdx + 1}...`
          )
          currentKeyIndex = nextIdx
          if (consecutiveRateLimits < apiKeys.length - exhaustedKeys.size) continue
        }

        // All available keys are rate limited — wait before retrying
        if (waitAttempts >= maxWaitAttempts) throw err
        waitAttempts++
        consecutiveRateLimits = 0
        const retryInfo = violations.find(
          d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        )
        const delaySec = retryInfo?.['retryDelay']
          ? parseInt(String(retryInfo['retryDelay']).replace('s', ''), 10) + 5
          : 60
        console.log(
          `  ⏸  All keys rate limited — waiting ${delaySec}s (attempt ${waitAttempts}/${maxWaitAttempts})...`
        )
        await new Promise(r => setTimeout(r, delaySec * 1000))
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
let quotaHit = false
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
        quotaHit = true
        break
      }
      if (err instanceof Error && err.message === 'RECITATION_SKIP') {
        console.log(`  ⏭  Skipping batch — RECITATION block persisted after retries`)
        break
      }
      const is429 = err instanceof GoogleGenerativeAIFetchError && err.status === 429
      const is503 = err instanceof GoogleGenerativeAIFetchError && err.status === 503
      if (is429) {
        console.log(`\n⛔ Daily quota exhausted after ${totalGenerated} items total.`)
        quotaHit = true
        break
      }
      if (is503) {
        console.log(
          `\n⚠️  Service unavailable after all retries — stopping for now (${totalGenerated} items generated).`
        )
        quotaHit = true
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
        console.log(`  ⏭  Skipping batch — malformed JSON persisted after ${maxParseFailures} retries`)
        break
      }
      console.log(`  ⚠️  Malformed JSON response — retrying batch (attempt ${parseFailures}/${maxParseFailures})...`)
      continue
    }

    writeItems(category, level, items)
    generated += items.length
    totalGenerated += items.length
    generatedPerLevel.set(`${category}/${level}`, (generatedPerLevel.get(`${category}/${level}`) ?? 0) + items.length)
    console.log(`  ✓ ${items.length} items written (${current + generated}/${TARGET})`)

    if (generated < needed) await new Promise(r => setTimeout(r, 5000))
  }

  if (quotaHit) break
}

// ── Summary ───────────────────────────────────────────────────────────────────

// Calculate overall progress
let totalItems = 0
let totalTarget = 0
for (const { category, level } of QUEUE) {
  totalItems += Math.min(readIndex(category, level).items.length, TARGET)
  totalTarget += TARGET
}
const pct = Math.round((totalItems / totalTarget) * 100)

if (quotaHit) {
  const msg = `Generated ${totalGenerated} items today. Quota hit. Progress: ${totalItems}/${totalTarget} (${pct}%)`
  console.log(`\n📊 ${msg}`)
  notify(msg)
} else if (totalGenerated === 0) {
  notify(`All levels complete! ${totalItems}/${totalTarget} items (${pct}%)`)
  console.log(`\n🎉 All levels at target — nothing left to generate.`)
} else {
  const msg = `Generated ${totalGenerated} new items. Progress: ${totalItems}/${totalTarget} (${pct}%)`
  console.log(`\n✅ ${msg}`)
  notify(msg)
}

// ── Auto-commit & push ────────────────────────────────────────────────────────

if (totalGenerated > 0) {
  console.log('\n📦 Committing and pushing new content...')
  try {
    execSync('git add public/data/', { cwd: resolve(import.meta.dirname, '..'), stdio: 'inherit' })
    const breakdown = [...generatedPerLevel.entries()]
      .map(([key, n]) => `${key} +${n}`)
      .join(', ')
    execSync(
      `git commit -m "content: ${breakdown}"`,
      { cwd: resolve(import.meta.dirname, '..'), stdio: 'inherit' }
    )
    execSync('git push', { cwd: resolve(import.meta.dirname, '..'), stdio: 'inherit' })
    console.log('  ✓ Pushed to GitHub')
    notify('Content pushed to GitHub')
  } catch (err) {
    console.error('  ✗ Git push failed:', err)
    notify('Warning: content generated but git push failed')
  }
}
