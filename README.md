# FushaLab — تعلّم العربية الفصحى

**FushaLab** is an open Arabic (Modern Standard Arabic / Fusha) learning web app for intermediate and advanced learners. Built for Bosnian and English speakers — available free at [fusha-lab.vercel.app](https://fusha-lab.vercel.app).

---

## What it is

- Reading practice across 15+ topic categories (travel, culture, news, literature, religion, technology, social...)
- Levels B1 through C2, up to 100 texts per level per category
- Full harakat (diacritics) with toggle, word tap for inline translations
- Listening section with curated MSA YouTube channels
- Vocabulary, exercises, grammar, and progress tracking
- Works offline — no account required (optional sign-in for cross-device sync)
- Dark / light theme, Arabic / Bosnian / English UI

## Stack

| Layer       | Choice                        |
|-------------|-------------------------------|
| Framework   | React 19 + Vite + TypeScript  |
| Routing     | TanStack Router (code-based)  |
| UI          | MUI v7 + Emotion              |
| Animation   | Framer Motion                 |
| Sync        | Supabase (optional)           |
| Deployment  | Vercel — static SPA           |

---

## Running locally

```bash
pnpm install
pnpm dev
```

Requires Node 20+, pnpm 9+.

For cloud sync (optional), add to `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app runs fully without these — sync is silently disabled.

---

## Content structure

All content lives in `public/data/{category}/{level}/` as plain JSON. No backend — the browser fetches them directly.

```
public/data/
└── {category}/
    └── {level}/
        ├── index.json       ← list manifest
        └── {id}.json        ← full item
```

Item format:
```json
{
  "id": "travel-b1-001",
  "category": "travel",
  "level": "B1",
  "arabic": "سَافَرْتُ إِلَى مِصْرَ فِي الصَّيْفِ الْمَاضِي.",
  "translation": "Putovao sam u Egipat prošlog ljeta.",
  "translationEn": "I travelled to Egypt last summer.",
  "metadata": { "difficulty": 1, "tags": ["travel"] }
}
```

---

## Adding a UI language

1. Create `src/i18n/{code}.ts` implementing the `Translations` interface
2. Add to `TRANSLATIONS` map in `src/i18n/index.tsx`
3. Add to `LANGUAGES` in `src/components/LanguageSwitcher.tsx`

---

## License

**Business Source License 1.1** — see [LICENSE](./LICENSE)

- Free for personal and non-commercial use
- Source is publicly readable — study it, fork it, contribute to it
- Commercial use, institutional deployment, or white-labeling requires a separate agreement

For licensing or partnership inquiries, open an issue or contact via GitHub.

---

## Author

Built by [@Muhamedkaric](https://github.com/Muhamedkaric).
