# FushaLab — Data Generation Scripts

Scripts for generating Arabic learning content using Google Gemini (free).

---

## What this does

You run a command like:

```bash
pnpm generate --category travel --level C1 --count 10
```

The script calls Gemini, asks it to write 10 Arabic texts with full diacritics,
Bosnian + English translations, and automatically saves them as JSON files into
`public/data/travel/C1/` — ready to appear in the app immediately.

---

## Step 1 — Get a free Gemini API key

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API key"** in the top left
4. Click **"Create API key"** → select any project (or create one)
5. Copy the key — it starts with `AIza...`

**No credit card needed. It's completely free.**
Free limits: 15 requests/minute, 1500 requests/day — more than enough.

---

## Step 2 — Install dependencies

Open a terminal, go into this folder:

```bash
cd data-generation
pnpm install
```

---

## Step 3 — Create your .env file

Create a file called `.env` inside the `data-generation/` folder:

```env
GEMINI_API_KEY=AIza-your-key-here
```

---

## Step 4 — Generate content

Run from inside the `data-generation/` folder:

```bash
pnpm generate --category travel --level C1 --count 10
```

That's it. Files appear in `public/data/travel/C1/` automatically.

---

## Options

| Flag         | Required | Values                                            | Default            |
| ------------ | -------- | ------------------------------------------------- | ------------------ |
| `--category` | ✅       | `travel` `culture` `news` `literature` `religion` | —                  |
| `--level`    | ✅       | `B1` `B2` `C1` `C2`                               | —                  |
| `--count`    | No       | 1–50                                              | `10`               |
| `--model`    | No       | see below                                         | `gemini-2.0-flash` |

### Models

| Model              | Quality     | Speed                   |
| ------------------ | ----------- | ----------------------- |
| `gemini-2.0-flash` | ⭐⭐ Good   | Very fast · **default** |
| `gemini-1.5-pro`   | ⭐⭐⭐ Best | Slower                  |
| `gemini-1.5-flash` | ⭐⭐ Good   | Fast                    |

Use `gemini-1.5-pro` for C1/C2 levels where text complexity matters most.

---

## Examples

```bash
# 10 B1 travel texts with default model
pnpm generate --category travel --level B1 --count 10

# 5 C2 literature texts, best quality model
pnpm generate --category literature --level C2 --count 5 --model gemini-1.5-pro

# 20 B1 culture texts quickly
pnpm generate --category culture --level B1 --count 20

# Fill up all levels for a category
pnpm generate --category religion --level B1 --count 10
pnpm generate --category religion --level B2 --count 10
pnpm generate --category religion --level C1 --count 10 --model gemini-1.5-pro
pnpm generate --category religion --level C2 --count 10 --model gemini-1.5-pro
```

---

## Validate existing content

Check all JSON files for issues (missing harakat, structure problems, index out of sync):

```bash
pnpm validate

# Check one category
pnpm validate --category travel

# Check one level
pnpm validate --category travel --level B1
```

---

## Workflow tip

After generating, always:

1. Run `pnpm validate` to check harakat coverage
2. Open the app (`pnpm dev` in project root) and read a few texts
3. If quality looks good: `git add public/data && git commit -m "content: add 10 travel C1 texts"`

---

## Troubleshooting

**`GEMINI_API_KEY is not set`**
→ Make sure `.env` exists in this folder (not the project root) with the key.

**`Cannot find module '@google/generative-ai'`**
→ Run `pnpm install` inside `data-generation/`.

**`Failed to parse response`**
→ Run the command again — occasionally the model returns slightly malformed JSON.

**Texts look colloquial / no harakat**
→ Switch to `--model gemini-1.5-pro` for better quality at C1/C2 levels.
