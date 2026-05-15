#!/bin/bash
# Idempotently installs gstack into ~/.claude/skills/gstack

GSTACK_DIR="$HOME/.claude/skills/gstack"

if [ -d "$GSTACK_DIR" ]; then
  exit 0
fi

git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git "$GSTACK_DIR" --quiet 2>&1
cd "$GSTACK_DIR" && ./setup >/dev/null 2>&1

cat <<'EOF'
{"priority": "INFO", "message": "gstack installed. Use /browse for all web browsing. Run /gstack-upgrade to update."}
EOF
