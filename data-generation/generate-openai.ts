/**
 * Generate Arabic content using the OpenAI API (GPT-4o / GPT-4o-mini).
 *
 * Usage:
 *   pnpm generate:openai --category travel --level B1 --count 10
 *   pnpm generate:openai --category news --level C1 --count 5 --model gpt-4o
 *
 * Available models:
 *   gpt-4o        → best quality, default
 *   gpt-4o-mini   → faster and cheaper, fine for B1/B2
 */

import OpenAI from 'openai'
import { buildPrompt, parseArgs, parseResponse, writeItems } from './shared.ts'

// ── Load env ──────────────────────────────────────────────────────────────────

const apiKey = process.env['OPENAI_API_KEY']
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not set.')
  console.error('Create a .env file from .env.example and add your key.')
  process.exit(1)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { category, level, count, model } = parseArgs({ model: 'gpt-4o' })

console.log(`\n🕌 FushaLab Content Generator — OpenAI`)
console.log(`   Category : ${category}`)
console.log(`   Level    : ${level}`)
console.log(`   Count    : ${count}`)
console.log(`   Model    : ${model}\n`)

const client = new OpenAI({ apiKey })

const BATCH = 10
let remaining = count
const allGenerated = []

while (remaining > 0) {
  const batchSize = Math.min(remaining, BATCH)
  const batchNum = Math.floor((count - remaining) / BATCH) + 1
  const totalBatches = Math.ceil(count / BATCH)

  console.log(`⏳ Batch ${batchNum}/${totalBatches} — requesting ${batchSize} items...`)

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Modern Standard Arabic linguist and educator. You always return valid JSON with no extra text.',
      },
      {
        role: 'user',
        content: buildPrompt(category, level, batchSize),
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  })

  const raw = response.choices[0]?.message?.content ?? ''

  // OpenAI JSON mode wraps arrays in an object — unwrap if needed
  let normalized = raw.trim()
  if (normalized.startsWith('{')) {
    const obj = JSON.parse(normalized) as Record<string, unknown>
    const arrayKey = Object.keys(obj).find(k => Array.isArray(obj[k]))
    if (arrayKey) normalized = JSON.stringify(obj[arrayKey])
  }

  let items
  try {
    items = parseResponse(normalized)
  } catch (err) {
    console.error('Failed to parse response:', err)
    console.error('Raw response:\n', raw)
    process.exit(1)
  }

  allGenerated.push(...items)
  remaining -= batchSize

  if (remaining > 0) await new Promise(r => setTimeout(r, 500))
}

console.log(`\n💾 Writing ${allGenerated.length} items to public/data/${category}/${level}/\n`)
writeItems(category, level, allGenerated)

console.log(`\n✅ Done! ${allGenerated.length} items added to ${category}/${level}`)
console.log(`   Run "pnpm dev" in the project root to see them in the app.\n`)
