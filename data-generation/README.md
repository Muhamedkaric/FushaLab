# FushaLab — Data Generation Scripts

Scripts for generating Arabic learning content using AI models.
You don't need to understand how they work internally — just follow the steps.

---

## What these scripts do

You run a command like:
```
pnpm generate --category travel --level C1 --count 10
```

The script calls an AI model, asks it to write 10 Arabic texts with full diacritics,
Bosnian + English translations, and automatically saves them as JSON files into
`public/data/travel/C1/` — ready to appear in the app immediately.

---

## Prerequisites

You need **Node.js** (v18+) and **pnpm** installed — you already have these since the
main project uses them.

---

## Step 1 — Install dependencies

Open a terminal, go into this folder, and install:

```bash
cd data-generation
pnpm install
```

This installs the Anthropic and OpenAI packages. Takes ~10 seconds.

---

## Step 2 — Get an API key

You need at least one API key. Pick the model you want to try:

### Option A — Claude (Anthropic) · **Recommended to start**

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **"API Keys"** in the left sidebar
4. Click **"Create Key"**, give it a name (e.g. "fushalab")
5. Copy the key — it starts with `sk-ant-...`
6. You'll need to add a payment method (pay-as-you-go, no subscription)

**Cost estimate:** ~$0.02–0.10 per 10 texts depending on model. Generating the entire
initial dataset (200 texts) cost well under $1 with Sonnet.

### Option B — OpenAI (GPT-4o)

1. Go to **https://platform.openai.com**
2. Sign up / log in
3. Click your profile → **"API keys"**
4. Click **"Create new secret key"**
5. Copy the key — it starts with `sk-...`
6. Add a payment method under **"Billing"**

**Cost estimate:** Similar to Claude — a few cents per batch.

---

## Step 3 — Create your .env file

In the `data-generation/` folder, copy the example file:

```bash
cp .env.example .env
```

Then open `.env` in any text editor and paste your key:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

> ⚠️ Never commit this file to git — it's already in `.gitignore`.

---

## Step 4 — Run the generator

Go back to the **project root** (one folder up from `data-generation/`) and run:

### Using Claude (Anthropic):

```bash
# From the project root:
cd data-generation && pnpm generate --category travel --level C1 --count 10
```

Or from inside the `data-generation/` folder:
```bash
pnpm generate --category travel --level C1 --count 10
```

### Using OpenAI (GPT-4o):

```bash
pnpm generate:openai --category culture --level B2 --count 10
```

---

## Available options

| Flag | Required | Values | Default |
|------|----------|--------|---------|
| `--category` | ✅ Yes | `travel` `culture` `news` `literature` `religion` | — |
| `--level` | ✅ Yes | `B1` `B2` `C1` `C2` | — |
| `--count` | No | 1–50 | `10` |
| `--model` | No | see below | see below |

### Claude models (`generate-claude.ts`):

| Model | Quality | Speed | Price |
|-------|---------|-------|-------|
| `claude-opus-4-6` | ⭐⭐⭐ Best Arabic | Slower | ~$0.08/10 texts |
| `claude-sonnet-4-6` | ⭐⭐ Good | Fast | ~$0.02/10 texts |
| `claude-haiku-4-5-20251001` | ⭐ Acceptable | Very fast | ~$0.003/10 texts |

**Recommendation:** Use `claude-opus-4-6` for C1/C2 (complex texts), `claude-sonnet-4-6`
for B1/B2 (simpler texts). The quality difference at higher levels is noticeable.

### OpenAI models (`generate-openai.ts`):

| Model | Quality | Speed | Price |
|-------|---------|-------|-------|
| `gpt-4o` | ⭐⭐⭐ Excellent | Fast | ~$0.05/10 texts |
| `gpt-4o-mini` | ⭐⭐ Good | Very fast | ~$0.003/10 texts |

---

## Examples

```bash
# Generate 10 C1-level travel texts with best model
pnpm generate --category travel --level C1 --count 10 --model claude-opus-4-6

# Generate 5 C2 literature texts (most complex)
pnpm generate --category literature --level C2 --count 5 --model claude-opus-4-6

# Quick batch of B1 texts (cheaper model is fine here)
pnpm generate --category culture --level B1 --count 20 --model claude-haiku-4-5-20251001

# Try OpenAI instead
pnpm generate:openai --category news --level B2 --count 10

# Use GPT-4o-mini for fast/cheap B1 batch
pnpm generate:openai --category travel --level B1 --count 20 --model gpt-4o-mini
```

---

## What happens when you run it

1. The script reads what's already in `public/data/{category}/{level}/`
2. It figures out the next available ID number (e.g. if you have 001–010, new ones start at 011)
3. It sends your request to the AI model in batches of 10
4. Each response is validated and parsed
5. Individual JSON files are written: `public/data/travel/C1/travel-c1-011.json` etc.
6. `index.json` for that level is updated automatically
7. Reload the app — new texts appear immediately

---

## Validating existing content

To check all existing content files for issues (missing fields, low harakat coverage, index out of sync):

```bash
pnpm validate

# Check only one category
pnpm validate --category travel

# Check one specific level
pnpm validate --category travel --level B1
```

Output example:
```
📁 travel/B1 (10 items)
  ✅ travel-b1-001.json
  ✅ travel-b1-002.json
  ⚠️  travel-b1-003.json: Low harakat coverage: ~35% (aim for >70%)
  ✅ index.json: in sync (10 items)
```

---

## Comparing model quality

The best way to evaluate is to generate 5 texts with each model for the same
category+level and compare:

```bash
# Generate 5 C2 texts with Opus
pnpm generate --category literature --level C2 --count 5 --model claude-opus-4-6

# Generate 5 more with GPT-4o and compare
pnpm generate:openai --category literature --level C2 --count 5 --model gpt-4o
```

Then open the app (`pnpm dev` in the project root) and read through them.
Things to check:
- Is the Arabic natural and formal (فصحى), not sounding like Egyptian/Gulf dialect?
- Are harakat placed on every word correctly?
- Does the difficulty feel right for C2?
- Is the Bosnian translation fluent?

---

## Tips for better results

- **Opus > Sonnet for C1/C2** — the quality gap at complex levels is real
- **Run validation after generating** — catch any items with low harakat coverage
- **Generate in smaller batches** (10 at a time) rather than 50 at once — quality stays higher
- **Review the texts in the app** before committing — reload the dev server and read a few
- **Commit after reviewing** — `git add public/data && git commit -m "content: add 10 travel C1 texts"`

---

## Troubleshooting

**`ANTHROPIC_API_KEY is not set`**
→ Make sure you created `.env` in this folder (not the project root) and it has the key.

**`Cannot find module '@anthropic-ai/sdk'`**
→ Run `pnpm install` inside the `data-generation/` folder.

**`Failed to parse response`**
→ The model returned something unexpected. Try running again — it's rare but can happen.
→ If it keeps failing, try a different model.

**Texts look colloquial / wrong dialect**
→ The prompt specifically asks for فصحى but some models slip. Use `claude-opus-4-6`
   or `gpt-4o` instead of the mini/haiku versions for better results.

**Low harakat coverage warning from validate**
→ The model missed some diacritics. You can either delete the file and regenerate,
   or manually edit the Arabic text in the JSON file.
