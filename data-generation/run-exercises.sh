#!/bin/zsh
# FushaLab daily exercise pack generator
# Called by com.fushalab.exercises LaunchAgent at 11:30.

REPO_DIR="$HOME/private/FushaLab"
LOG_FILE="$REPO_DIR/data-generation/exercises.log"
MAX_LOG_LINES=300

export PATH="/Users/mkaric/.nvm/versions/node/v24.5.0/bin:/Users/mkaric/Library/pnpm:$PATH"

cd "$REPO_DIR/data-generation" || exit 1

# Rotate log if too large
if [[ -f "$LOG_FILE" ]]; then
  lines=$(wc -l < "$LOG_FILE")
  if (( lines > MAX_LOG_LINES )); then
    tail -n 100 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

echo "\n========================================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') — exercises start" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

pnpm generate-exercises >> "$LOG_FILE" 2>&1

echo "--- done (exit $?) ---" >> "$LOG_FILE"
