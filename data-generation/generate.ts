import 'dotenv/config'

/**
 * Generate Arabic content using the Google Gemini API (free tier).
 *
 * Usage:
 *   pnpm generate --category travel --level B1 --count 10
 *   pnpm generate --category culture --level C2 --count 5 --model gemini-1.5-pro
 *
 * Available models:
 *   gemini-2.0-flash   → fastest, free, good quality  (default)
 *   gemini-1.5-pro     → best quality, still free tier
 *   gemini-1.5-flash   → fast, free, slightly lower quality
 */

import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'
import { buildPrompt, parseArgs, parseResponse, writeItems } from './shared.ts'

// ── Load env ──────────────────────────────────────────────────────────────────

const apiKey = process.env['GEMINI_API_KEY']
if (!apiKey) {
  console.error('\nError: GEMINI_API_KEY is not set.')
  console.error('Add it to your data-generation/.env file:')
  console.error('  GEMINI_API_KEY=AIza...\n')
  process.exit(1)
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function generateWithRetry(
  gemini: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
  prompt: string,
  maxRetries = 5
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await gemini.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      const is429 =
        err instanceof GoogleGenerativeAIFetchError && err.status === 429

      if (!is429 || attempt === maxRetries) throw err

      // Parse retry-after from the error details if available, else exponential backoff
      let waitMs = Math.min(2 ** attempt * 10_000, 120_000)
      if (err instanceof GoogleGenerativeAIFetchError) {
        const retryInfo = (err.errorDetails as Array<Record<string, unknown>> | undefined)?.find(
          d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        )
        if (retryInfo?.['retryDelay']) {
          const seconds = parseInt(String(retryInfo['retryDelay']).replace('s', ''), 10)
          if (!isNaN(seconds)) waitMs = (seconds + 5) * 1000
        }
      }

      const waitSec = Math.round(waitMs / 1000)
      console.log(`  ⏸  Rate limited (429) — waiting ${waitSec}s before retry ${attempt}/${maxRetries - 1}...`)
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
  throw new Error('unreachable')
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { category, level, count, model } = parseArgs({ model: 'gemini-2.0-flash' })

console.log(`\n🕌 FushaLab Content Generator — Gemini`)
console.log(`   Category : ${category}`)
console.log(`   Level    : ${level}`)
console.log(`   Count    : ${count}`)
console.log(`   Model    : ${model}\n`)

const genAI = new GoogleGenerativeAI(apiKey)
const gemini = genAI.getGenerativeModel({
  model,
  generationConfig: {
    temperature: 0.7,
    responseMimeType: 'application/json',
  },
})

const BATCH = 5 // smaller batches since texts are now much longer paragraphs
let remaining = count
const allGenerated = []

while (remaining > 0) {
  const batchSize = Math.min(remaining, BATCH)
  const batchNum = Math.floor((count - remaining) / BATCH) + 1
  const totalBatches = Math.ceil(count / BATCH)

  console.log(`⏳ Batch ${batchNum}/${totalBatches} — requesting ${batchSize} items...`)

  let raw: string
  try {
    raw = await generateWithRetry(gemini, buildPrompt(category, level, batchSize))
  } catch (err) {
    console.error('\nAPI request failed after retries:', err)
    process.exit(1)
  }

  let items
  try {
    items = parseResponse(raw)
  } catch (err) {
    console.error('\nFailed to parse response:', err)
    console.error('Raw response:\n', raw)
    process.exit(1)
  }

  allGenerated.push(...items)
  remaining -= batchSize

  // Respect free tier rate limits (15 req/min)
  if (remaining > 0) await new Promise(r => setTimeout(r, 5000))
}

console.log(`\n💾 Writing ${allGenerated.length} items to public/data/${category}/${level}/\n`)
writeItems(category, level, allGenerated)

console.log(`\n✅ Done! ${allGenerated.length} items added to ${category}/${level}`)
console.log(`   Run "pnpm dev" in the project root to see them in the app.\n`)
