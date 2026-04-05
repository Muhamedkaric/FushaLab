#!/usr/bin/env node
/**
 * merge-dictionary-lemmas.js
 *
 * Merges duplicate dictionary entries where a base lemma (e.g. "أَبْيَضُ")
 * and a combined lemma (e.g. "أَبْيَضُ / بَيْضَاءُ") represent the same word.
 *
 * Strategy:
 *  - Same root AND overlapping meaning → merge into combined key
 *  - Different roots OR clearly different meaning → skip (genuine homonyms)
 *
 * After merging the dictionary, updates all content JSON files to use the
 * new canonical lemma key.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DICT_PATH = path.resolve(__dirname, '../public/data/dictionary.json')
const DATA_DIR = path.resolve(__dirname, '../public/data')

// ── manual overrides ─────────────────────────────────────────────────────────
// Pairs the heuristic gets wrong — keyed as "baseKey|combinedKey"

// Force-skip: heuristic says merge but they're genuine homonyms / bad entries
const FORCE_SKIP = new Set([
  'رَبِيعٌ|رَبِيعٌ / أَرْبِعَةٌ',   // spring vs four (number)
  'فَجْرٌ|فَجْرٌ / فُجُورٌ',         // dawn vs debauchery/sin
  'طَقْسٌ|طَقْسٌ / طُقُوسٌ',         // weather vs rituals
  'صَبَاحٌ|صَبَاحٌ / بَاكِرٌ',        // morning / "early" (بَاكِرٌ is an adj, not a plural)
  'مَسَاءٌ|مَسَاءٌ / أَمْسِيَةٌ',     // evening vs evening supplication
])

// Force-merge: heuristic says skip but root transcription differences tripped it up
const FORCE_MERGE = new Set([
  'إِضَاءَةٌ|إِضَاءَةٌ / إِضَاءَاتٌ',     // lighting (different root spelling)
  'بُرْتُقَالٌ|بُرْتُقَالٌ / بُرْتُقَالَاتٌ', // orange
  'قَهْوَةٌ|قَهْوَةٌ / قَهَوَاتٌ',         // coffee (ق هـ و vs ق ه و)
  'مُهِمٌّ|مُهِمٌّ / أَهَمُّ',             // important / most important (same concept)
  'مَوْرُوثٌ|مَوْرُوثٌ / مَوْرُوثَاتٌ',    // inherited / heritage
  'رِضًا|رِضًا / رِضَاءٌ',               // satisfaction (variant spelling)
  'عَطَاءٌ|عَطَاءٌ / أَعْطِيَةٌ',         // giving/generosity (different root notation)
])

// ── helpers ─────────────────────────────────────────────────────────────────

function wordSet(str) {
  if (!str) return new Set()
  return new Set(
    str
      .toLowerCase()
      .replace(/[,;\/\-()]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  )
}

function overlap(a, b) {
  const sa = wordSet(a)
  const sb = wordSet(b)
  let common = 0
  for (const w of sa) if (sb.has(w)) common++
  return common
}

function meaningsSimilar(e1, e2) {
  // Any overlap in en or bs → similar enough to merge
  return overlap(e1.en, e2.en) > 0 || overlap(e1.bs, e2.bs) > 0
}

function sameRoot(e1, e2) {
  if (!e1.root || !e2.root) return null // unknown
  return e1.root.trim() === e2.root.trim()
}

function decideMerge(base, combined) {
  const rootMatch = sameRoot(base, combined)
  const similar = meaningsSimilar(base, combined)

  if (rootMatch === true && similar) return 'merge'
  if (rootMatch === false) return 'skip' // different roots → homonym
  if (rootMatch === null && similar) return 'merge' // no root info but meanings match
  if (rootMatch === true && !similar) return 'skip' // same root, wildly different meaning (like دَقِيقٌ)
  return 'skip'
}

function mergeEntries(base, combined, combinedKey) {
  // Prefer the more complete / longer string for bs and en
  const bs = combined.bs.length >= base.bs.length ? combined.bs : base.bs
  const en = combined.en.length >= base.en.length ? combined.en : base.en
  const root = combined.root || base.root || null
  return { lemma: combinedKey, root, bs, en }
}

// ── main ─────────────────────────────────────────────────────────────────────

const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'))
const keys = Object.keys(dict)

// Build a map: base → [combinedKey, ...]
const baseToCombinable = {}
for (const key of keys) {
  if (key.includes('/')) {
    const base = key.split('/')[0].trim()
    if (dict[base]) {
      if (!baseToCombinable[base]) baseToCombinable[base] = []
      baseToCombinable[base].push(key)
    }
  }
}

// Decide what to do for each pair
const toMerge = [] // { baseKey, combinedKey }
const skipped = []

for (const [baseKey, combinedKeys] of Object.entries(baseToCombinable)) {
  const baseEntry = dict[baseKey]
  for (const combinedKey of combinedKeys) {
    const pairKey = `${baseKey}|${combinedKey}`
    let decision
    if (FORCE_SKIP.has(pairKey)) {
      decision = 'skip'
    } else if (FORCE_MERGE.has(pairKey)) {
      decision = 'merge'
    } else {
      decision = decideMerge(baseEntry, dict[combinedKey])
    }
    if (decision === 'merge') {
      toMerge.push({ baseKey, combinedKey })
    } else {
      skipped.push({ baseKey, combinedKey, reason: 'homonym or ambiguous' })
    }
  }
}

console.log(`\nMerge: ${toMerge.length}  |  Skip (homonyms): ${skipped.length}\n`)

if (process.argv.includes('--dry-run')) {
  console.log('=== WOULD MERGE ===')
  toMerge.forEach(({ baseKey, combinedKey }) =>
    console.log(`  "${baseKey}"  →  "${combinedKey}"`),
  )
  console.log('\n=== WOULD SKIP (homonyms) ===')
  skipped.forEach(({ baseKey, combinedKey }) =>
    console.log(`  "${baseKey}"  ≠  "${combinedKey}"`),
  )
  process.exit(0)
}

// ── apply dictionary changes ──────────────────────────────────────────────────

// Snapshot base entries before any mutations so multi-pair bases still resolve
const baseSnapshot = {}
for (const { baseKey } of toMerge) {
  if (!baseSnapshot[baseKey]) baseSnapshot[baseKey] = dict[baseKey]
}

const resolvedBases = new Set()

for (const { baseKey, combinedKey } of toMerge) {
  const merged = mergeEntries(baseSnapshot[baseKey], dict[combinedKey], combinedKey)
  dict[combinedKey] = merged
  if (!resolvedBases.has(baseKey)) {
    delete dict[baseKey]
    resolvedBases.add(baseKey)
  }
}

fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n')
console.log(`Dictionary updated: ${toMerge.length} base entries removed/merged.`)

// ── update content files ──────────────────────────────────────────────────────

// Build remapping: old lemma string → new lemma string
const lemmaRemap = {}
for (const { baseKey, combinedKey } of toMerge) {
  lemmaRemap[baseKey] = combinedKey
}

let filesUpdated = 0
let replacementsTotal = 0

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'dictionary.json'.split('/')[0]) walkDir(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'dictionary.json') {
      let raw = fs.readFileSync(fullPath, 'utf8')
      let changed = false
      for (const [oldLemma, newLemma] of Object.entries(lemmaRemap)) {
        const escaped = oldLemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(`("lemma":\\s*")${escaped}(")`,'g')
        const updated = raw.replace(re, `$1${newLemma}$2`)
        if (updated !== raw) {
          raw = updated
          changed = true
          replacementsTotal++
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, raw)
        filesUpdated++
      }
    }
  }
}

walkDir(DATA_DIR)
console.log(`Content files updated: ${filesUpdated} files, ${replacementsTotal} lemma replacements.`)
console.log('\nDone.')
