# FushaLab — تعلّم العربية الفصحى

An interactive web app for learning **Modern Standard Arabic (MSA)** at B1–C2 levels.
Focus: reading with diacritics (harakat), animated translation reveal, and browser TTS audio.

**Live:** [fusha-lab.vercel.app](https://fusha-lab.vercel.app)

---

## Features

- **Harakat toggle** — show or hide Arabic diacritics on the fly with a regex utility
- **Translation reveal** — hidden by default, animated with Framer Motion
- **Audio (TTS)** — browser-native Web Speech API with Arabic voice fallback
- **Difficulty rating** — mark texts as Easy / Medium / Hard, stored in `localStorage`
- **Progress tracking** — Easy-rated texts are marked completed in the level list
- **5 categories × 4 levels** — Travel, Culture, News, Literature, Religion at B1–C2
- **Bilingual UI** — Bosnian and English, language switcher built in
- **Dark / light mode** — gold-on-dark default theme, toggleable

---

## Tech Stack

| Layer       | Choice                       |
| ----------- | ---------------------------- |
| Framework   | React 19 + Vite 8            |
| Language    | TypeScript (strict)          |
| Routing     | TanStack Router (code-based) |
| UI          | MUI v7 + Emotion             |
| Animation   | Framer Motion                |
| Arabic font | Amiri (Google Fonts)         |
| Deployment  | Vercel (static, no backend)  |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Production build
pnpm build
```

> Requires [pnpm](https://pnpm.io) v9+.

---

## Content Structure

Content is served as static JSON from `public/data/`:

```
public/data/
└── {category}/
    └── {level}/
        ├── index.json          ← list manifest (id + arabic preview + metadata)
        └── {id}.json           ← full item (arabic, translation, translationEn, metadata)
```

**Item format:**

```json
{
  "id": "travel-b1-001",
  "category": "travel",
  "level": "B1",
  "arabic": "سَافَرْتُ إِلَى مِصْرَ فِي الصَّيْفِ الْمَاضِي.",
  "translation": "Putovao sam u Egipat prošlog ljeta.",
  "translationEn": "I travelled to Egypt last summer.",
  "metadata": { "difficulty": 1, "tags": ["travel", "past-tense"] }
}
```

Categories: `travel` · `culture` · `news` · `literature` · `religion`
Levels: `B1` · `B2` · `C1` · `C2`

---

## Adding a New UI Language

1. Create `src/i18n/{code}.ts` implementing the `Translations` interface
2. Add it to the `TRANSLATIONS` map in `src/i18n/index.tsx`
3. Add an entry to `LANGUAGES` in `src/components/LanguageSwitcher.tsx`

---

## Project Structure

```
src/
├── components/     TextCard, AudioPlayer, TranslationPanel, DifficultyRating, …
├── hooks/          useProgress, useArabicSpeech, useContentFetch
├── i18n/           Translations (EN / BS)
├── pages/          HomePage, LevelPage, ReaderPage
├── theme/          MUI dark + light themes, RTL cache
├── types/          ContentItem, Level, Category, UserProgress
├── utils/          diacritics (harakat toggle)
└── router.tsx      TanStack Router route tree
```

---

## License

MIT © 2026 FushaLab Contributors — see [LICENSE](./LICENSE)
