# FushaLab Dictionary Standard

Reference for how dictionary entries and lemmas must be formatted — both when editing `dictionary.json` directly and when generating content via `fushagenerate`.

---

## Lemma format by word type

### Nouns (اسم)

Format: **singular / plural**

- Always show both forms, even when the plural is a regular sound plural
- Use the most common / most pedagogically useful plural when multiple exist
- Separator: ` / ` (space-slash-space)

```
كِتَابٌ / كُتُبٌ
مَدْرَسَةٌ / مَدَارِسُ
مُعَلِّمٌ / مُعَلِّمُونَ
بَيْتٌ / بُيُوتٌ
```

### Adjectives (صفة)

Two sub-cases:

**Regular adjectives** — feminine is formed by adding ة, show masculine only:

```
جَمِيلٌ
كَرِيمٌ
جَدِيدٌ
```

**Irregular adjectives** — feminine is non-trivially derived (colors, defective patterns), show both:

Format: **masculine / feminine**

```
أَبْيَضُ / بَيْضَاءُ
أَحْمَرُ / حَمْرَاءُ
أَخْضَرُ / خَضْرَاءُ
أَسْوَدُ / سَوْدَاءُ
أَزْرَقُ / زَرْقَاءُ
```

### Verbs (فعل)

Format: **ماضٍ مُضَارِعٌ** (past then present, space-separated — no slash)

```
كَتَبَ يَكْتُبُ
ذَهَبَ يَذْهَبُ
اِبْتَسَمَ يَبْتَسِمُ
تَعَلَّمَ يَتَعَلَّمُ
```

- Past tense always comes first
- Present tense (مضارع مرفوع) always second
- No slash — a space is the separator for verbs

### Uninflected words (particles, adverbs, prepositions, conjunctions)

Single form only — no slash, no second form:

```
فِي
مِنْ
ثُمَّ
لَكِنْ
هُنَا
```

---

## Separator rules

| Word type | Separator | Example |
|---|---|---|
| Noun (sg / pl) | ` / ` | `كِتَابٌ / كُتُبٌ` |
| Irregular adjective (m / f) | ` / ` | `أَبْيَضُ / بَيْضَاءُ` |
| Verb (past present) | ` ` (space only) | `كَتَبَ يَكْتُبُ` |
| Uninflected | — | `فِي` |

---

## Harakat (diacritics)

- **All Arabic text must have full tashkeel** — every letter must carry its vowel marking
- Nouns and adjectives in dictionary form use **tanwin damm** (ـٌ) for indefinite nominative: `كِتَابٌ`, `جَمِيلٌ`
- Definite articles or construct state forms are **never** used in the lemma
- Hamzat al-wasl at the start of words: always written with its kasra marking `اِ` (e.g., `اِبْتَسَمَ`, not `ابْتَسَمَ`)

---

## Root field

- Space-separated Arabic consonants only: `ك ت ب`, `ذ ه ب`
- No transliteration
- Three or four consonants (quadriliteral roots allowed)
- Weak roots use the actual letter: `ق و ل`, `و ص ل`, `ر أ ي`
- Required for all entries — if genuinely unknown, omit the field entirely (do not use `null` or empty string)

---

## Translation fields (bs / en)

- Comma-separated synonyms: `"bs": "pisati, napisati"`
- Semicolons for meaningfully distinct senses: `"bs": "knjiga; svezak"`
- No trailing punctuation
- Lowercase unless the word is a proper noun
- `bs` and `en` should cover the same set of senses — don't add senses to one that aren't in the other

---

## Full entry example

```json
"كِتَابٌ / كُتُبٌ": {
  "lemma": "كِتَابٌ / كُتُبٌ",
  "root": "ك ت ب",
  "bs": "knjiga",
  "en": "book"
},
"أَبْيَضُ / بَيْضَاءُ": {
  "lemma": "أَبْيَضُ / بَيْضَاءُ",
  "root": "ب ي ض",
  "bs": "bijel",
  "en": "white"
},
"كَتَبَ يَكْتُبُ": {
  "lemma": "كَتَبَ يَكْتُبُ",
  "root": "ك ت ب",
  "bs": "pisati",
  "en": "to write"
},
"فِي": {
  "lemma": "فِي",
  "root": "ف ي و",
  "bs": "u, na (prijedlog za lokativ)",
  "en": "in, at (preposition)"
}
```

---

## What NOT to include in a lemma

- Elative/comparative forms (`أَفْعَلُ`) — these are separate entries only if they have a distinct meaning not captured by the base adjective
- Multiple plurals — pick one, the most common/irregular one
- Construct state (إضافة) or definite forms (`الـ`)
- Transliteration
