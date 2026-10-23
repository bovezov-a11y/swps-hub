#!/usr/bin/env bash
# Saves an Anthropic API key to .env (git-ignored, readable only by you) and restarts the backend so the
# AI study tools turn on. The key is typed hidden and never printed.
set -euo pipefail
cd "$(dirname "$0")/.."

printf 'Paste your Anthropic API key (it stays hidden) and press Enter: '
read -rs key
echo
case "$key" in
  sk-ant-*) ;;
  *) echo "That does not look like an Anthropic API key; it should start with sk-ant-." >&2; exit 1 ;;
esac

touch .env
chmod 600 .env
grep -v '^ANTHROPIC_API_KEY=' .env > .env.tmp || true
printf 'ANTHROPIC_API_KEY=%s\n' "$key" >> .env.tmp
mv .env.tmp .env
chmod 600 .env
unset key

echo "Saved to .env. Restarting the backend..."
docker compose --profile app up -d backend
echo 'Done. Open http://localhost:3000, open a course with a PDF and click "Summary & quiz".'
