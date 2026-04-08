#!/bin/bash
# Daily B2 word annotation pipeline
# Runs: Gemini backfill → fix token prefixes → fix systematic words → rebuild dictionary → commit
# Does NOT push — manual push only.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN_DIR="$REPO_DIR/data-generation"
LOG_DIR="$HOME/Library/Logs/FushaLab"
LOG_FILE="$LOG_DIR/b2-backfill-$(date +%Y-%m-%d).log"

mkdir -p "$LOG_DIR"

exec >> "$LOG_FILE" 2>&1
echo ""
echo "══════════════════════════════════════════"
echo "  B2 backfill pipeline — $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"

cd "$GEN_DIR"

# ── Step 1: Gemini annotation (B2 only) ───────────────────────────────────
echo ""
echo "▶ Step 1: Gemini annotation"
BACKFILL_LEVELS=B2 npx tsx backfill-word-annotations.ts
echo "✓ Step 1 done"

# ── Step 2: Fix prefix-stripped w fields ──────────────────────────────────
echo ""
echo "▶ Step 2: Fix token prefix mismatches"
npx tsx fix-word-tokens.ts --levels=B2
echo "✓ Step 2 done"

# ── Step 3: Fix systematically skipped content words ─────────────────────
echo ""
echo "▶ Step 3: Fix systematic word gaps"
npx tsx fix-systematic-words.ts --levels=B2
echo "✓ Step 3 done"

# ── Step 4: Rebuild dictionary ────────────────────────────────────────────
echo ""
echo "▶ Step 4: Rebuild dictionary"
npx tsx rebuild-dictionary.ts
echo "✓ Step 4 done"

# ── Step 5: Commit (no push) ──────────────────────────────────────────────
echo ""
echo "▶ Step 5: Git commit"
cd "$REPO_DIR"

git add public/data/

if git diff --staged --quiet; then
  echo "  Nothing new to commit."
else
  git commit -m "chore: B2 word annotation backfill run $(date +%Y-%m-%d)

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  echo "✓ Committed"
fi

echo ""
echo "✅ Pipeline complete — $(date '+%H:%M:%S')"
