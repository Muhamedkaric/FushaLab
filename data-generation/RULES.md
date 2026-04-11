# FushaLab Content Generation Rules

Reference file for Claude sessions generating or annotating content.
Tell Claude: "read data-generation/RULES.md before doing anything"

---

## Content file format

```json
{
  "id": "category-b2-001",
  "category": "finance",
  "level": "B2",
  "sentences": [
    {
      "arabic": "...",
      "translation": "... (Bosnian, ijekavica)",
      "translationEn": "... (English)",
      "words": [
        { "w": "...", "lemma": "..." }
      ]
    }
  ],
  "metadata": {
    "difficulty": 2,
    "tags": ["tag1", "tag2"]
  }
}
```

Files live in: `public/data/{category}/{level}/{id}.json`
Index file: `public/data/{category}/{level}/index.json`

difficulty mapping: B1=1, B2=2, C1=2, C2=3

---

## Level descriptions

| Level | Sentences | Style |
|-------|-----------|-------|
| B1 | 3–4 | Simple sentences, present/past tense, everyday vocabulary |
| B2 | 4–6 | Compound/complex sentences, richer vocabulary, idioms, subordinate clauses |
| C1 | 5–7 | Complex multi-clause, formal register, conditional/passive/nominal sentences |
| C2 | 6–8 | Literary/journalistic/scholarly prose, rare vocabulary, rhetorical devices |

---

## Arabic requirements

- MSA only (Modern Standard Arabic / الفصحى) — never colloquial or dialect
- Every word must have complete harakat: shadda (ّ), sukun (ْ), tanwin (ً ٍ ٌ), fatha (َ), kasra (ِ), damma (ُ)
- Grammatically perfect, natural-sounding
- Translations: fluent, not word-for-word; Bosnian uses ijekavica

---

## Halal content rules (all categories)

- No alcohol, wine, beer, or any intoxicant
- No pork or pork-derived ingredients
- No sexual content, romantic immodesty, or immoral relationships
- No gambling, lotteries, or riba (interest-based) financial schemes
- No non-Islamic religious celebrations (Christmas, Easter, Diwali, etc.)
- No idol worship, polytheism, superstition, fortune-telling, or occult themes
- Finance: no riba presented positively; Islamic finance terms (murabaha, sukuk, zakat) are welcome

---

## Word annotation rules

### What the words[] array is

Each sentence has a `words[]` array of content words. Purpose: users tap a word to see its lemma and dictionary translation. Only content words — not grammar glue.

### Validation rule (automated, strict)

```
bare(s) = s.replace(/[^\u0621-\u063A\u0641-\u064A]/g, '')
```

Strips everything except Arabic base letters (keeps: ء-غ U+0621–U+063A, ف-ي U+0641–U+064A).
Removes: diacritics, tatweel, punctuation, digits, spaces, Latin.

```
contentWordCount(arabic) =
  arabic.split(" ")
    .map(token => bare(token))
    .filter(b => b !== "" && b NOT IN FUNC_BARE)
    .length
```

`words[]` must have exactly `contentWordCount` entries (where `bare(w.w) !== ""`).
Any mismatch → file is rejected.

### FUNC_BARE — function words (skip these)

Their bare forms are excluded from content word count. Do NOT put these in words[].

```
Prepositions:   فِي عَلَى مِنْ مِنَ إِلَى عَنْ عَنِ مَعَ بَيْنَ بَعْدَ قَبْلَ
                خِلَالَ حَتَّى رَغْمَ عَبْرَ فَوْقَ دُونَ لَدَى
Single-letter:  وَ فَ بِ لِ كَ  (ONLY as standalone tokens)
Conjunctions:   ثُمَّ أَوْ لَكِنَّ لَكِنْ بَلْ أَمَّا كَمَا إِذَا لَوْ لَوْلَا
Subordinators:  أَنَّ إِنَّ أَنْ إِنْ إِذْ حَيْثُ إِلَّا
Pronouns:       هُوَ هِيَ هُمْ هُنَّ أَنَا نَحْنُ أَنْتَ أَنْتِ أَنْتُمْ (all forms)
Demonstratives: هَذَا هَذِهِ ذَلِكَ تِلْكَ
Relative:       الَّذِي الَّتِي الَّذِينَ
Particles:      لَا (negation) لَمْ لَنْ قَدْ سَوْفَ هَلْ مَا
Prep+pronoun:   فِيهِ فِيهَا فِيهِمْ عَلَيْهِ عَلَيْهَا عَلَيْهِمْ
                مِنْهُ مِنْهَا مِنْهُمْ إِلَيْهِ إِلَيْهَا إِلَيْهِمْ
                لَهُ لَهَا لَهُمْ بِهِ بِهَا بِهِمْ عَنْهُ عَنْهَا
                مَعَهُ مَعَهَا مَعَهُمْ (all prep+suffix combinations)
Fused w/f+func: وَهُوَ وَهِيَ وَهُمْ وَلَمْ وَلَا فَلَا فَلَمْ وَمَا فَمَا
                فَإِنَّ وَإِنَّ وَأَنَّ وَإِنْ لَكِنَّهُ لَكِنَّهَا
                وَمِنْهُ وَمِنْهَا وَبِهِ وَبِهَا وَفِيهِ وَفِيهَا
                وَعَلَيْهِ وَإِلَيْهِ وَبِهَذَا وَبِهَذِهِ
```

### Always include in words[]

- All nouns (all cases, definiteness, with pronoun suffixes if still a noun)
- All verbs (all forms, tenses, voices, persons)
- All adjectives and participles
- All adverbs (سَنَوِيًّا، تَدْرِيجِيًّا، مُنْتَظَمًا، جِدًّا، أَيْضًا، فَقَطْ)
- ALL proper nouns: countries, cities, months, festivals, cultural terms, personal names
  Examples: رَمَضَانُ، الأُرْدُنُّ، مَكَّةُ، أَفْرِيقِيَا، إِسْبَانِيَا، الشَّامُ، الْقَاهِرَةُ
- كَانَ / يَكُونُ and ALL inflected forms
- لَيْسَ / لَيْسَتْ and all forms
- كُلُّ / كُلَّ / كُلِّ and all inflected forms
- بَعْضُ / بَعْضَ / بَعْضِ and all forms
- Masdar / verbal nouns (تَخْطِيطٌ، ادِّخَارٌ، تَمْوِيلٌ، تَشْكِيلٌ)

### The w field — critical

Copy the word **exactly** as it appears in the sentence (space-separated token).
Include all fused prefixes (وَ / فَ / بِ / لِ / كَ) that are part of the token.

```
Sentence has "وَيَجْمَعُ"    → w="وَيَجْمَعُ"    NOT "يَجْمَعُ"
Sentence has "وَالتَّوَابِلِ" → w="وَالتَّوَابِلِ" NOT "التَّوَابِلِ"
Sentence has "بِامْتِيَازٍ"  → w="بِامْتِيَازٍ"  NOT "امْتِيَازٍ"
Sentence has "وَأَدَبَاءَ"   → w="وَأَدَبَاءَ"   NOT "أَدَبَاءَ"
Sentence has "لِتَنَاوُلِ"  → w="لِتَنَاوُلِ"  NOT "تَنَاوُلِ"
Sentence has "فَ" (alone)    → skip (function)
```

### Lemma formats

| Type | Format | Example |
|------|--------|---------|
| Verb | past + present | `ذَهَبَ يَذْهَبُ` |
| Noun | singular / plural | `مَدِينَةٌ / مُدُنٌ` |
| Noun (no plural) | singular / - | `ادِّخَارٌ / -` |
| Adjective | masc. sg. indef. | `كَبِيرٌ` |
| Proper noun | canonical form | `رَمَضَانُ` or `الأُرْدُنُّ` |
| Adverb | as-is | `سَنَوِيًّا` |
| Masdar | sg / - | `تَشْكِيلٌ / -` |

### Worked example

Sentence: `يَعْتَمِدُ التَّخْطِيطُ الْمَالِيُّ عَلَى تَقْسِيمِ الدَّخْلِ بَيْنَ النَّفَقَاتِ الضَّرُورِيَّةِ وَالِادِّخَارِ الْمُنْتَظَمِ.`

Token-by-token:
```
يَعْتَمِدُ       bare=يعتمد   → content ✓
التَّخْطِيطُ    bare=التخطيط  → content ✓
الْمَالِيُّ     bare=المالي   → content ✓
عَلَى           bare=على      → FUNC_BARE → SKIP
تَقْسِيمِ       bare=تقسيم   → content ✓
الدَّخْلِ       bare=الدخل   → content ✓
بَيْنَ          bare=بين      → FUNC_BARE → SKIP
النَّفَقَاتِ    bare=النفقات  → content ✓
الضَّرُورِيَّةِ bare=الضرورية → content ✓
وَالِادِّخَارِ  bare=والادخار → NOT in FUNC_BARE → content ✓
الْمُنْتَظَمِ   bare=المنتظم  → content ✓
```
Expected count = 9 → words[] must have 9 entries.

```json
"words": [
  { "w": "يَعْتَمِدُ",       "lemma": "اعْتَمَدَ يَعْتَمِدُ" },
  { "w": "التَّخْطِيطُ",    "lemma": "تَخْطِيطٌ / -" },
  { "w": "الْمَالِيُّ",      "lemma": "مَالِيٌّ" },
  { "w": "تَقْسِيمِ",        "lemma": "تَقْسِيمٌ / -" },
  { "w": "الدَّخْلِ",        "lemma": "دَخْلٌ / دُخُولٌ" },
  { "w": "النَّفَقَاتِ",     "lemma": "نَفَقَةٌ / نَفَقَاتٌ" },
  { "w": "الضَّرُورِيَّةِ",  "lemma": "ضَرُورِيٌّ" },
  { "w": "وَالِادِّخَارِ",   "lemma": "ادِّخَارٌ / -" },
  { "w": "الْمُنْتَظَمِ",    "lemma": "مُنْتَظَمٌ" }
]
```

---

## Generation targets

- **Target per level: 50 items**
- If a level already has ≥50 items → skip it, do not add more
- If a level has <50 items → generate up to 50
- Configured in `data-generation/.env.reading`: `READING_TARGET=50`
- Also hardcoded as default in `generate-reading.ts` and `generate-reading-validated.ts`

---

## Index file format

```json
{
  "items": [
    {
      "id": "finance-b2-001",
      "arabic": "first ~10 words of sentences[0].arabic",
      "metadata": { "difficulty": 2, "tags": ["tag1", "tag2"] }
    }
  ]
}
```

---

## Pipeline scripts (run from data-generation/)

| Script | Purpose |
|--------|---------|
| `pnpm backfill-annotations` | Annotate missing words[] in existing files, then rebuild dictionary |
| `pnpm fix-tokens` | Fix w fields where Gemini stripped fused prefix |
| `pnpm fix-systematic-words` | Add deterministically-known words (كَانَ, numbers, etc.) |
| `pnpm rebuild-dictionary` | Sync dictionary.json with all lemmas in content files |
| `pnpm validate-tokens` | Report w fields that don't match their sentence token |
| `pnpm backfill-b2` | Full daily orchestration: annotate → fix → rebuild → commit |
| `pnpm generate-reading-validated` | Generate new content with built-in word-count validation |

---

## Dictionary format

`public/data/dictionary.json` — flat array, one entry per lemma:

```json
{ "lemma": "تَخْطِيطٌ / -", "bs": "planiranje", "en": "planning" }
```

Lemma field matches exactly what's in words[].lemma across all content files.
