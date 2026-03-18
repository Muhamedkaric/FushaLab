/**
 * Generate Arabic content using the Anthropic (Claude) API.
 *
 * Usage:
 *   pnpm generate --category travel --level B1 --count 10
 *   pnpm generate --category culture --level C2 --count 5 --model claude-opus-4-6
 *
 * Available models:
 *   claude-opus-4-6     → best Arabic quality, slower, more expensive
 *   claude-sonnet-4-6   → good quality, faster, cheaper  (default)
 *   claude-haiku-4-5-20251001 → fastest, cheapest, acceptable for B1/B2
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt, parseArgs, parseResponse, writeItems } from './shared.ts'

// ── Load env ──────────────────────────────────────────────────────────────────

const apiKey = process.env['ANTHROPIC_API_KEY']
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY is not set.')
  console.error('Create a .env file from .env.example and add your key.')
  process.exit(1)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { category, level, count, model } = parseArgs({ model: 'claude-sonnet-4-6' })

console.log(`\n🕌 FushaLab Content Generator — Claude`)
console.log(`   Category : ${category}`)
console.log(`   Level    : ${level}`)
console.log(`   Count    : ${count}`)
console.log(`   Model    : ${model}\n`)

const client = new Anthropic({ apiKey })

// Split into batches of 10 to keep responses focused and avoid token limits
const BATCH = 10
let remaining = count
let allGenerated = []

while (remaining > 0) {
  const batchSize = Math.min(remaining, BATCH)
  const batchNum = Math.floor((count - remaining) / BATCH) + 1
  const totalBatches = Math.ceil(count / BATCH)

  console.log(`⏳ Batch ${batchNum}/${totalBatches} — requesting ${batchSize} items...`)

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildPrompt(category, level, batchSize),
      },
    ],
  })

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  let items
  try {
    items = parseResponse(raw)
  } catch (err) {
    console.error('Failed to parse response:', err)
    console.error('Raw response:\n', raw)
    process.exit(1)
  }

  allGenerated.push(...items)
  remaining -= batchSize

  // Small pause between batches to be polite to the API
  if (remaining > 0) await new Promise(r => setTimeout(r, 800))
}

console.log(`\n💾 Writing ${allGenerated.length} items to public/data/${category}/${level}/\n`)
writeItems(category, level, allGenerated)

console.log(`\n✅ Done! ${allGenerated.length} items added to ${category}/${level}`)
console.log(`   Run "pnpm dev" in the project root to see them in the app.\n`)
