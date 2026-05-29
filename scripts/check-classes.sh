#!/usr/bin/env bash
# Assert every class name in glacial.js's CLASSES[] debug array has a matching
# `.<name>` selector in glacial.css. Catches typos in the hand-maintained list
# before they ship and make window.glacial.help() lie about what exists.
#
# Usage: ./scripts/check-classes.sh
#
# Seeds the broader v2.4.0 check-contract.mjs. POSIX-friendly (Mac BSD / Linux GNU).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JS_FILE="$ROOT/glacial.js"
CSS_FILE="$ROOT/glacial.css"

for f in "$JS_FILE" "$CSS_FILE"; do
  [ -f "$f" ] || { echo "ERROR: $f not found" >&2; exit 2; }
done

# Extract the CLASSES = [ ... ]; block, then pull every 'glacial-...' literal.
NAMES=$(awk '/var CLASSES = \[/{f=1} f{print} /\];/{if(f)exit}' "$JS_FILE" \
  | grep -Eo "'glacial-[a-z0-9-]+'" \
  | tr -d "'" \
  | sort -u)

if [ -z "$NAMES" ]; then
  echo "ERROR: no class names parsed from CLASSES[] in glacial.js" >&2
  exit 2
fi

MISSING=0
COUNT=0
while IFS= read -r name; do
  COUNT=$((COUNT + 1))
  # Match `.<name>` not followed by another class-name char (so `.glacial-rail`
  # alone is required, not satisfied only by `.glacial-rail-secondary`).
  if ! grep -Eq "\.${name}([^a-zA-Z0-9_-]|$)" "$CSS_FILE"; then
    echo "  ✗ $name — in CLASSES[] but no .$name selector in glacial.css" >&2
    MISSING=$((MISSING + 1))
  fi
done <<EOF
$NAMES
EOF

if [ "$MISSING" -gt 0 ]; then
  echo "" >&2
  echo "ERROR: $MISSING/$COUNT CLASSES[] names have no matching CSS selector." >&2
  echo "Fix the typo in glacial.js CLASSES[] or add the missing rule to glacial.css." >&2
  exit 1
fi

echo "✓ check-classes: all $COUNT CLASSES[] names have a matching selector in glacial.css"
