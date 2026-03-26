#!/bin/zsh
# FushaLab daily auto-generator
# Called by the LaunchAgent at login. Runs auto-generate.ts and logs output.

REPO_DIR="$HOME/private/FushaLab"
LOG_FILE="$REPO_DIR/data-generation/auto-generate.log"
MAX_LOG_LINES=500

export PATH="/Users/mkaric/.nvm/versions/node/v24.5.0/bin:/Users/mkaric/Library/pnpm:$PATH"

cd "$REPO_DIR/data-generation" || exit 1

# Rotate log if it gets large
if [[ -f "$LOG_FILE" ]]; then
  lines=$(wc -l < "$LOG_FILE")
  if (( lines > MAX_LOG_LINES )); then
    tail -n 200 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

echo "\n========================================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') — starting" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

pnpm auto-generate >> "$LOG_FILE" 2>&1

echo "--- done (exit $?) ---" >> "$LOG_FILE"
