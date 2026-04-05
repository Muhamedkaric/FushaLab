/**
 * One-time migration: strip root/bs/en from words[] in all content files.
 * Keeps only w + lemma. Dictionary is the source of truth for display data.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('../public/data')

function walkJson(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walkJson(full))
    } else if (entry.endsWith('.json') && entry !== 'index.json' && entry !== 'dictionary.json') {
      results.push(full)
    }
  }
  return results
}

const files = walkJson(DATA_DIR)

let totalFiles = 0
let modifiedFiles = 0
let totalWordsStripped = 0

for (const file of files) {
  totalFiles++
  let item: any
  try {
    item = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    continue
  }

  if (!Array.isArray(item.sentences)) continue

  let changed = false
  for (const sentence of item.sentences) {
    if (!Array.isArray(sentence.words)) continue
    for (const word of sentence.words) {
      if ('root' in word || 'bs' in word || 'en' in word) {
        delete word.root
        delete word.bs
        delete word.en
        changed = true
        totalWordsStripped++
      }
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(item, null, 2) + '\n', 'utf8')
    modifiedFiles++
    if (modifiedFiles % 100 === 0) {
      console.log(`  ${modifiedFiles} files updated...`)
    }
  }
}

console.log(`\nDone.`)
console.log(`  Files scanned:  ${totalFiles}`)
console.log(`  Files modified: ${modifiedFiles}`)
console.log(`  Words stripped: ${totalWordsStripped}`)
