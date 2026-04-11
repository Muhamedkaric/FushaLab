#!/bin/bash
# Daily B2 word annotation pipeline
# Runs: Gemini backfill → fix token prefixes → fix systematic words → rebuild dictionary → commit
# Does NOT push — manual push only.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN_DIR="$REPO_DIR/data-generation"
LOG_DIR="$GEN_DIR/logs"
LOG_FILE="$LOG_DIR/b2-backfill-$(date +%Y-%m-%d).log"

mkdir -p "$LOG_DIR"

# Keep only last 7 days of logs
find "$LOG_DIR" -name "b2-backfill-*.log" -mtime +7 -delete

exec >> "$LOG_FILE" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log ""
log "══════════════════════════════════════════"
log "  B2 backfill pipeline start"
log "══════════════════════════════════════════"

cd "$GEN_DIR"

# Use absolute paths since launchd doesn't load shell profile / nvm
export PATH="/Users/mkaric/.nvm/versions/node/v24.5.0/bin:$PATH"

# ── Step 1: Gemini annotation (B2 only) ───────────────────────────────────
log ""
log "▶ Step 1: Gemini annotation"
BACKFILL_LEVELS=B2 npx tsx backfill-word-annotations.ts
log "✓ Step 1 done"

# ── Step 2: Fix prefix-stripped w fields ──────────────────────────────────
log ""
log "▶ Step 2: Fix token prefix mismatches"
npx tsx fix-word-tokens.ts --levels=B2
log "✓ Step 2 done"

# ── Step 3: Fix systematically skipped content words ─────────────────────
log ""
log "▶ Step 3: Fix systematic word gaps"
npx tsx fix-systematic-words.ts --levels=B2
log "✓ Step 3 done"

# ── Step 4: Rebuild dictionary ────────────────────────────────────────────
log ""
log "▶ Step 4: Rebuild dictionary"
npx tsx rebuild-dictionary.ts
log "✓ Step 4 done"

# ── Step 5: Commit (no push) ──────────────────────────────────────────────
log ""
log "▶ Step 5: Git commit"
cd "$REPO_DIR"

git add public/data/

if git diff --staged --quiet; then
  log "  Nothing new to commit."
else
  git commit -m "chore: B2 word annotation backfill run $(date +%Y-%m-%d)

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  log "✓ Committed"
fi

log ""
log "✅ Pipeline complete"
