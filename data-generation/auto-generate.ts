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
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'
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

const BATCH = 5

// ── Args ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const getArg = (flag: string) => {
  const i = argv.indexOf(flag)
  return i !== -1 ? argv[i + 1] : undefined
}

const TARGET = parseInt(getArg('--target') ?? '100', 10)
const MODEL = getArg('--model') ?? 'gemini-2.0-flash'

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

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function generateWithRetry(
  gemini: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
  prompt: string
): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await gemini.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      const is429 = err instanceof GoogleGenerativeAIFetchError && err.status === 429
      if (!is429 || attempt === 3) throw err

      // Only retry per-minute limits — detect daily limit (limit: 0 on daily quota)
      const violations =
        err instanceof GoogleGenerativeAIFetchError
          ? (err.errorDetails as Array<Record<string, unknown>> | undefined) ?? []
          : []
      const dailyExhausted = violations.some(
        v =>
          typeof v['quotaId'] === 'string' &&
          v['quotaId'].includes('PerDay') &&
          v['limit'] === 0
      )
      if (dailyExhausted) throw err // no point retrying daily limit

      const retryInfo = violations.find(
        d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      )
      const delaySec = retryInfo?.['retryDelay']
        ? parseInt(String(retryInfo['retryDelay']).replace('s', ''), 10) + 5
        : 30 * attempt

      console.log(`  ⏸  Rate limited — waiting ${delaySec}s (attempt ${attempt}/3)...`)
      await new Promise(r => setTimeout(r, delaySec * 1000))
    }
  }
  throw new Error('unreachable')
}

// ── Main ──────────────────────────────────────────────────────────────────────

const apiKey = process.env['GEMINI_API_KEY']
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not set in data-generation/.env')
  notify('Error: GEMINI_API_KEY not configured')
  process.exit(1)
}

console.log(`\n🕌 FushaLab Auto-Generator`)
console.log(`   Model  : ${MODEL}`)
console.log(`   Target : ${TARGET} items per level\n`)

const genAI = new GoogleGenerativeAI(apiKey)
const gemini = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
})

let totalGenerated = 0
let quotaHit = false

for (const { category, level } of QUEUE) {
  const current = readIndex(category, level).items.length

  if (current >= TARGET) {
    console.log(`✅ ${category}/${level}: ${current}/${TARGET} — already complete, skipping`)
    continue
  }

  const needed = TARGET - current
  console.log(`\n📝 ${category}/${level}: ${current}/${TARGET} — generating ${needed} more...`)

  let generated = 0

  while (generated < needed) {
    const batchSize = Math.min(BATCH, needed - generated)

    try {
      const raw = await generateWithRetry(gemini, buildPrompt(category, level, batchSize))
      const items = parseResponse(raw)
      writeItems(category, level, items)
      generated += items.length
      totalGenerated += items.length
      console.log(`  ✓ ${items.length} items written (${current + generated}/${TARGET})`)
    } catch (err) {
      const is429 = err instanceof GoogleGenerativeAIFetchError && err.status === 429
      if (is429) {
        console.log(`\n⛔ Daily quota exhausted after ${totalGenerated} items total.`)
        quotaHit = true
        break
      }
      console.error(`\nUnexpected error:`, err)
      notify(`Error generating ${category}/${level}`)
      process.exit(1)
    }

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
