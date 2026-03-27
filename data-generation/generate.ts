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

import { execSync } from 'child_process'
import { resolve } from 'path'
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'
import { buildPrompt, parseArgs, parseResponse, writeItems } from './shared.ts'

// ── Load env ──────────────────────────────────────────────────────────────────

const apiKeys = (process.env['GEMINI_API_KEYS'] ?? '').split(/\s+/).filter(Boolean)
if (apiKeys.length === 0) {
  console.error('\nError: GEMINI_API_KEYS is not set.')
  console.error('Add it to your data-generation/.env file:')
  console.error('  GEMINI_API_KEYS=AIza... AIza...\n')
  process.exit(1)
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function generateWithRetry(
  keys: string[],
  modelName: string,
  prompt: string,
  maxWaitRetries = 5
): Promise<string> {
  let keyIndex = 0
  let waitRetries = 0

  while (true) {
    const gemini = new GoogleGenerativeAI(keys[keyIndex]).getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    })

    try {
      const result = await gemini.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (!(err instanceof GoogleGenerativeAIFetchError) || err.status !== 429) throw err

      // Try next key before waiting
      const nextIndex = (keyIndex + 1) % keys.length
      if (nextIndex !== keyIndex) {
        console.log(
          `  🔑 Rate limited on key ${keyIndex + 1}/${keys.length} — trying key ${nextIndex + 1}...`
        )
        keyIndex = nextIndex
        continue
      }

      // All keys tried — fall back to waiting
      if (waitRetries >= maxWaitRetries) throw err
      waitRetries++

      let waitMs = Math.min(2 ** waitRetries * 10_000, 120_000)
      const retryInfo = (err.errorDetails as Array<Record<string, unknown>> | undefined)?.find(
        d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      )
      if (retryInfo?.['retryDelay']) {
        const seconds = parseInt(String(retryInfo['retryDelay']).replace('s', ''), 10)
        if (!isNaN(seconds)) waitMs = (seconds + 5) * 1000
      }

      const waitSec = Math.round(waitMs / 1000)
      console.log(
        `  ⏸  All keys rate limited — waiting ${waitSec}s (retry ${waitRetries}/${maxWaitRetries})...`
      )
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { category, level, count, model } = parseArgs({ model: 'gemini-2.0-flash' })

console.log(`\n🕌 FushaLab Content Generator — Gemini`)
console.log(`   Category : ${category}`)
console.log(`   Level    : ${level}`)
console.log(`   Count    : ${count}`)
console.log(`   Model    : ${model}`)
console.log(`   Keys     : ${apiKeys.length}\n`)

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
    raw = await generateWithRetry(apiKeys, model, buildPrompt(category, level, batchSize))
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

const root = resolve(import.meta.dirname, '..')
try {
  execSync('git add public/data/', { cwd: root, stdio: 'inherit' })
  const staged = execSync('git diff --cached --name-only', { cwd: root }).toString().trim()
  if (staged) {
    execSync(`git commit -m "content: ${category}/${level} +${allGenerated.length}"`, { cwd: root, stdio: 'inherit' })
    execSync('git push', { cwd: root, stdio: 'inherit' })
    console.log('  ✓ Pushed to GitHub\n')
  }
} catch (err) {
  console.error('  ✗ Git push failed:', err)
}
