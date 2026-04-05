#!/usr/bin/env node
/**
 * standardize-dictionary.cjs
 *
 * Fixes three categories of dictionary issues:
 *  1. Hamzat al-wasl: bare ا → اِ for all entries where the initial alif
 *     is hamzat al-wasl (Form V-X verbs, اسم، ابن، امرأة, etc.)
 *  2. Definite article in key: delete duplicates, strip ال where it doesn't belong
 *  3. Multiple plural/variant entries per word: reduce to one canonical form
 *  4. Spelling variants: pick the correct harakat spelling
 *
 * After every change, content files are updated to use the new canonical lemma.
 */

const fs   = require('fs')
const path = require('path')

const DICT_PATH = path.resolve(__dirname, '../public/data/dictionary.json')
const DATA_DIR  = path.resolve(__dirname, '../public/data')

const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'))

// ── helpers ──────────────────────────────────────────────────────────────────

function isBareAlif(word) {
  const c0 = word.charCodeAt(0)
  const c1 = word.charCodeAt(1)
  return c0 === 0x0627 && (c1 < 0x064B || c1 > 0x065F) // ا not followed by harakat
}

// Normalize a single Arabic word: bare ا at start → اِ
function addKasra(word) {
  return isBareAlif(word) ? '\u0627\u0650' + word.slice(1) : word
}

// Normalize a full lemma key (handles "sg / pl" and "past present" formats)
function normalizeKey(key) {
  return key
    .split(' / ')
    .map(part => part.split(' ').map(addKasra).join(' '))
    .join(' / ')
}

function mergeEntries(a, b, canonicalKey) {
  const bs   = (a.bs || '').length >= (b.bs || '').length ? a.bs : b.bs
  const en   = (a.en || '').length >= (b.en || '').length ? a.en : b.en
  const root = a.root || b.root || null
  return { lemma: canonicalKey, root, bs, en }
}

function escape(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── 1. DEFINITE ARTICLE HANDLING ─────────────────────────────────────────────

// Words that are inherently definite in Arabic — keep ال as part of the lemma
const DEFINITE_KEEP = new Set([
  'الِاثْنَيْنِ',
  'الأَرْصَادُ الْجَوِّيَّةُ',
  'الإِنْجِلِيزِيَّةُ',
  'الْبَارِحَةُ',
  'الجُغْرَافِيَا',
  'الْجَمِيعُ',
  'الْحَمْدُ لِلَّهِ',
  'الدُّنْيَا',
  'الْقُرْآنُ الْكَرِيمُ',
  'اللَّهُ',
])

// Entries where ال is redundant — delete entirely
// (the indefinite form already exists as the canonical entry)
const DEFINITE_DELETE = new Set([
  'الْمُوسِيقَى',   // dup of مُوسِيقَى / مُوسِيقَاتٌ
  'النَّاسُ',       // dup of نَاسٌ
])

// Entries where ال should be stripped — rename to the indefinite form
// { oldKey: newKey }
const DEFINITE_STRIP = {
  'الْمِيكْرُوَيف': 'مِيكْرُوَيف',
}

// ── 2. MULTI-PLURAL / VARIANT CLEANUP ────────────────────────────────────────
// { deleteKey: canonicalKey }  — delete the first, remap content to the second

const MULTI_PLURAL_DELETE = {
  // أَذَانٌ: keep أَذَانَاتٌ plural
  'أَذَانٌ / آذِنَةٌ':                    'أَذَانٌ / أَذَانَاتٌ',
  // اِسْمٌ: keep tanwin form (diptote without tanwin deleted)
  'اِسْمٌ / أَسْمَاءُ':                   'اِسْمٌ / أَسْمَاءٌ',
  // أُغْنِيَةٌ: broken plural is standard
  'أُغْنِيَةٌ / أُغْنِيَاتٌ':             'أُغْنِيَةٌ / أَغَانٍ',
  // أَكْلَةٌ: spelling variant
  'أَكْلَةٌ / أَكَلَاتٌ':                 'أَكْلَةٌ / أَكْلَاتٌ',
  // إِنْسَانٌ: أُنَاسٌ is the direct broken plural
  'إِنْسَانٌ / نَاسٌ':                    'إِنْسَانٌ / أُنَاسٌ',
  // بَذْرَةٌ: broken plural
  'بَذْرَةٌ / بَذَرَاتٌ':                 'بَذْرَةٌ / بُذُورٌ',
  // بَقَرَةٌ: collective noun form
  'بَقَرَةٌ / أَبْقَارٌ':                 'بَقَرَةٌ / بَقَرٌ',
  // بَلَدٌ: بِلَادٌ is more common in MSA
  'بَلَدٌ / بُلْدَانٌ':                   'بَلَدٌ / بِلَادٌ',
  // جِدَارٌ: جُدْرَانٌ is more common
  'جِدَارٌ / جُدُرٌ':                     'جِدَارٌ / جُدْرَانٌ',
  // جُمُعَةٌ: broken plural
  'جُمُعَةٌ / جُمُعَاتٌ':                'جُمُعَةٌ / جُمَعٌ',
  // حَجَرٌ: أَحْجَارٌ is more common
  'حَجَرٌ / حِجَارَةٌ':                  'حَجَرٌ / أَحْجَارٌ',
  // خُضَارٌ: standardize spelling
  'خُضَارٌ / خُضَرَاوَاتٌ':              'خُضَارٌ / خَضْرَاوَاتٌ',
  'خُضَارٌ / خُضْرَاوَاتٌ':              'خُضَارٌ / خَضْرَاوَاتٌ',
  // خُطْوَةٌ: spelling variant
  'خُطْوَةٌ / خُطْوَاتٌ':                'خُطْوَةٌ / خُطُوَاتٌ',
  // خَيْرٌ: خَيْرَاتٌ is more common for blessings
  'خَيْرٌ / خُيُورٌ':                    'خَيْرٌ / خَيْرَاتٌ',
  // رِحْلَةٌ: broken plural
  'رِحْلَةٌ / رِحَلَاتٌ':                'رِحْلَةٌ / رِحَلٌ',
  'رِحْلَةٌ / رِحْلَاتٌ':                'رِحْلَةٌ / رِحَلٌ',
  // زَهْرَةٌ: أَزْهَارٌ is most common
  'زَهْرَةٌ / زَهَرَاتٌ':                'زَهْرَةٌ / أَزْهَارٌ',
  'زَهْرَةٌ / زُهُورٌ':                  'زَهْرَةٌ / أَزْهَارٌ',
  // صَبَاحٌ: sound plural; remove bad entries
  'صَبَاحٌ / أَصْبَاحٌ':                 'صَبَاحٌ / صَبَاحَاتٌ',
  'صَبَاحٌ / أَصْبِحَةٌ':                'صَبَاحٌ / صَبَاحَاتٌ',
  'صَبَاحٌ / بَاكِرٌ':                   'صَبَاحٌ / صَبَاحَاتٌ', // بَاكِرٌ ≠ plural
  // صِنَاعَةٌ: broken plural
  'صِنَاعَةٌ / صِنَاعَاتٌ':              'صِنَاعَةٌ / صَنَائِعُ',
  // صَوْتٌ: remove weird phrase-in-key entry
  'صَوْتٌ / أَصْوَاتٌ — عَالٍ':          'صَوْتٌ / أَصْوَاتٌ',
  // صَيْدَلَانِيٌّ: broken plural is canonical
  'صَيْدَلَانِيٌّ / صَيَادِلَةُ':        'صَيْدَلَانِيٌّ / صَيَادِلَةٌ',
  'صَيْدَلَانِيٌّ / صَيْدَلَانِيُّونَ':  'صَيْدَلَانِيٌّ / صَيَادِلَةٌ',
  // طِفْلَةٌ: sound feminine plural for the feminine form
  'طِفْلَةٌ / أَطْفَالٌ':                'طِفْلَةٌ / طِفْلَاتٌ',
  'طِفْلَةٌ / طِفْلٌ / أَطْفَالٌ':       'طِفْلَةٌ / طِفْلَاتٌ',
  // طَقْسٌ: remove wrong entry (طُقُوسٌ = rituals, not weather)
  'طَقْسٌ / طُقُوسٌ':                   'طَقْسٌ / أَطْقَاسٌ',
  // عَسَلٌ: أَعْسَالٌ is more common
  'عَسَلٌ / عُسُولٌ':                   'عَسَلٌ / أَعْسَالٌ',
  // غَدَاءٌ: أَغْذِيَةٌ (foods/provisions)
  'غَدَاءٌ / أَغْدِيَةٌ':                'غَدَاءٌ / أَغْذِيَةٌ',
  // فَقِيرٌ: diptote — no tanwin
  'فَقِيرٌ / فُقَرَاءٌ':                 'فَقِيرٌ / فُقَرَاءُ',
  // كُرَّاسَةٌ: broken plural
  'كُرَّاسَةٌ / كُرَّاسَاتٌ':            'كُرَّاسَةٌ / كَرَارِيسُ',
  // لُعْبَةٌ: أَلْعَابٌ is more common
  'لُعْبَةٌ / لُعَبٌ':                   'لُعْبَةٌ / أَلْعَابٌ',
  // مُدِيرٌ: broken plural
  'مُدِيرٌ / مُدِيرُونَ':                'مُدِيرٌ / مُدَرَاءُ',
  // مَوْجَةٌ: broken plural
  'مَوْجَةٌ / مَوْجَاتٌ':                'مَوْجَةٌ / أَمْوَاجٌ',
  // نَجْمَةٌ: broken plural
  'نَجْمَةٌ / نَجْمَاتٌ':                'نَجْمَةٌ / نُجُومٌ',
  // نَهَارٌ: أَنْهُرٌ and أَنْهِرَةٌ are plurals of نَهَرٌ (river), NOT نَهَارٌ (day)
  'نَهَارٌ / أَنْهُرٌ':                  'نَهَارٌ',
  'نَهَارٌ / أَنْهِرَةٌ':                'نَهَارٌ',
  // شُرْطِيٌّ: sound plural is standard for this pattern
  'شُرْطِيٌّ / شُرْطَةٌ':               'شُرْطِيٌّ / شُرْطِيُّونَ',
  // شَعْرٌ: أَشْعَارٌ is standard (poetry/hair)
  'شَعْرٌ / شُعُورٌ':                   'شَعْرٌ / أَشْعَارٌ',
  // وَجْبَةٌ: harakat variant
  'وَجْبَةٌ / وَجْبَاتٌ':                'وَجْبَةٌ / وَجَبَاتٌ',
  // وَرْدَةٌ: broken plural
  'وَرْدَةٌ / وَرْدَاتٌ':                'وَرْدَةٌ / وُرُودٌ',
  // وَصْفَةٌ: harakat variant
  'وَصْفَةٌ / وَصْفَاتٌ':                'وَصْفَةٌ / وَصَفَاتٌ',
}

// ── 3. SPELLING VARIANT CLEANUP ──────────────────────────────────────────────
// { deleteKey: canonicalKey }

const SPELLING_DELETE = {
  // أَهَمِّيَّةٌ: shadda is required
  'أَهَمِّيَةٌ':                          'أَهَمِّيَّةٌ',
  // أَوَّلُ: ordinal/elative — no tanwin
  'أَوَّلٌ':                             'أَوَّلُ',
  // أَمْسِ: correct sukun form
  'أَمَسِ':                              'أَمْسِ',
  // rice: رُزٌّ is simplest and most common
  'أَرُزٌّ':                             'رُزٌّ',
  'أُرُزٌّ':                             'رُزٌّ',
  // سُوبَرْمَارْكِتٌ: with tanwin
  'سُوبَرْمَارْكِت':                     'سُوبَرْمَارْكِتٌ',
  // إِنْتَرْنِتٌ: fatha vowel is standard
  'إِنْتِرْنِتٌ':                        'إِنْتَرْنِتٌ',
  // سِينَمَا: fatha is standard
  'سِينِمَا':                            'سِينَمَا',
  // بِطَاقَةٌ / بِطَاقَاتٌ: kasra on ba is standard (Hans Wehr)
  'بَطَاقَةٌ / بَطَاقَاتٌ':              'بِطَاقَةٌ / بِطَاقَاتٌ',
  // ثَلْجٌ: sukun on lam is correct
  'ثَلَجٌ / ثُلُوجٌ':                   'ثَلْجٌ / ثُلُوجٌ',
  // بَذْرَةٌ: fatha on ba is standard
  'بِذْرَةٌ / بُذُورٌ':                  'بَذْرَةٌ / بُذُورٌ',
  // بِطَّانِيَّةٌ: with shadda on ya is more standard
  'بِطَّانِيَةٌ / بِطَّانِيَاتٌ':        'بِطَّانِيَّةٌ / بَطَّانِيَّاتٌ',
  // بَقَالَةٌ: no shadda on qa for "grocery store"
  'بَقَّالَةٌ / بَقَّالَاتٌ':            'بَقَالَةٌ / بَقَالَاتٌ',
  // typo: double kasra in present tense
  'أَسْهَمَ يُسْهِِمُ':                  'أَسْهَمَ يُسْهِمُ',
  // مَرْأَةٌ: non-standard form; اِمْرَأَةٌ is correct
  'مَرْأَةٌ / نِسَاءٌ':                  'اِمْرَأَةٌ / نِسَاءٌ',
}

// ── EXECUTE ───────────────────────────────────────────────────────────────────

// Master remap: old lemma → canonical lemma (for content file updates)
const remap = {}

let deletedCount   = 0
let renamedCount   = 0
let mergedCount    = 0

// -- Step A: Definite article cleanup

for (const key of DEFINITE_DELETE) {
  if (dict[key]) {
    // Map to the correct indefinite canonical key if used in content files
    if (key === 'الْمُوسِيقَى') remap[key] = 'مُوسِيقَى / مُوسِيقَاتٌ'
    if (key === 'النَّاسُ')     remap[key] = 'نَاسٌ'
    delete dict[key]
    deletedCount++
  }
}

for (const [oldKey, newKey] of Object.entries(DEFINITE_STRIP)) {
  if (dict[oldKey]) {
    const entry = { ...dict[oldKey], lemma: newKey }
    dict[newKey] = entry
    remap[oldKey] = newKey
    delete dict[oldKey]
    renamedCount++
  }
}

// -- Step B: Hamzat al-wasl normalization

// Snapshot all keys before mutating (some renames create new keys)
const snapshotKeys = Object.keys(dict).slice()

for (const key of snapshotKeys) {
  // Skip inherently-definite entries
  if (DEFINITE_KEEP.has(key)) continue

  const canonical = normalizeKey(key)
  if (canonical === key) continue  // already correct

  const existing = dict[canonical]

  if (existing) {
    // Merge: keep canonical, take best data from both
    dict[canonical] = mergeEntries(dict[key], existing, canonical)
    remap[key] = canonical
    delete dict[key]
    mergedCount++
  } else {
    // Rename
    const entry = { ...dict[key], lemma: canonical }
    dict[canonical] = entry
    remap[key] = canonical
    delete dict[key]
    renamedCount++
  }
}

// -- Step C: Multiple plural / variant cleanup

for (const [deleteKey, canonicalKey] of Object.entries(MULTI_PLURAL_DELETE)) {
  // The canonical key might itself have been renamed by hamzat fix above
  const resolvedCanonical = remap[canonicalKey] || canonicalKey

  if (!dict[deleteKey]) continue

  // If canonical doesn't exist yet (nَهَارٌ case), create it from the entry being deleted
  if (!dict[resolvedCanonical]) {
    const e = dict[deleteKey]
    dict[resolvedCanonical] = { lemma: resolvedCanonical, root: e.root, bs: e.bs, en: e.en }
  }

  remap[deleteKey] = resolvedCanonical
  delete dict[deleteKey]
  deletedCount++
}

// -- Step D: Spelling variant cleanup

for (const [deleteKey, canonicalKey] of Object.entries(SPELLING_DELETE)) {
  if (!dict[deleteKey]) continue

  const resolvedCanonical = remap[canonicalKey] || canonicalKey

  if (!dict[resolvedCanonical]) {
    // Canonical doesn't exist — promote the entry being deleted as canonical
    const e = dict[deleteKey]
    dict[resolvedCanonical] = { lemma: resolvedCanonical, root: e.root, bs: e.bs, en: e.en }
  } else {
    // Merge translations if the deleted entry has better data
    const e = dict[deleteKey]
    const c = dict[resolvedCanonical]
    if ((e.bs || '').length > (c.bs || '').length) dict[resolvedCanonical].bs = e.bs
    if ((e.en || '').length > (c.en || '').length) dict[resolvedCanonical].en = e.en
  }

  remap[deleteKey] = resolvedCanonical
  delete dict[deleteKey]
  deletedCount++
}

// -- Write dictionary

fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n')
console.log(`Dictionary: ${mergedCount} merged, ${renamedCount} renamed, ${deletedCount} deleted`)
console.log(`Total entries: ${Object.keys(dict).length}`)

// -- Step E: Update content files

let filesUpdated   = 0
let replacementsTotal = 0

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) { walkDir(fp); continue }
    if (!entry.name.endsWith('.json') || entry.name === 'dictionary.json') continue

    let raw = fs.readFileSync(fp, 'utf8')
    let changed = false

    for (const [oldLemma, newLemma] of Object.entries(remap)) {
      const re = new RegExp('("lemma":\\s*")' + escape(oldLemma) + '(")', 'g')
      const updated = raw.replace(re, '$1' + newLemma + '$2')
      if (updated !== raw) { raw = updated; changed = true; replacementsTotal++ }
    }

    if (changed) { fs.writeFileSync(fp, raw); filesUpdated++ }
  }
}

walkDir(DATA_DIR)
console.log(`Content files: ${filesUpdated} files, ${replacementsTotal} lemma replacements`)
console.log('Done.')
