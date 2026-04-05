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

**"all" expands to**: travel, culture, news, literature, religion, health, work, technology, social, food, education, finance, mysteries, history, psychology, conversations, idioms, stories, opinions (in that order)

---

## Output format

Each item is written as a standalone file: `public/data/{category}/{level}/{id}.json`
The id follows: `{category}-{level.toLowerCase()}-{NNN}` (zero-padded to 3 digits).
File numbering continues from where existing items leave off.

After writing all files, update `public/data/{category}/{level}/index.json`.

### Item JSON structure

**B2, C1, C2** — standard format:

```json
{
  "id": "travel-b2-011",
  "category": "travel",
  "level": "B2",
  "sentences": [
    {
      "arabic": "الْجُمْلَةُ الْأُولَى بِالشَّكْلِ الْكَامِلِ.",
      "translation": "Prva rečenica na bosanskom.",
      "translationEn": "First sentence in English."
    }
  ],
  "metadata": {
    "difficulty": 2,
    "tags": ["tag1", "tag2"]
  }
}
```

**B1 only** — include `words` array per sentence for word-tap feature:

```json
{
  "id": "travel-b1-011",
  "category": "travel",
  "level": "B1",
  "sentences": [
    {
      "arabic": "ذَهَبَتِ الْعَائِلَةُ إِلَى الْمَطَارِ فِي الصَّبَاحِ.",
      "translation": "Porodica je otišla na aerodrom ujutro.",
      "translationEn": "The family went to the airport in the morning.",
      "words": [
        { "w": "ذَهَبَتِ", "root": "ذ ه ب", "bs": "otišla je", "en": "went" },
        { "w": "الْعَائِلَةُ", "root": "ع و ل", "bs": "porodica", "en": "family" },
        { "w": "الْمَطَارِ", "root": "ط ي ر", "bs": "aerodrom", "en": "airport" },
        { "w": "الصَّبَاحِ", "root": "ص ب ح", "bs": "jutro", "en": "morning" }
      ]
    }
  ],
  "metadata": {
    "difficulty": 1,
    "tags": ["tag1", "tag2"]
  }
}
```

**`words` array rules for B1:**
- Include only **content words**: nouns, verbs, adjectives, adverbs
- **Skip** function words: فِي، عَلَى، مِنْ، إِلَى، وَ، فَ، بِ، لِ، أَنْ، إِنَّ، هُوَ، هِيَ، هَذَا، هَذِهِ، ذَلِكَ، كَانَ (as copula), لَا، لَمْ، قَدْ، etc.
- **Skip** proper nouns (names: أَحْمَدُ، مَرْيَمُ، الْقَاهِرَةُ, etc.)
- `w` = the **exact vocalized form** as it appears in the sentence (including case ending)
- `root` = three-letter Arabic root with spaces between letters, e.g. `"ك ت ب"` — omit if the word has no clear trilateral root (e.g. borrowed words)
- `bs` = natural Bosnian meaning in context (not dictionary form — match the sentence meaning)
- `en` = natural English meaning in context
- Aim for 3–6 annotated words per sentence (skip very obvious words if sentence has many)

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

Note: `arabic` in the index entry is `sentences[0].arabic` — the first sentence used as a preview in the UI.

---

## Difficulty mapping

| Level | difficulty |
| ----- | ---------- |
| B1    | 1          |
| B2    | 2          |
| C1    | 2          |
| C2    | 3          |

---

## Level text standards

### B1

- **Register**: Simple Modern Standard Arabic (فصحى), never colloquial
- **Grammar**: Present tense (مضارع) and past tense (ماضي), simple sentence structures
- **Vocabulary**: High-frequency, everyday words — no rare or literary vocabulary
- **Length**: **3–4 sentences**, one clear idea per text
- **Sentence complexity**: Simple subject–verb–object, no heavy subordinate clauses

### B2

- **Register**: MSA, slightly more formal than B1
- **Grammar**: All basic tenses, compound sentences, relative clauses (الذي/التي), simple conditional
- **Vocabulary**: Broader everyday + topic-specific vocabulary, some idiomatic expressions
- **Length**: **4–6 sentences**, one topic developed with some nuance

### C1

- **Register**: Formal MSA, written prose style
- **Grammar**: Complex multi-clause sentences, passive (المبني للمجهول), conditional (لو/إذا), nominal sentences (الجملة الاسمية), all verb forms
- **Vocabulary**: Advanced, formal vocabulary; some technical terms appropriate to the topic
- **Length**: **5–7 sentences** — introduction, development, conclusion

### C2

- **Register**: Sophisticated literary, journalistic, or scholarly prose
- **Grammar**: All Arabic grammatical structures; complex embeddings, ellipsis, inversion for emphasis
- **Vocabulary**: Rare/elevated vocabulary, classical resonances, rhetorical devices (metaphor, parallel structure, saj')
- **Length**: **6–8 sentences** on a substantive theme

---

## Harakat (diacritics) rules

**Every single Arabic word MUST carry full harakat**:

- Fatha (َ), kasra (ِ), damma (ُ) on every vowelled consonant
- Sukun (ْ) on every consonant with no vowel (word-internal and final)
- Shadda (ّ) on every doubled consonant
- Tanwin (ً ٍ ٌ) on indefinite nouns in the accusative / genitive / nominative
- No word may be left unvocalised — not even conjunctions (وَ، فَ، بِ، لِ)

---

## Halal content filter (all categories)

Every generated text must be halal-compliant regardless of category. The content does not need to be Islamic — it just must not contain haram elements:

- No alcohol, wine, beer, or intoxicants
- No pork or pork-derived ingredients
- No sexual content or immodest themes
- No gambling or riba (interest-based finance)
- No non-Islamic religious celebrations (Christmas, Easter, Diwali, etc.)
- No idol worship, polytheism, superstition, fortune-telling, or occult themes

**Rule of thumb**: "She enjoys cooking lentil soup" ✓ — "He poured himself a glass of wine" ✗

---

## Category topics

| Category      | Topics                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| travel        | travel, tourism, transportation, accommodation, airports, cities, sightseeing, maps, booking                                     |
| culture       | Arab culture, traditions, food, music, art, history, customs, festivals, family life, hospitality                                |
| news          | current events, politics, economy, technology, environment, international relations, society                                     |
| literature    | poetry, storytelling, classical Arabic literature, prose, metaphor, imagery                                                      |
| religion      | see Religion section below                                                                                                       |
| health        | physical health, nutrition, exercise, medicine, hospitals, pharmacies, mental wellness, healthy habits, preventive care          |
| work          | careers, workplace, professions, job interviews, productivity, entrepreneurship, office life, teamwork                           |
| technology    | computers, internet, AI, smartphones, software, innovation, cybersecurity, digital tools, programming                            |
| social        | social media platforms, online communication, digital communities, content creation, internet culture, privacy, screen time      |
| food          | halal cuisine, cooking, recipes, Arab traditional food, markets, restaurants, nutrition (halal only)                             |
| education     | schools, universities, learning, study habits, academic life, scholarships, teachers, libraries                                  |
| finance       | budgeting, business, trade, markets, economics, Islamic finance, saving, investment, financial literacy                          |
| mysteries     | detective stories, historical mysteries, unsolved cases, investigative journalism, scientific puzzles (rational only, no occult) |
| history       | world history, Arab and Islamic civilisation, ancient civilisations, historical events, archaeology                              |
| psychology    | human behaviour, mental health, cognitive science, emotions, motivation, decision-making, self-improvement                       |
| conversations | everyday dialogues, greetings, social interactions, formal discussions, debates, phone calls, interviews                         |
| idioms        | Arabic proverbs (أمثال), idiomatic expressions, figurative language, cultural sayings — explain meaning and origin               |
| stories       | short narratives, folk tales, moral fables, anecdotes, parables — self-contained with clear beginning, middle, end               |
| opinions      | editorials, viewpoints, argumentative essays, commentary on society, science, education, environment                             |

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
