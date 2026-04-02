#!/bin/zsh
# FushaLab daily reading content generator
# Called by com.fushalab.reading LaunchAgent at 10:00.

REPO_DIR="$HOME/private/FushaLab"
LOG_FILE="$REPO_DIR/data-generation/reading.log"
MAX_LOG_LINES=500

export PATH="/Users/mkaric/.nvm/versions/node/v24.5.0/bin:/Users/mkaric/Library/pnpm:$PATH"

cd "$REPO_DIR/data-generation" || exit 1

# Rotate log if too large
if [[ -f "$LOG_FILE" ]]; then
  lines=$(wc -l < "$LOG_FILE")
  if (( lines > MAX_LOG_LINES )); then
    tail -n 200 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

echo "\n========================================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') — reading start" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

pnpm generate-reading >> "$LOG_FILE" 2>&1

echo "--- done (exit $?) ---" >> "$LOG_FILE"
