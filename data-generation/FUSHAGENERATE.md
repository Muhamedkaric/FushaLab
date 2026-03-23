# FushaGenerate — Claude Direct Generation Instructions

This file is the contract between the user and Claude for direct content generation.
When the user types a fushagenerate command, Claude reads this file and acts accordingly.

---

## Command syntax

```
fushagenerate <level> <category|all> <count>
```

Examples:
- `fushagenerate B1 all 10` → generate 10 items for every category at B1
- `fushagenerate B2 religion 5` → generate 5 religion items at B2
- `fushagenerate C1 travel 20` → generate 20 travel items at C1
- `fushagenerate B1 all 20` → generate 20 items for every category at B1

**"all" expands to**: travel, culture, news, literature, religion (in that order)

---

## Output format

Each item is written as a standalone file: `public/data/{category}/{level}/{id}.json`
The id follows: `{category}-{level.toLowerCase()}-{NNN}` (zero-padded to 3 digits).
File numbering continues from where existing items leave off.

After writing all files, update `public/data/{category}/{level}/index.json`.

### Item JSON structure
```json
{
  "id": "travel-b1-011",
  "category": "travel",
  "level": "B1",
  "arabic": "نَصٌّ عَرَبِيٌّ مَعَ الشَّكْلِ الْكَامِلِ.",
  "translation": "Bosanski prijevod.",
  "translationEn": "English translation.",
  "metadata": {
    "difficulty": 1,
    "tags": ["tag1", "tag2"]
  }
}
```

### Index JSON structure
```json
{
  "items": [
    {
      "id": "travel-b1-001",
      "arabic": "أَوَّلُ جُمْلَةٍ مِنَ النَّصِّ...",
      "metadata": { "difficulty": 1, "tags": ["tag1"] }
    }
  ]
}
```

---

## Difficulty mapping

| Level | difficulty |
|-------|-----------|
| B1    | 1         |
| B2    | 2         |
| C1    | 2         |
| C2    | 3         |

---

## Level text standards

### B1
- **Register**: Simple Modern Standard Arabic (فصحى), never colloquial
- **Grammar**: Present tense (مضارع) and past tense (ماضي), simple sentence structures
- **Vocabulary**: High-frequency, everyday words — no rare or literary vocabulary
- **Length**: One short paragraph, **4–6 sentences**, one clear idea per text
- **Sentence complexity**: Simple subject–verb–object, no heavy subordinate clauses

### B2
- **Register**: MSA, slightly more formal than B1
- **Grammar**: All basic tenses, compound sentences, relative clauses (الذي/التي), simple conditional
- **Vocabulary**: Broader everyday + topic-specific vocabulary, some idiomatic expressions
- **Length**: One solid paragraph, **6–9 sentences**, one topic developed with some nuance

### C1
- **Register**: Formal MSA, written prose style
- **Grammar**: Complex multi-clause sentences, passive (المبني للمجهول), conditional (لو/إذا), nominal sentences (الجملة الاسمية), all verb forms
- **Vocabulary**: Advanced, formal vocabulary; some technical terms appropriate to the topic
- **Length**: **Two paragraphs, 10–14 sentences total** — introduction, development, conclusion

### C2
- **Register**: Sophisticated literary, journalistic, or scholarly prose
- **Grammar**: All Arabic grammatical structures; complex embeddings, ellipsis, inversion for emphasis
- **Vocabulary**: Rare/elevated vocabulary, classical resonances, rhetorical devices (metaphor, parallel structure, saj')
- **Length**: **Two to three paragraphs, 14–20 sentences total**, on a substantive theme

---

## Harakat (diacritics) rules

**Every single Arabic word MUST carry full harakat**:
- Fatha (َ), kasra (ِ), damma (ُ) on every vowelled consonant
- Sukun (ْ) on every consonant with no vowel (word-internal and final)
- Shadda (ّ) on every doubled consonant
- Tanwin (ً ٍ ٌ) on indefinite nouns in the accusative / genitive / nominative
- No word may be left unvocalised — not even conjunctions (وَ، فَ، بِ، لِ)

---

## Category topics

| Category   | Topics |
|------------|--------|
| travel     | travel, tourism, transportation, accommodation, airports, cities, sightseeing, maps, booking |
| culture    | Arab culture, traditions, food, music, art, history, customs, festivals, family life, hospitality |
| news       | current events, politics, economy, technology, environment, international relations, society |
| literature | poetry, storytelling, classical Arabic literature, prose, metaphor, imagery |
| religion   | see Religion section below |

---

## Religion — strict rules

- **NO Quranic ayat** — zero tolerance for mistakes in Quranic text
- Source only from:
  - Authentic hadiths: Sahih Bukhari or Sahih Muslim (cite: collection + book + hadith number)
  - Stories of the Companions (seerah of Sahabah)
  - Scholarly commentary by: Ibn Uthaymeen, Ibn Baz, al-Albani, Ibn Taymiyyah, Ibn al-Qayyim
- Sunni mainstream only — no Sufi tariqa, no Shia content, no fabricated or weak hadiths
- When quoting/paraphrasing a hadith, include Arabic with full harakat + source in brackets:
  `[رَوَاهُ الْبُخَارِيُّ فِي كِتَابِ الْإِيمَانِ]`
- Structure per text: introduce → explain meaning → practical moral lesson
- Rotate topics: aqeedah, salah, zakah, sawm, hajj, seerah, Companion stories, adab, dhikr, fiqh, tawbah, ikhlas, tawakkul, birr al-walidayn, halal/haram

---

## Translation quality

- **Bosnian**: fluent, natural Bosnian — not word-for-word. Use correct Bosnian grammar (ijekavica).
- **English**: clear, natural English — not word-for-word.
- Both translations should read as if originally written in that language.

---

## Tags

- 2–4 short English lowercase tags per item
- Describe the specific content of the text (not just the category name)
- Examples: `["airport", "directions"]`, `["family", "hospitality", "traditions"]`

---

## Uniqueness

- No two texts in the same category+level should share the same topic
- Read the existing index.json before generating to avoid repeating topics already covered
