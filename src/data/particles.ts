/**
 * Static lookup for Arabic function words (particles, prepositions, conjunctions, pronouns).
 * These words are invariable — they never inflect — so a fixed table covers all occurrences.
 * Used as a fallback in WordTapText when a word has no annotation in the content file.
 */

export interface ParticleEntry {
  bs: string
  en: string
  type: 'prep' | 'conj' | 'particle' | 'pronoun' | 'rel' | 'dem'
}

// Keys include common vocalized forms. Lookup strips diacritics for matching.
const PARTICLES_RAW: Record<string, ParticleEntry> = {
  // ── Prepositions ──────────────────────────────────────────────────────────
  فِي: { bs: 'u, na, pri', en: 'in, at', type: 'prep' },
  عَلَى: { bs: 'na, o', en: 'on, upon, about', type: 'prep' },
  مِنْ: { bs: 'od, iz', en: 'from, of', type: 'prep' },
  إِلَى: { bs: 'do, ka, u', en: 'to, towards', type: 'prep' },
  عَنْ: { bs: 'o, od, s', en: 'about, from, away from', type: 'prep' },
  بِ: { bs: 'sa, bi, u', en: 'with, by, in', type: 'prep' },
  لِ: { bs: 'za, da', en: 'for, to', type: 'prep' },
  كَ: { bs: 'kao, poput', en: 'like, as', type: 'prep' },
  مَعَ: { bs: 'sa', en: 'with, together with', type: 'prep' },
  حَتَّى: { bs: 'sve do, čak', en: 'until, even', type: 'prep' },
  بَيْنَ: { bs: 'između', en: 'between, among', type: 'prep' },
  فَوْقَ: { bs: 'iznad', en: 'above, over', type: 'prep' },
  تَحْتَ: { bs: 'ispod', en: 'under, below', type: 'prep' },
  أَمَامَ: { bs: 'ispred', en: 'in front of', type: 'prep' },
  خَلْفَ: { bs: 'iza', en: 'behind', type: 'prep' },
  قَبْلَ: { bs: 'prije', en: 'before', type: 'prep' },
  بَعْدَ: { bs: 'poslije, nakon', en: 'after', type: 'prep' },
  مُنْذُ: { bs: 'od, otkad', en: 'since, for (time)', type: 'prep' },
  خِلَالَ: { bs: 'tokom, kroz', en: 'during, through', type: 'prep' },
  حَوْلَ: { bs: 'oko, o', en: 'around, about', type: 'prep' },
  رَغْمَ: { bs: 'unatoč, uprkos', en: 'despite, in spite of', type: 'prep' },
  بِدُونَ: { bs: 'bez', en: 'without', type: 'prep' },
  دُونَ: { bs: 'bez, ispod', en: 'without, below', type: 'prep' },
  ضِدَّ: { bs: 'protiv', en: 'against', type: 'prep' },
  نَحْوَ: { bs: 'prema, ka', en: 'towards, about', type: 'prep' },
  عِنْدَ: { bs: 'kod, pri', en: 'at, with, when', type: 'prep' },
  لَدَى: { bs: 'kod, pri', en: 'at, with', type: 'prep' },
  عَبْرَ: { bs: 'kroz, putem', en: 'through, via', type: 'prep' },
  وَسْطَ: { bs: 'usred, u sredini', en: 'in the middle of, amid', type: 'prep' },

  // ── Conjunctions ──────────────────────────────────────────────────────────
  وَ: { bs: 'i', en: 'and', type: 'conj' },
  فَ: { bs: 'pa, zatim, dakle', en: 'so, then, and so', type: 'conj' },
  ثُمَّ: { bs: 'zatim, potom', en: 'then, afterwards', type: 'conj' },
  أَوْ: { bs: 'ili', en: 'or', type: 'conj' },
  أَمْ: { bs: 'ili (pitanje)', en: 'or (in questions)', type: 'conj' },
  لَكِنْ: { bs: 'ali, međutim', en: 'but, however', type: 'conj' },
  لَكِنَّ: { bs: 'ali, međutim', en: 'but, however', type: 'conj' },
  بَلْ: { bs: 'nego, već', en: 'rather, but rather', type: 'conj' },
  حَيْثُ: { bs: 'gdje, budući', en: 'where, since, whereas', type: 'conj' },
  إِذْ: { bs: 'budući, kad', en: 'since, as, when', type: 'conj' },
  لِأَنَّ: { bs: 'jer', en: 'because', type: 'conj' },
  لِأَنْ: { bs: 'jer', en: 'because', type: 'conj' },
  كَيْ: { bs: 'da, kako bi', en: 'so that, in order to', type: 'conj' },
  كَيْلَا: { bs: 'da ne', en: 'so that ... not', type: 'conj' },
  إِذَا: { bs: 'ako, kad', en: 'if, when', type: 'conj' },
  لَمَّا: { bs: 'kad, kada', en: 'when, as soon as', type: 'conj' },
  بَيْنَمَا: { bs: 'dok, za to vrijeme', en: 'while, whereas', type: 'conj' },
  كُلَّمَا: { bs: 'svaki put kad', en: 'whenever, every time', type: 'conj' },

  // ── Particles & auxiliaries ───────────────────────────────────────────────
  قَدْ: { bs: 'već, zaista', en: 'already, indeed (perfective emphasis)', type: 'particle' },
  لَا: { bs: 'ne, nema', en: 'no, not', type: 'particle' },
  لَمْ: { bs: 'nije (prošlo)', en: 'did not (past negation)', type: 'particle' },
  لَنْ: { bs: 'neće (budućnost)', en: 'will not (future negation)', type: 'particle' },
  لَيْسَ: { bs: 'nije', en: 'is not, are not', type: 'particle' },
  إِنَّ: { bs: 'zaista, doista', en: 'indeed, verily', type: 'particle' },
  أَنَّ: { bs: 'da (veznik)', en: 'that (complementizer)', type: 'particle' },
  أَنْ: { bs: 'da (infinitiv)', en: 'to, that (infinitive marker)', type: 'particle' },
  إِنْ: { bs: 'ako', en: 'if', type: 'particle' },
  هَلْ: { bs: '(upitna čestica)', en: '(yes/no question particle)', type: 'particle' },
  أَ: { bs: '(upitna čestica)', en: '(yes/no question particle)', type: 'particle' },
  مَا: { bs: 'što, šta, ne', en: 'what, that, not', type: 'particle' },
  لَوْ: { bs: 'kada bi, da', en: 'if (counterfactual)', type: 'particle' },
  كَأَنَّ: { bs: 'kao da', en: 'as if, as though', type: 'particle' },
  سَ: { bs: '(futurska čestica)', en: '(near future marker)', type: 'particle' },
  سَوْفَ: { bs: 'hoće, uskoro', en: '(future marker)', type: 'particle' },
  لِلَّهِ: { bs: 'Allahu (pripada)', en: 'to/for Allah', type: 'particle' },

  // ── Personal pronouns ─────────────────────────────────────────────────────
  أَنَا: { bs: 'ja', en: 'I', type: 'pronoun' },
  أَنْتَ: { bs: 'ti (m)', en: 'you (masc.)', type: 'pronoun' },
  أَنْتِ: { bs: 'ti (ž)', en: 'you (fem.)', type: 'pronoun' },
  أَنْتُمْ: { bs: 'vi (m)', en: 'you (masc. pl.)', type: 'pronoun' },
  أَنْتُنَّ: { bs: 'vi (ž)', en: 'you (fem. pl.)', type: 'pronoun' },
  هُوَ: { bs: 'on', en: 'he, it', type: 'pronoun' },
  هِيَ: { bs: 'ona', en: 'she, it', type: 'pronoun' },
  هُمْ: { bs: 'oni', en: 'they (masc.)', type: 'pronoun' },
  هُنَّ: { bs: 'one', en: 'they (fem.)', type: 'pronoun' },
  هُمَا: { bs: 'njih dvoje', en: 'they two (dual)', type: 'pronoun' },
  نَحْنُ: { bs: 'mi', en: 'we', type: 'pronoun' },

  // ── Demonstratives ────────────────────────────────────────────────────────
  هَذَا: { bs: 'ovaj, ovo', en: 'this (masc.)', type: 'dem' },
  هَذِهِ: { bs: 'ova, ovo', en: 'this (fem.)', type: 'dem' },
  هَذَانِ: { bs: 'ova dva', en: 'these two (masc. dual)', type: 'dem' },
  هَاتَانِ: { bs: 'ove dvije', en: 'these two (fem. dual)', type: 'dem' },
  هَؤُلَاءِ: { bs: 'ovi, ove', en: 'these (pl.)', type: 'dem' },
  ذَلِكَ: { bs: 'onaj, ono', en: 'that (masc.)', type: 'dem' },
  تِلْكَ: { bs: 'ona, ono', en: 'that (fem.)', type: 'dem' },
  أُولَئِكَ: { bs: 'oni, one', en: 'those (pl.)', type: 'dem' },

  // ── Relative pronouns ─────────────────────────────────────────────────────
  الَّذِي: { bs: 'koji, što (m)', en: 'who, which, that (masc.)', type: 'rel' },
  الَّتِي: { bs: 'koja, što (ž)', en: 'who, which, that (fem.)', type: 'rel' },
  الَّذِينَ: { bs: 'koji (mn.)', en: 'who, which (masc. pl.)', type: 'rel' },
  اللَّوَاتِي: { bs: 'koje (mn.ž)', en: 'who, which (fem. pl.)', type: 'rel' },
}

// Strip diacritics for lookup
function stripDiacritics(s: string): string {
  // Remove harakat: fatha, damma, kasra, sukun, shadda, tanwin, tatweel
  return s.replace(/[\u064B-\u065F\u0670\u0640]/g, '')
}

// Build a stripped→entry map for fast lookup
const STRIPPED_MAP = new Map<string, ParticleEntry>()
for (const [key, val] of Object.entries(PARTICLES_RAW)) {
  STRIPPED_MAP.set(stripDiacritics(key), val)
  // Also map the fully-vocalized form directly
  STRIPPED_MAP.set(key, val)
}

export function lookupParticle(word: string): ParticleEntry | null {
  // Try exact match first, then stripped
  return STRIPPED_MAP.get(word) ?? STRIPPED_MAP.get(stripDiacritics(word)) ?? null
}
