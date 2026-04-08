/**
 * Fix systematically skipped content words in annotated files.
 *
 * Gemini tends to skip certain word categories even when they're content words:
 * - كَوْن forms (كَانَ، كَانَتْ، يَكُونُ etc.)
 * - Quantifiers (كُلَّ، بَعْضَ)
 * - Common adverbs (جِدًّا، أَيْضًا، فَقَطْ، مَعًا etc.)
 * - Negation (لَيْسَ)
 * - Prepositions with content meaning (عِنْدَ، حَوْلَ، أَمَامَ etc.)
 * - Numbers (وَاحِدٌ، ثَلَاثَةٌ etc.)
 * - and more
 *
 * This script applies all known fixes deterministically — no API calls.
 * Run after backfill-word-annotations.ts to patch up systematic gaps.
 *
 * Usage:
 *   pnpm fix-systematic-words              # default: B2
 *   pnpm fix-systematic-words --levels=B1,B2,C1,C2
 *
 * After fixing, prints a gap report of any remaining high-frequency
 * unannotated tokens (freq ≥ 5) that are NOT in the known skip list.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../public/data')

const arg = process.argv.find(a => a.startsWith('--levels='))
const LEVELS = (arg?.split('=')[1] ?? 'B2').split(',')

// ── Comprehensive word fixes ───────────────────────────────────────────────
// Each entry: exact token forms that appear in sentences → lemma to assign
// Covers everything discovered during B1 analysis + likely higher-level forms

const WORD_FIXES: Array<{ forms: string[]; lemma: string }> = [
  // ── كَوْن — ALL past + present + jussive forms ──────────────────────────
  {
    forms: [
      'كَانَ','كَانَتْ','كَانَتِ','كَانُوا','كَانَا','كَانَتَا',
      'كُنْتُ','كُنْتَ','كُنْتِ','كُنَّا','كُنْتُمْ','كُنْتُنَّ','كُنَّ',
      'وَكَانَ','وَكَانَتْ','وَكَانَتِ','وَكَانُوا',
      'فَكَانَ','فَكَانَتْ','فَكَانَتِ','فَكَانُوا',
      'يَكُونُ','تَكُونُ','يَكُونَ','تَكُونَ','يَكُنْ','تَكُنْ',
      'أَكُونُ','نَكُونُ','يَكُونُونَ','تَكُونُونَ','يَكُنَّ','كُونُوا',
    ],
    lemma: 'كَانَ يَكُونُ',
  },

  // ── لَيْسَ — negation copula ─────────────────────────────────────────────
  {
    forms: ['لَيْسَ','لَيْسَتْ','لَيْسُوا','لَسْتُ','لَسْتَ','لَسْتِ','لَسْنَا','لَسْتُمْ','لَسْتُنَّ'],
    lemma: 'لَيْسَ',
  },

  // ── يَجِبُ — must/should ──────────────────────────────────────────────────
  { forms: ['يَجِبُ','وَجَبَ','يَجِبَ','وَجَبَتْ'], lemma: 'وَجَبَ يَجِبُ' },

  // ── عِنْدَمَا — when ─────────────────────────────────────────────────────
  { forms: ['عِنْدَمَا'], lemma: 'عِنْدَمَا' },

  // ── حِينَ — when/while ───────────────────────────────────────────────────
  { forms: ['حِينَ','حِينَئِذٍ','حِينَئِذٍ'], lemma: 'حِينٌ / أَحْيَانٌ' },

  // ── كُلّ — every/all ──────────────────────────────────────────────────────
  {
    forms: [
      'كُلَّ','كُلُّ','كُلِّ','لِكُلِّ','بِكُلِّ',
      'كُلَّهُ','كُلَّهَا','كُلَّهُمْ','كُلِّهِ','كُلِّهَا','كُلِّهِمْ',
      'وَكُلَّ','فَكُلَّ','كُلِّهِنَّ','كُلُّهُمْ','كُلُّهَا',
    ],
    lemma: 'كُلٌّ',
  },

  // ── بَعْض — some ──────────────────────────────────────────────────────────
  {
    forms: ['بَعْضَ','بَعْضُ','بَعْضِ','بَعْضِهَا','بَعْضِهِمْ','بَعْضِهِ','بَعْضُهُمْ','بَعْضُهَا'],
    lemma: 'بَعْضٌ',
  },

  // ── جِدًّا — very ─────────────────────────────────────────────────────────
  { forms: ['جِدًّا'], lemma: 'جِدًّا' },

  // ── أَيْضًا — also ────────────────────────────────────────────────────────
  { forms: ['أَيْضًا'], lemma: 'أَيْضًا' },

  // ── فَقَطْ — only ─────────────────────────────────────────────────────────
  { forms: ['فَقَطْ'], lemma: 'فَقَطْ' },

  // ── مَعًا — together ─────────────────────────────────────────────────────
  { forms: ['مَعًا'], lemma: 'مَعًا' },

  // ── هُنَاكَ / هُنَا — there / here ──────────────────────────────────────
  { forms: ['هُنَاكَ'], lemma: 'هُنَاكَ' },
  { forms: ['هُنَا'], lemma: 'هُنَا' },

  // ── أَمَامَ — in front of ──────────────────────────────────────────────────
  { forms: ['أَمَامَ','أَمَامَهُ','أَمَامَهَا','أَمَامَهُمْ'], lemma: 'أَمَامَ' },

  // ── عِنْدَ — at/with ─────────────────────────────────────────────────────
  {
    forms: ['عِنْدَ','عِنْدَهُ','عِنْدَهَا','عِنْدَهُمْ','عِنْدَنَا','عِنْدَكَ','عِنْدَكِ','عِنْدِي'],
    lemma: 'عِنْدَ',
  },

  // ── حَوْلَ — around/about ─────────────────────────────────────────────────
  { forms: ['حَوْلَ','حَوْلَهُ','حَوْلَهَا','حَوْلَهُمْ'], lemma: 'حَوْلَ' },

  // ── بِدُونِ — without ────────────────────────────────────────────────────
  { forms: ['بِدُونِ'], lemma: 'بِدُونِ' },

  // ── لِأَنَّ — because ─────────────────────────────────────────────────────
  { forms: ['لِأَنَّ','لِأَنَّهُ','لِأَنَّهَا','لِأَنَّهُمْ'], lemma: 'لِأَنَّ' },

  // ── أَثْنَاءَ — during ───────────────────────────────────────────────────
  { forms: ['أَثْنَاءَ'], lemma: 'أَثْنَاءُ' },

  // ── طَوَالَ — throughout ─────────────────────────────────────────────────
  { forms: ['طَوَالَ'], lemma: 'طَوَالَ' },

  // ── بَدَلَ — instead of ──────────────────────────────────────────────────
  { forms: ['بَدَلَ','بَدَلًا'], lemma: 'بَدَلَ' },

  // ── عَبْرَ — via/through ─────────────────────────────────────────────────
  { forms: ['عَبْرَ'], lemma: 'عَبْرَ' },

  // ── أُخْرَى / آخَرُ — other ─────────────────────────────────────────────
  { forms: ['أُخْرَى','آخَرُ','آخَرَ','أُخَرُ','أَخِيرًا'], lemma: 'آخَرُ / أُخْرَى' },

  // ── تَحْتَ — under ───────────────────────────────────────────────────────
  { forms: ['تَحْتَ','تَحْتَهُ','تَحْتَهَا'], lemma: 'تَحْتَ' },

  // ── نَفْسٌ — self/same ───────────────────────────────────────────────────
  {
    forms: ['نَفْسِ','نَفْسَهُ','نَفْسَهَا','نَفْسُهُ','نَفْسِهِ','نَفْسِهَا','نَفْسٌ','نَفْسَهُمْ','نَفْسُهَا'],
    lemma: 'نَفْسٌ / نُفُوسٌ',
  },

  // ── بِسَبَبِ — because of ────────────────────────────────────────────────
  { forms: ['بِسَبَبِ','بِسَبَبِهِ','بِسَبَبِهَا'], lemma: 'سَبَبٌ / أَسْبَابٌ' },

  // ── أَحَدٌ — someone/anyone ──────────────────────────────────────────────
  { forms: ['أَحَدٌ','أَحَدًا','أَحَدٍ','أَحَدُهُمْ'], lemma: 'أَحَدٌ' },

  // ── وَاحِدٌ — one ─────────────────────────────────────────────────────────
  {
    forms: ['وَاحِدٌ','وَاحِدًا','وَاحِدٍ','وَاحِدَةٌ','وَاحِدَةً','وَاحِدَةٍ','وَاحِدَهَا'],
    lemma: 'وَاحِدٌ',
  },

  // ── قَلِيلٌ — few/little ─────────────────────────────────────────────────
  { forms: ['قَلِيلٌ','قَلِيلًا','قَلِيلٍ','قَلِيلَةٌ','قَلِيلَةً','قَلِيلَةٍ'], lemma: 'قَلِيلٌ' },

  // ── ذَاتَ — same/self (in expressions) ───────────────────────────────────
  { forms: ['ذَاتَ','ذَاتِ'], lemma: 'ذَاتٌ' },

  // ── أَوَّلُ / أُولَى — first ──────────────────────────────────────────────
  { forms: ['لِأَوَّلِ','أَوَّلَ','أَوَّلُ','أَوَّلِ','أَوَّلًا'], lemma: 'أَوَّلُ / أُولَى' },

  // ── اسْمٌ with pronoun suffixes ──────────────────────────────────────────
  { forms: ['اسْمُهُ','اسْمُهَا','اسْمُهُمْ','اسْمِهِ','اسْمِهَا'], lemma: 'اسْمٌ / أَسْمَاءٌ' },

  // ── بِجَانِبِ — beside ───────────────────────────────────────────────────
  { forms: ['بِجَانِبِ','بِجَانِبِهِ','بِجَانِبِهَا'], lemma: 'جَانِبٌ / جَوَانِبُ' },

  // ── اليَوْمَ — today ─────────────────────────────────────────────────────
  { forms: ['اليَوْمَ'], lemma: 'يَوْمٌ / أَيَّامٌ' },

  // ── لِلْجَمِيعِ — for everyone ───────────────────────────────────────────
  { forms: ['لِلْجَمِيعِ','بِالجَمِيعِ'], lemma: 'جَمِيعٌ' },

  // ── الْحَمْدُ — praise ────────────────────────────────────────────────────
  { forms: ['الْحَمْدُ','الحَمْدُ','الْحَمْدِ','الحَمْدِ'], lemma: 'حَمْدٌ' },

  // ── طُولَ / وَسَط — length / middle ──────────────────────────────────────
  { forms: ['طُولَ','طُولِ'], lemma: 'طُولٌ' },
  { forms: ['وَسَطِ','وَسَطَ','وَسَطٌ','وَسَطًا'], lemma: 'وَسَطٌ / أَوْسَاطٌ' },

  // ── numbers ───────────────────────────────────────────────────────────────
  { forms: ['عِشْرِينَ','عِشْرُونَ'], lemma: 'عِشْرُونَ' },
  { forms: ['ثَلَاثَةِ','ثَلَاثَةٌ','ثَلَاثَةً','ثَلَاثٍ','ثَلَاثًا','ثَلَاثُ'], lemma: 'ثَلَاثَةٌ' },
  { forms: ['خَمْسَ','خَمْسَةٌ','خَمْسَةِ','خَمْسًا','خَمْسٌ'], lemma: 'خَمْسَةٌ' },
  { forms: ['أَرْبَعَةٌ','أَرْبَعَةِ','أَرْبَعَةً','أَرْبَعًا','أَرْبَعَ'], lemma: 'أَرْبَعَةٌ' },
  { forms: ['سِتَّةٌ','سِتَّةِ','سِتًّا','سِتٌّ'], lemma: 'سِتَّةٌ' },
  { forms: ['سَبْعَةٌ','سَبْعَةِ','سَبْعًا','سَبْعٌ'], lemma: 'سَبْعَةٌ' },
  { forms: ['ثَمَانِيَةٌ','ثَمَانِيَةِ','ثَمَانِيًا','ثَمَانٍ'], lemma: 'ثَمَانِيَةٌ' },
  { forms: ['تِسْعَةٌ','تِسْعَةِ','تِسْعًا','تِسْعٌ'], lemma: 'تِسْعَةٌ' },
  { forms: ['عَشَرَةٌ','عَشَرَةِ','عَشَرَةً','عَشْرًا','عَشْرٌ'], lemma: 'عَشَرَةٌ' },
  { forms: ['اثْنَانِ','اثْنَيْنِ','اثْنَتَانِ','اثْنَتَيْنِ'], lemma: 'اثْنَانِ' },
  { forms: ['الثَّامِنَةِ','الثَّامِنُ','الثَّامِنَةُ','الثَّامِنَ'], lemma: 'ثَامِنٌ' },
  { forms: ['ثَلَاثِينَ','ثَلَاثُونَ'], lemma: 'ثَلَاثُونَ' },
  { forms: ['أَرْبَعِينَ','أَرْبَعُونَ'], lemma: 'أَرْبَعُونَ' },
  { forms: ['خَمْسِينَ','خَمْسُونَ'], lemma: 'خَمْسُونَ' },
  { forms: ['مِئَةٌ','مِئَةِ','مِئَةً','مِائَةٌ','مِائَةِ'], lemma: 'مِئَةٌ' },
  { forms: ['أَلْفٌ','أَلْفِ','أَلْفًا','آلَافٌ'], lemma: 'أَلْفٌ / آلَافٌ' },

  // ── أَبَاهَا / أَبَاهُ — her/his father ──────────────────────────────────
  { forms: ['أَبَاهَا','أَبَاهُ','أَبَاهُمْ'], lemma: 'أَبٌ / آبَاءٌ' },

  // ── لِأُمِّهَا — to her mother ────────────────────────────────────────────
  { forms: ['لِأُمِّهَا','لِأُمِّهِ','لِأُمِّهِمْ'], lemma: 'أُمٌّ / أُمَّهَاتٌ' },
]

// ── Known skip tokens (function words — never annotate) ───────────────────
const SKIP = new Set([
  'فِي','عَلَى','مِنْ','مِنَ','إِلَى','وَ','فَ','بِ','لِ','أَنْ','إِنَّ','إِنَّهُ','إِنَّهَا','إِنَّهُمْ',
  'هُوَ','هِيَ','هُمْ','هُنَّ','أَنَا','نَحْنُ','أَنْتَ','أَنْتِ','أَنْتُمْ',
  'هَذَا','هَذِهِ','ذَلِكَ','تِلْكَ','الَّذِي','الَّتِي','الَّذِينَ',
  'لَا','لَمْ','لَنْ','قَدْ','سَوْفَ',
  'مَا','مَنْ','أَيْنَ','كَيْفَ','مَتَى','لِمَاذَا','لِمَ',
  'عَنْ','عَنِ','بَيْنَ','مَعَ','بَعْدَ','قَبْلَ','حَتَّى','مُنْذُ','خِلَالَ','رَغْمَ',
  'أَوْ','لَكِنَّ','لَكِنْ','بَلْ','ثُمَّ','أَمَّا',
  'كَمَا','مِمَّا','مِمَّنْ',
  'إِذَا','لَوْ','لَوْلَا',
  'أَنَّ','أَنَّهُ','أَنَّهَا','أَنَّهُمْ','أَنَّهُمَا',
  'لَهُ','لَهَا','لَهُمْ','لَهُنَّ','لَنَا','لِي','لَكَ','لَكِ','لَكُمْ',
  'بِهِ','بِهَا','بِهِمْ','مِنْهُ','مِنْهَا','مِنْهُمْ',
  'فِيهِ','فِيهَا','فِيهِمْ','عَلَيْهِ','عَلَيْهَا','عَلَيْهِمْ',
  'إِلَيْهِ','إِلَيْهَا','إِلَيْهِمْ',
  'وَلَمْ','وَهِيَ','وَهُوَ','وَهُمْ','وَلَا','فَلَا','فَلَمْ',
  'لَكِنَّهُ','لَكِنَّهَا','لَكِنَّهُمْ','لِأَنَّهُ','لِأَنَّهَا','لِأَنَّهُمْ',
  'مَعَهُ','مَعَهَا','مَعَهُمْ','مَعَهُنَّ','مَعَنَا',
  'يَا','أَيُّهَا','أَيَّتُهَا',
  'بِهَذَا','بِهَذِهِ','عَنْهُ','عَنْهَا','عَلَيْنَا','بِأَنْ','إِنْ',
  'هَلْ','لِلَّهِ',
])

// ── Helpers ───────────────────────────────────────────────────────────────

function collectFiles(levels: string[]): string[] {
  const results: string[] = []
  const categories = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(join(DATA_DIR, d)).isDirectory() } catch { return false }
  })
  for (const level of levels) {
    for (const cat of categories) {
      const dir = join(DATA_DIR, cat, level)
      if (!existsSync(dir)) continue
      readdirSync(dir)
        .filter(f => f.endsWith('.json') && f !== 'index.json')
        .forEach(f => results.push(join(dir, f)))
    }
  }
  return results
}

// ── Build form→lemma map ──────────────────────────────────────────────────

const formToLemma = new Map<string, string>()
for (const fix of WORD_FIXES)
  for (const form of fix.forms) formToLemma.set(form, fix.lemma)

// ── Apply fixes ───────────────────────────────────────────────────────────

console.log(`\n🔧 FushaLab Systematic Word Fix (levels: ${LEVELS.join(', ')})`)
console.log(`   Known fix forms: ${formToLemma.size}\n`)

interface WordAnnotation { w: string; lemma?: string }
interface Sentence { arabic: string; words?: WordAnnotation[] }
interface ContentItem { id: string; sentences: Sentence[] }

const files = collectFiles(LEVELS)
let totalAdded = 0, filesModified = 0

for (const filePath of files) {
  let item: ContentItem
  try { item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem }
  catch { continue }

  let modified = false
  for (const sentence of item.sentences) {
    const tokens = sentence.arabic.split(/\s+/).map(t => t.replace(/[.،؟!:«»"'()\[\]]+/g, ''))
    if (!sentence.words) sentence.words = []
    const annotated = new Set(sentence.words.map(w => w.w))

    for (let ti = 0; ti < tokens.length; ti++) {
      const token = tokens[ti]
      const lemma = formToLemma.get(token)
      if (!lemma || annotated.has(token)) continue

      let insertAt = sentence.words.length
      for (let i = sentence.words.length - 1; i >= 0; i--) {
        const wIdx = tokens.indexOf(sentence.words[i].w)
        if (wIdx !== -1 && wIdx < ti) { insertAt = i + 1; break }
        if (wIdx !== -1 && wIdx > ti) insertAt = i
      }
      sentence.words.splice(insertAt, 0, { w: token, lemma })
      annotated.add(token)
      modified = true
      totalAdded++
    }
  }

  if (modified) { writeFileSync(filePath, JSON.stringify(item, null, 2)); filesModified++ }
}

console.log(`✓ Added ${totalAdded} annotations across ${filesModified} files`)

// ── Gap report — remaining high-frequency unannotated tokens ──────────────

console.log('\n📊 Gap report (freq ≥ 5, coverage < 30%, not in skip list):')

const sentFreq = new Map<string, number>()
const annFreq = new Map<string, number>()

for (const filePath of files) {
  let item: ContentItem
  try { item = JSON.parse(readFileSync(filePath, 'utf-8')) as ContentItem }
  catch { continue }
  for (const s of item.sentences) {
    const tokens = s.arabic.split(/\s+/).map(t => t.replace(/[.،؟!:«»"'()\[\]]+/g, ''))
    for (const t of tokens) if (t) sentFreq.set(t, (sentFreq.get(t) || 0) + 1)
    for (const w of s.words ?? []) if (w.w) annFreq.set(w.w, (annFreq.get(w.w) || 0) + 1)
  }
}

const gaps: Array<{ token: string; freq: number; ann: number }> = []
for (const [token, freq] of sentFreq) {
  if (freq < 5 || SKIP.has(token) || token.length < 2) continue
  const ann = annFreq.get(token) ?? 0
  if (ann / freq < 0.3) gaps.push({ token, freq, ann })
}

gaps.sort((a, b) => b.freq - a.freq)

if (gaps.length === 0) {
  console.log('  ✅ No significant gaps found!\n')
} else {
  console.log(`  Found ${gaps.length} tokens — top 30:\n`)
  console.log('  Token'.padEnd(28) + 'Freq  Ann')
  console.log('  ' + '─'.repeat(40))
  for (const g of gaps.slice(0, 30)) {
    const pct = Math.round(g.ann / g.freq * 100)
    console.log(`  ${g.token.padEnd(26)}${String(g.freq).padEnd(6)}${g.ann} (${pct}%)`)
  }
  if (gaps.length > 30) console.log(`  ... and ${gaps.length - 30} more`)
  console.log()
}
