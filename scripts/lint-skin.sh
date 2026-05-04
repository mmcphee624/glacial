#!/usr/bin/env bash
# Enforce the glacial skin contract: skins MAY override token values, but
# MUST NOT target .glacial-* class internals.
#
# Allowed selectors in skins/*.css:
#   :root
#   [data-theme="dark"]
#   [data-skin="<name>"]
#   [data-skin="<name>"][data-theme="dark"]
#   @media (prefers-color-scheme: dark) { [data-skin="<name>"]:not([data-theme="light"]) { ... } }
#   /* comments */
#
# Documented exception: skins MAY include selectors targeting :is(), :where(),
# or component classes IF they include a header comment beginning with
# "// SKIN-EXCEPTION:" justifying the override. The lint warns but doesn't
# fail in that case.
#
# Usage:
#   ./scripts/lint-skin.sh skins/warm-serif.css
#   ./scripts/lint-skin.sh skins/*.css
#   ./scripts/lint-skin.sh                       # default: lint all skins/

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ $# -eq 0 ]; then
  set -- skins/*.css
fi

EXIT_CODE=0

# Whitelist regex: each selector LINE must match one of these or be a
# property/comment/whitespace.
ALLOWED_SELECTOR_RE='^([[:space:]]*$|[[:space:]]*/\*|[[:space:]]*\*|[[:space:]]*\}|@media|@supports|:root[[:space:]]*\{|\[data-(theme|skin)|@import|/\*|//|}[[:space:]]*$)'

# Property lines (look like `--something: value;` or `font-family: ...`).
# These are inside selector blocks and are fine.
PROPERTY_RE='^[[:space:]]*(-{2}|[a-z-]+):[[:space:]]'

# Selector lines we want to flag. A line that opens a selector block
# (ends with `{`) and doesn't match the allow-list is a violation.
# We also catch component-targeting selectors like `[data-skin="x"] .glacial-card`
# unless preceded by a SKIN-EXCEPTION comment.

for FILE in "$@"; do
  if [ ! -f "$FILE" ]; then
    echo "WARN: $FILE not found, skipping"
    continue
  fi

  # Skip the template — it's documentation, not a real skin
  case "$FILE" in
    */_template.css) echo "  $FILE — skipped (template)"; continue ;;
  esac

  echo "Linting $FILE"

  VIOLATIONS=0
  WARNINGS=0
  IN_BLOCK=0
  PREV_LINE=""
  EXCEPTION_PENDING=0
  LINE_NO=0

  while IFS= read -r LINE; do
    LINE_NO=$((LINE_NO + 1))
    TRIM=$(echo "$LINE" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')

    # Track skin-exception comments
    if echo "$TRIM" | grep -qE '^//[[:space:]]*SKIN-EXCEPTION'; then
      EXCEPTION_PENDING=1
      PREV_LINE="$TRIM"
      continue
    fi
    if echo "$TRIM" | grep -qE 'SKIN-EXCEPTION'; then
      EXCEPTION_PENDING=1
    fi

    # Skip blank lines, single-line comments, properties, closing braces
    if [ -z "$TRIM" ] || \
       echo "$TRIM" | grep -qE '^/\*' || \
       echo "$TRIM" | grep -qE '^\*' || \
       echo "$TRIM" | grep -qE '^\*/' || \
       echo "$TRIM" | grep -qE '^//' || \
       echo "$TRIM" | grep -qE '^\}' || \
       echo "$TRIM" | grep -qE "$PROPERTY_RE"; then
      continue
    fi

    # Selector line (ends with `{` or contains a `{`)
    if echo "$TRIM" | grep -qE '\{[[:space:]]*$|\{'; then
      SELECTOR=$(echo "$TRIM" | sed -E 's/[[:space:]]*\{.*$//')

      # Allow-list checks
      ALLOWED=0

      # 1. :root
      if echo "$SELECTOR" | grep -qE '^:root([[:space:]]+\[data-skin)?$'; then ALLOWED=1; fi
      # 2. [data-theme="dark"]
      if echo "$SELECTOR" | grep -qE '^\[data-theme="dark"\]$'; then ALLOWED=1; fi
      # 3. [data-skin="..."] alone
      if echo "$SELECTOR" | grep -qE '^\[data-skin="[a-z0-9-]+"\]$'; then ALLOWED=1; fi
      # 4. [data-skin="..."][data-theme="dark"]
      if echo "$SELECTOR" | grep -qE '^\[data-skin="[a-z0-9-]+"\]\[data-theme="dark"\]$'; then ALLOWED=1; fi
      # 5. @media wrapping (the @media line itself; the inner line gets checked separately)
      if echo "$SELECTOR" | grep -qE '^@media'; then ALLOWED=1; fi
      # 6. inside a @media block: [data-skin="..."]:not([data-theme="light"])
      if echo "$SELECTOR" | grep -qE '^\[data-skin="[a-z0-9-]+"\]:not\(\[data-theme="light"\]\)$'; then ALLOWED=1; fi

      if [ "$ALLOWED" -eq 0 ]; then
        # Check if it targets glacial component internals
        if echo "$SELECTOR" | grep -qE '\.glacial-'; then
          if [ "$EXCEPTION_PENDING" -eq 1 ]; then
            echo "  ⚠ line $LINE_NO: skin-exception (component-targeting selector with justification)"
            echo "    selector: $SELECTOR"
            WARNINGS=$((WARNINGS + 1))
            EXCEPTION_PENDING=0
          else
            echo "  ✗ line $LINE_NO: skin contract violation — selector targets .glacial-* internals"
            echo "    selector: $SELECTOR"
            echo "    fix: override the underlying token, or add a // SKIN-EXCEPTION: <reason> comment above this rule"
            VIOLATIONS=$((VIOLATIONS + 1))
          fi
        elif echo "$SELECTOR" | grep -qE '^[a-zA-Z]'; then
          # Bare element selector (h1, body, etc.) — also a violation unless excepted
          if [ "$EXCEPTION_PENDING" -eq 1 ]; then
            echo "  ⚠ line $LINE_NO: skin-exception (bare element selector with justification)"
            echo "    selector: $SELECTOR"
            WARNINGS=$((WARNINGS + 1))
            EXCEPTION_PENDING=0
          else
            echo "  ✗ line $LINE_NO: skin contract violation — bare element selector"
            echo "    selector: $SELECTOR"
            echo "    fix: scope under [data-skin=\"...\"], or add a // SKIN-EXCEPTION: <reason> comment"
            VIOLATIONS=$((VIOLATIONS + 1))
          fi
        elif echo "$SELECTOR" | grep -qE '^\[data-skin="[a-z0-9-]+"\]'; then
          # data-skin scoped selector targeting something else (h1, .x, etc.)
          # If it contains .glacial-* it's already caught above; otherwise it's
          # scoped and OK if it's targeting a header element like h1, h2, etc.
          # (warm-serif's serif-headings exception fits here)
          if [ "$EXCEPTION_PENDING" -eq 1 ]; then
            echo "  ⚠ line $LINE_NO: skin-exception (scoped element selector)"
            echo "    selector: $SELECTOR"
            WARNINGS=$((WARNINGS + 1))
            EXCEPTION_PENDING=0
          else
            echo "  ✗ line $LINE_NO: skin contract violation — selector goes beyond token override"
            echo "    selector: $SELECTOR"
            echo "    fix: only override tokens, or add a // SKIN-EXCEPTION: <reason> comment"
            VIOLATIONS=$((VIOLATIONS + 1))
          fi
        fi
      fi

      EXCEPTION_PENDING=0
    fi

    PREV_LINE="$TRIM"
  done < "$FILE"

  if [ "$VIOLATIONS" -gt 0 ]; then
    echo "  → $VIOLATIONS violation(s), $WARNINGS warning(s)"
    EXIT_CODE=1
  elif [ "$WARNINGS" -gt 0 ]; then
    echo "  → 0 violations, $WARNINGS warning(s) (all justified by SKIN-EXCEPTION)"
  else
    echo "  → ✓ contract clean"
  fi
done

exit "$EXIT_CODE"
