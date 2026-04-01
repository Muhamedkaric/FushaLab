import 'dotenv/config'

/**
 * Vocabulary generator — roots and word sets for FushaLab.
 *
 * Usage:
 *   # Generate a thematic word set (40 words for B1 travel)
 *   tsx generate-vocab.ts --type words --level B1 --topic travel --count 40
 *
 *   # Generate root family entries (20 roots at B1)
 *   tsx generate-vocab.ts --type roots --level B1 --count 20
 *
 * Options:
 *   --type   words | roots         (default: words)
 *   --level  B1 | B2 | C1 | C2    (required)
 *   --topic  travel | culture | news | literature | religion | health | work |
 *            technology | social | food | education | finance | history |
 *            psychology | general  (required for --type words)
 *   --count  5–100                 (default: 30)
 *   --model  gemini model name     (default: gemini-2.0-flash)
 */

import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'
import {
  buildRootsPrompt,
  buildWordsPrompt,
  makeSetId,
  parseRootsResponse,
  parseVocabArgs,
  parseWordsResponse,
  TOPIC_LABELS,
  writeRootEntry,
  writeWordSet,
  type VocabSet,
} from './vocab-shared.ts'

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
  let consecutiveRateLimits = 0

  while (true) {
    const gemini = new GoogleGenerativeAI(keys[keyIndex]).getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    })

    try {
      const result = await gemini.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (!(err instanceof GoogleGenerativeAIFetchError) || err.status !== 429) throw err

      consecutiveRateLimits++

      // Try next key if we haven't cycled through all of them yet
      if (consecutiveRateLimits < keys.length) {
        const nextIndex = (keyIndex + 1) % keys.length
        console.log(
          `  🔑 Rate limited on key ${keyIndex + 1}/${keys.length} — trying key ${nextIndex + 1}...`
        )
        keyIndex = nextIndex
        continue
      }

      // All keys exhausted — fall back to waiting
      consecutiveRateLimits = 0
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
      keyIndex = 0
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { type, level, topic, count, model } = parseVocabArgs({ model: 'gemini-2.0-flash' })

console.log(`\n📚 FushaLab Vocabulary Generator — Gemini`)
console.log(`   Type  : ${type}`)
console.log(`   Level : ${level}`)
if (type === 'words') console.log(`   Topic : ${topic}`)
console.log(`   Count : ${count}`)
console.log(`   Model : ${model}`)
console.log(`   Keys  : ${apiKeys.length}\n`)

// Words generation — may batch if count > 30
if (type === 'words') {
  const BATCH = 25
  let allWords: ReturnType<typeof parseWordsResponse> = []
  let remaining = count

  while (remaining > 0) {
    const batchSize = Math.min(remaining, BATCH)
    const batchNum = Math.floor((count - remaining) / BATCH) + 1
    const totalBatches = Math.ceil(count / BATCH)

    console.log(`⏳ Batch ${batchNum}/${totalBatches} — requesting ${batchSize} words...`)

    let raw: string
    try {
      raw = await generateWithRetry(apiKeys, model, buildWordsPrompt(level, topic, batchSize))
    } catch (err) {
      console.error('\nAPI request failed after retries:', err)
      process.exit(1)
    }

    let batch
    try {
      batch = parseWordsResponse(raw, level, topic)
    } catch (err) {
      console.error('\nFailed to parse response:', err)
      console.error('Raw response:\n', raw)
      process.exit(1)
    }

    allWords = allWords.concat(batch)
    remaining -= batchSize

    if (remaining > 0) await new Promise(r => setTimeout(r, 4000))
  }

  const { title, titleAr } = TOPIC_LABELS[topic]
  const setId = makeSetId(level, topic)

  const set: VocabSet = {
    id: setId,
    title,
    titleAr,
    level,
    topic,
    words: allWords,
  }

  console.log(`\n💾 Writing word set: ${setId} (${allWords.length} words)\n`)
  writeWordSet(set)
  console.log(`\n✅ Done! Word set "${setId}" — ${allWords.length} words`)
}

// Roots generation — batch of 10 per call
if (type === 'roots') {
  const BATCH = 10
  let remaining = count

  while (remaining > 0) {
    const batchSize = Math.min(remaining, BATCH)
    const batchNum = Math.floor((count - remaining) / BATCH) + 1
    const totalBatches = Math.ceil(count / BATCH)

    console.log(`⏳ Batch ${batchNum}/${totalBatches} — requesting ${batchSize} roots...`)

    let raw: string
    try {
      raw = await generateWithRetry(apiKeys, model, buildRootsPrompt(level, batchSize))
    } catch (err) {
      console.error('\nAPI request failed after retries:', err)
      process.exit(1)
    }

    let roots
    try {
      roots = parseRootsResponse(raw)
    } catch (err) {
      console.error('\nFailed to parse response:', err)
      console.error('Raw response:\n', raw)
      process.exit(1)
    }

    console.log(`\n💾 Writing ${roots.length} root entries\n`)
    for (const root of roots) {
      writeRootEntry(root)
    }

    remaining -= batchSize
    if (remaining > 0) await new Promise(r => setTimeout(r, 4000))
  }

  console.log(`\n✅ Done! Generated root entries for ${level}`)
}
