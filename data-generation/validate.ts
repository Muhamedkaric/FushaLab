import 'dotenv/config'

/**
 * Validates all JSON files in public/data/ and reports issues.
 *
 * Checks:
 *   - Valid JSON structure
 *   - Required fields present
 *   - Arabic text contains harakat (diacritics)
 *   - ID matches filename
 *   - index.json is in sync with individual files
 *
 * Usage:
 *   pnpm validate
 *   pnpm validate --category travel
 *   pnpm validate --category travel --level B1
 */

import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import type { Category, Level } from './shared.ts'

const DATA_DIR = resolve(import.meta.dirname, '../public/data')

const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/

const argv = process.argv.slice(2)
const filterCategory = argv[argv.indexOf('--category') + 1] as Category | undefined
const filterLevel = argv[argv.indexOf('--level') + 1] as Level | undefined

let totalFiles = 0
let totalErrors = 0
let totalWarnings = 0

const categories = readdirSync(DATA_DIR).filter(
  f => !f.startsWith('.') && (!filterCategory || f === filterCategory)
)

for (const category of categories) {
  const catDir = join(DATA_DIR, category)
  const levels = readdirSync(catDir).filter(
    f => !f.startsWith('.') && (!filterLevel || f === filterLevel)
  )

  for (const level of levels) {
    const levelDir = join(catDir, level)
    const files = readdirSync(levelDir).filter(f => f.endsWith('.json') && f !== 'index.json')
    const indexPath = join(levelDir, 'index.json')

    console.log(`\n📁 ${category}/${level} (${files.length} items)`)

    // Validate each item file
    const foundIds: string[] = []
    for (const file of files.sort()) {
      totalFiles++
      const filePath = join(levelDir, file)
      const expectedId = file.replace('.json', '')

      try {
        const raw = readFileSync(filePath, 'utf-8')
        const item = JSON.parse(raw) as Record<string, unknown>

        const errors: string[] = []
        const warnings: string[] = []

        // Required fields
        for (const field of [
          'id',
          'category',
          'level',
          'arabic',
          'translation',
          'translationEn',
          'metadata',
        ]) {
          if (!(field in item)) errors.push(`missing field: "${field}"`)
        }

        // ID matches filename
        if (item['id'] !== expectedId)
          errors.push(`id "${String(item['id'])}" doesn't match filename "${expectedId}"`)

        // Arabic has harakat
        if (typeof item['arabic'] === 'string') {
          if (!HARAKAT_REGEX.test(item['arabic'])) {
            warnings.push('Arabic text has no harakat (diacritics)')
          } else {
            // Count harakat density
            const chars = item['arabic'].replace(/\s/g, '').length
            const harakatCount = (item['arabic'].match(/[\u064B-\u065F\u0670]/g) ?? []).length
            const arabicLetters = (item['arabic'].match(/[\u0600-\u06FF]/g) ?? []).length
            const coverage =
              arabicLetters > 0 ? Math.round((harakatCount / arabicLetters) * 100) : 0
            if (coverage < 40) warnings.push(`Low harakat coverage: ~${coverage}% (aim for >70%)`)
          }
        }

        // translationEn present (optional but recommended)
        if (!item['translationEn']) warnings.push('missing translationEn (English translation)')

        foundIds.push(expectedId)

        if (errors.length > 0) {
          totalErrors += errors.length
          console.log(`  ❌ ${file}: ${errors.join(', ')}`)
        } else if (warnings.length > 0) {
          totalWarnings += warnings.length
          console.log(`  ⚠️  ${file}: ${warnings.join(', ')}`)
        } else {
          console.log(`  ✅ ${file}`)
        }
      } catch {
        totalErrors++
        console.log(`  ❌ ${file}: invalid JSON`)
      }
    }

    // Validate index.json
    if (!existsSync(indexPath)) {
      totalErrors++
      console.log(`  ❌ index.json: MISSING`)
    } else {
      try {
        const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as {
          items: Array<{ id: string }>
        }
        const indexIds = index.items.map(i => i.id)

        const missingFromIndex = foundIds.filter(id => !indexIds.includes(id))
        const extraInIndex = indexIds.filter(id => !foundIds.includes(id))

        if (missingFromIndex.length > 0) {
          totalErrors++
          console.log(`  ❌ index.json: missing entries for: ${missingFromIndex.join(', ')}`)
        }
        if (extraInIndex.length > 0) {
          totalWarnings++
          console.log(
            `  ⚠️  index.json: has entries with no matching file: ${extraInIndex.join(', ')}`
          )
        }
        if (missingFromIndex.length === 0 && extraInIndex.length === 0) {
          console.log(`  ✅ index.json: in sync (${indexIds.length} items)`)
        }
      } catch {
        totalErrors++
        console.log(`  ❌ index.json: invalid JSON`)
      }
    }
  }
}

// Summary
console.log('\n' + '─'.repeat(50))
console.log(`📊 Summary: ${totalFiles} files checked`)
if (totalErrors > 0) console.log(`   ❌ ${totalErrors} error(s)`)
if (totalWarnings > 0) console.log(`   ⚠️  ${totalWarnings} warning(s)`)
if (totalErrors === 0 && totalWarnings === 0) console.log(`   ✅ Everything looks good!`)
console.log('')

if (totalErrors > 0) process.exit(1)
