#!/usr/bin/env bash
# Snapshot every public CSS custom property declared in glacial.css to tokens.json.
#
# Usage:
#   ./scripts/snapshot-tokens.sh           # write tokens.json
#   ./scripts/snapshot-tokens.sh --check   # exit 1 if tokens.json is stale
#
# tokens.json is the public token contract. Run snapshot after intentionally
# adding/renaming a token, then commit the diff with the version bump.
# diff-tokens.sh consumes this file in CI to detect unintentional renames.
#
# POSIX-friendly: works on Mac BSD and Linux GNU.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CSS_FILE="$ROOT/glacial.css"
OUT_FILE="$ROOT/tokens.json"
CHECK_MODE=0

for arg in "$@"; do
  case "$arg" in
    --check) CHECK_MODE=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if [ ! -f "$CSS_FILE" ]; then
  echo "ERROR: glacial.css not found at $CSS_FILE" >&2
  exit 2
fi

# Extract every declared token name (--something:). Keep unique, sort alphabetically.
# We only care about NAMES, not values — values can change freely between releases.
TOKENS=$(grep -Eho -- '--[a-zA-Z0-9_-]+:' "$CSS_FILE" \
  | sed -E 's/:$//' \
  | sort -u)

VERSION_LINE=$(grep -E '@version' "$CSS_FILE" | head -1 | sed -E 's/.*@version[[:space:]]+([0-9.]+).*/\1/')
VERSION="${VERSION_LINE:-unknown}"

# Build minified-ish JSON manually to avoid jq dependency.
# Format:
#   {
#     "version": "2.2.0",
#     "generated": "2026-05-04T12:34:56Z",
#     "tokens": ["--accent", "--bg", ...]
#   }
{
  echo "{"
  echo "  \"version\": \"$VERSION\","
  echo "  \"generated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"tokens\": ["
  COUNT=0
  TOTAL=$(echo "$TOKENS" | wc -l | tr -d ' ')
  while IFS= read -r tok; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -lt "$TOTAL" ]; then
      echo "    \"$tok\","
    else
      echo "    \"$tok\""
    fi
  done <<< "$TOKENS"
  echo "  ]"
  echo "}"
} > "$OUT_FILE.tmp"

if [ "$CHECK_MODE" -eq 1 ]; then
  if [ ! -f "$OUT_FILE" ]; then
    echo "ERROR: tokens.json missing. Run scripts/snapshot-tokens.sh to create it." >&2
    rm -f "$OUT_FILE.tmp"
    exit 1
  fi
  # Compare token NAMES only (not version/generated stamp). Extract token arrays
  # and diff. If they match exactly, OK.
  CUR_TOKENS=$(grep -E '^\s+"--' "$OUT_FILE"     | sed -E 's/.*"(--[^"]+)".*/\1/' | sort)
  NEW_TOKENS=$(grep -E '^\s+"--' "$OUT_FILE.tmp" | sed -E 's/.*"(--[^"]+)".*/\1/' | sort)
  if [ "$CUR_TOKENS" = "$NEW_TOKENS" ]; then
    echo "tokens.json is up to date ($TOTAL tokens declared in glacial.css)"
    rm -f "$OUT_FILE.tmp"
    exit 0
  else
    echo "ERROR: tokens.json is stale." >&2
    echo "Tokens in glacial.css that aren't in tokens.json:" >&2
    comm -13 <(echo "$CUR_TOKENS") <(echo "$NEW_TOKENS") >&2 || true
    echo "Tokens in tokens.json that aren't in glacial.css:" >&2
    comm -23 <(echo "$CUR_TOKENS") <(echo "$NEW_TOKENS") >&2 || true
    echo "" >&2
    echo "Run: scripts/snapshot-tokens.sh" >&2
    rm -f "$OUT_FILE.tmp"
    exit 1
  fi
fi

mv "$OUT_FILE.tmp" "$OUT_FILE"
echo "Wrote $OUT_FILE — $TOTAL tokens declared in glacial.css v$VERSION"
